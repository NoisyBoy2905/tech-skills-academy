import assert from "node:assert/strict";
import {default as worker} from "../dist/server/index.js";

const site = "https://academy.example";
const endpoint = (area = "local", method = "GET") => new Request(site+"/api/apprenticeships?area="+area,{method});
const env = {APPRENTICESHIPS_API_KEY:"fixture-key"};
const html = await worker.fetch(new Request(site));
assert.equal(html.status,200);
assert.match(await html.text(),/Tech Skills Academy/);
assert.match((await worker.fetch(new Request(site+"/opportunities.js"))).headers.get("Content-Type"),/javascript/);
assert.equal((await worker.fetch(new Request(site+"/server/index.js"))).status,404);
assert.equal((await worker.fetch(endpoint("europe"),env)).status,400);
assert.equal((await worker.fetch(endpoint("local","POST"),env)).status,405);
assert.deepEqual(await (await worker.fetch(endpoint())).json(),{status:"not_configured"});

const example = {
 title:"Data Science Apprentice",employerName:"Example Employer",closingDate:"2099-02-01T23:59:00Z",
 startDate:"2099-09-01T00:00:00Z",course:{level:6,title:"Data scientist (integrated degree)"},
 addresses:[{postcode:"DA1 1AA"},{postcode:"EC2A 2FA"}],vacancyReference:"VAC123",
 vacancyUrl:"https://www.findapprenticeship.service.gov.uk/apprenticeship/VAC123"
};
const lookups = [];
globalThis.fetch = async (url,{headers,redirect})=>{
 assert.equal(url.origin,"https://api.apprenticeships.education.gov.uk");
 assert.equal(headers["X-Version"],"2");
 assert.equal(headers["Ocp-Apim-Subscription-Key"],"fixture-key");
 assert.equal(redirect,"manual");
 lookups.push(url);
 if (url.pathname.endsWith("courses")) return Response.json({trainingCourses:[
  {title:"Data scientist",larsCode:12},{title:"Baker",larsCode:50}
 ]});
 assert.deepEqual(url.searchParams.getAll("StandardLarsCode"),["12"]);
 const page = url.searchParams.get("PageNumber");
 return Response.json({totalPages:2,vacancies:page==="1" ? [
  example,
  {...example,vacancyReference:"VAC3",course:{...example.course,level:3}},
  {...example,vacancyReference:"VAC4",closingDate:"2020-02-01T23:59:00Z"},
  {...example,vacancyReference:null,vacancyUrl:"https://not-gov.example/apprenticeship/VAC123"}
 ] : [example,{...example,vacancyReference:"VAC110",vacancyUrl:null,course:{...example.course,level:5}}]});
};
const response = await worker.fetch(endpoint(),env);
assert.equal(response.status,200);
const result = await response.json();
assert.equal(result.status,"ready");
assert.equal(result.vacancies.length,2);
assert.equal(result.vacancies[0].location,"DA1 1AA, EC2A 2FA");
assert.deepEqual(result.vacancies[0].tracks,["quant","ai"]);
assert.equal(result.vacancies[1].url,"https://www.findapprenticeship.service.gov.uk/apprenticeship/VAC110");
assert.doesNotMatch(JSON.stringify(result),/fixture-key/);
assert.equal(result.partial,false);
assert.equal(lookups.length,3);
assert.equal(lookups[1].searchParams.get("DistanceInMiles"),"30");
assert.equal(lookups[2].searchParams.get("PageNumber"),"2");
assert.deepEqual(await (await worker.fetch(endpoint(),env)).json(),result);
assert.equal(lookups.length,3);
globalThis.fetch = async ()=>new Response("API unauthorised",{status:401});
const failed = await worker.fetch(endpoint("london"),env);
assert.equal(failed.status,502);
assert.deepEqual(await failed.json(),{status:"unavailable",diagnostic:{stage:"vacancies",code:401}});
globalThis.fetch = async ()=>new Response(null,{status:302,headers:{Location:"https://untrusted.example"}});
const redirected = await worker.fetch(endpoint("kent"),env);
assert.deepEqual(await redirected.json(),{status:"unavailable",diagnostic:{stage:"vacancies",code:302}});
console.log("Worker routing, missing-key fallback, v2 requests, Level 5+ filtering, pagination, caching and failure handling passed.");
