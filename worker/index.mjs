const base = "https://api.apprenticeships.education.gov.uk/vacancies";
const gov = "https://www.findapprenticeship.service.gov.uk";
const areas = {
 local:{label:"within 30 miles of Dartford",lat:51.446,lon:0.216,miles:30},
 kent:{label:"within 25 miles of Dartford",lat:51.446,lon:0.216,miles:25},
 london:{label:"within 15 miles of central London",lat:51.507,lon:-0.128,miles:15}
};
const tracks = {
 quant:/\b(?:quant(?:itative)?|data scien(?:ce|tist)|data analy(?:sis|st|tics)|data engineer|machine learning|actuar)/i,
 ai:/\b(?:ai|artificial intelligence|machine learning|data scien|data analy|data engineer)/i,
 software:/\b(?:software|developer|devops|platform engineer|digital and technology solutions)/i,
 cyber:/\b(?:cyber|security analyst|information security|security engineer)/i
};
const requests = new Map();

function matchingTracks(text) {
 return Object.entries(tracks).filter(([,pattern])=>pattern.test(text)).map(([key])=>key);
}

class DfEError extends Error {
 constructor(stage, code) {
  super("Display Advert API failure");
  this.stage = stage;
  this.code = code;
 }
}

async function getDfE(path, key, params = new URLSearchParams()) {
 const url = new URL(base + path);
 url.search = params;
 const stage = path === "/vacancy" ? "vacancies" : "standards";
 let response;
 try {
  response = await fetch(url,{
   headers:{Accept:"application/json","X-Version":"2","Ocp-Apim-Subscription-Key":key},
   redirect:"manual",signal:AbortSignal.timeout(7000)
  });
 } catch {
  throw new DfEError(stage,"transport");
 }
 if (!response.ok) throw new DfEError(stage,response.status);
 try { return await response.json(); }
 catch { throw new DfEError(stage,"invalid_json"); }
}

async function cached(key, ttl, load) {
 const previous = requests.get(key);
 if (previous && previous.expires > Date.now()) return previous.value;
 // Store completed responses so a later Worker invocation can reuse the data.
 const value = await load();
 requests.set(key,{expires:Date.now()+ttl,value});
 return value;
}

function dayInUK(date) {
 return new Date(date).toLocaleDateString("sv-SE",{timeZone:"Europe/London"});
}

function normaliseVacancy(vacancy, today) {
 const level = vacancy?.course?.level;
 if (!Number.isInteger(level) || level < 5 || typeof vacancy.title !== "string" ||
     !vacancy.title.trim() || typeof vacancy.employerName !== "string") return null;
 const closes = Date.parse(vacancy.closingDate);
 if (!Number.isFinite(closes) || dayInUK(closes) < today) return null;
 const ref = /^VAC[0-9]+$/i.test(vacancy.vacancyReference ?? "") ? vacancy.vacancyReference.toUpperCase() : "";
 let url;
 try {
  const target = new URL(vacancy.vacancyUrl);
  if (target.origin === gov && /^\/apprenticeship\/(?:reference\/)?[a-z0-9]+\/?$/i.test(target.pathname)) url = target.origin+target.pathname;
 } catch { /* Construct an official URL only for a valid reference. */ }
 if (!url && ref) url = gov+"/apprenticeship/"+ref;
 if (!url) return null;

 const relevant = matchingTracks(vacancy.title);
 if (!relevant.length) relevant.push(...matchingTracks(vacancy.course.title ?? ""));
 if (!relevant.length) return null;
 const postcodes = [...new Set((Array.isArray(vacancy.addresses) ? vacancy.addresses : [])
  .map(address=>typeof address?.postcode === "string" ? address.postcode.trim() : "").filter(Boolean))];
 const location = postcodes.length ? postcodes.slice(0,3).join(", ")+(postcodes.length>3 ? " + more" : "")
  : vacancy.isNationalVacancy ? "Nationwide" : "See advert for location";
 return {
  id:ref || url,title:vacancy.title.slice(0,180),company:vacancy.employerName.slice(0,160),level,
  tracks:relevant,location,course:String(vacancy.course.title ?? "").slice(0,150),
  starts:Number.isFinite(Date.parse(vacancy.startDate)) ? dayInUK(vacancy.startDate) : null,
  closes:dayInUK(closes),url
 };
}

async function loadApprenticeships(area, key) {
 const codes = await cached("standards",3600000,async ()=>{
  const {trainingCourses} = await getDfE("/referencedata/courses",key);
  if (!Array.isArray(trainingCourses)) throw new DfEError("standards","invalid_shape");
  const result = [...new Set(trainingCourses
   .filter(course=>Number.isInteger(course?.larsCode) && course.larsCode > 0 && matchingTracks(course.title ?? "").length)
   .map(course=>course.larsCode))];
  if (!result.length) throw new DfEError("standards","no_matching_codes");
  return result;
 });
 const found = new Map();
 const today = dayInUK(Date.now());
 let totalPages = 1;
 let page = 1;
 for (;page<=Math.min(totalPages,4);page++) {
  const params = new URLSearchParams({
   Lat:area.lat,Lon:area.lon,DistanceInMiles:area.miles,Sort:"DistanceAsc",PageNumber:page,PageSize:50
  });
  for (const code of codes) params.append("StandardLarsCode",code);
  const response = await getDfE("/vacancy",key,params);
  if (!Array.isArray(response.vacancies)) throw new DfEError("vacancies","invalid_shape");
  if (Number.isInteger(response.totalPages)) totalPages = response.totalPages;
  for (const vacancy of response.vacancies) {
   const item = normaliseVacancy(vacancy,today);
   if (item && !found.has(item.id)) found.set(item.id,item);
  }
 }
 return {status:"ready",area:area.label,checkedAt:new Date().toISOString(),vacancies:[...found.values()],partial:totalPages>=page};
}

async function apprenticeshipResponse(request, env) {
 if (request.method !== "GET") return new Response(null,{status:405,headers:{Allow:"GET"}});
 const area = new URL(request.url).searchParams.get("area") || "local";
 const json = (data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
 if (!Object.hasOwn(areas,area)) return json({status:"invalid_area"},400);
 const key = env.APPRENTICESHIPS_API_KEY?.trim();
 if (!key) return json({status:"not_configured"});
 try {
  return json(await cached("area:"+area,1800000,()=>loadApprenticeships(areas[area],key)));
 } catch (error) {
  const diagnostic = error instanceof DfEError ? {stage:error.stage,code:error.code} : {stage:"processing",code:"unexpected"};
  return json({status:"unavailable",diagnostic},502);
 }
}

export default {
 async fetch(request, env = {}) {
  const path = new URL(request.url).pathname;
  if (path === "/api/applications") return applicationsResponse(request,env);
  if (path === "/api/apprenticeships") return apprenticeshipResponse(request,env);
  if (!Object.hasOwn(academyAssets,path)) return new Response("Page unavailable",{status:404});
  if (!["GET","HEAD"].includes(request.method)) return new Response(null,{status:405,headers:{Allow:"GET, HEAD"}});
  const [type,content] = academyAssets[path];
  return new Response(request.method === "HEAD" ? null : content,{
   headers:{"Content-Type":type,"X-Content-Type-Options":"nosniff","Cache-Control":"no-cache"}
  });
 }
};
