"use strict";

const opportunitiesChecked = "2026-11-17";
const apprenticeshipSite = "https://www.findapprenticeship.service.gov.uk";
const opportunities = [
 {title:"Data Science Apprenticeship",company:"British Airways",location:"Harmondsworth, London",area:"london",type:"apprentice",level:"Level 6",pay:"£27,611 a year",starts:"2027-09-01",closes:"2026-11-19",tracks:["ai"],detail:"A data science degree route in the airline’s Data and AI department.",url:apprenticeshipSite+"/apprenticeship/VAC2000059816"},
 {title:"Software Development Engineer Apprentice",company:"Amazon",location:"Worship Street, London",area:"london",type:"apprentice",level:"Level 6",pay:"Competitive",starts:"2027-09-06",closes:"2026-12-21",tracks:["software"],detail:"A software engineering degree route covering coding, testing and code reviews.",url:apprenticeshipSite+"/apprenticeship/reference/2000063426"},
 {title:"Cyber Security Apprentice",company:"Amazon",location:"City of London",area:"london",type:"apprentice",level:"Level 6",pay:"Competitive",starts:"2027-09-06",closes:"2027-02-01",tracks:["cyber"],detail:"Security operations and incident response, with some travel to the training provider in Gloucester.",url:apprenticeshipSite+"/apprenticeship/VAC2000063307"},
 {title:"Data Analyst Degree Apprentice",company:"Amazon",location:"Worship Street, London",area:"london",type:"apprentice",level:"Level 6",pay:"Competitive",starts:"2027-09-06",closes:"2027-02-01",tracks:["quant","ai"],detail:"Related route through data analysis. Practise working with messy data and explaining findings.",url:apprenticeshipSite+"/apprenticeship/VAC2000063573"},
 {title:"Quantitative Strategy Developer Graduate",company:"Susquehanna",location:"London",area:"london",type:"job",level:"Graduate",reviewBy:"2026-12-01",tracks:["quant","software"],detail:"August 2027 intake. Graduate role in trading systems, quantitative analysis and C++ development.",url:"https://careers.sig.com/jobs/11344?lang=en-us"},
 {title:"Software Engineer – New Grad",company:"Scale AI",location:"London",area:"london",type:"job",level:"Graduate",reviewBy:"2026-12-01",tracks:["ai","software"],detail:"Build products using AI infrastructure. The advert asks for a relevant degree or equivalent and a specified graduation window.",url:"https://job-boards.greenhouse.io/scaleai/jobs/4730862005"}
];
const opportunitySearch = {
 all:["technology","junior software developer"],
 quant:["data analyst","quantitative developer"],
 ai:["data science","junior machine learning engineer"],
 software:["software","junior software developer"],
 cyber:["cyber security","junior cyber security analyst"]
};
const opportunityTypes = {all:"All types",apprentice:"Level 5+ apprenticeships",job:"Jobs & graduate roles"};
const opportunityAreas = {
 local:{label:"Kent & London",apprentice:"Dartford",miles:"30",job:"Greater London"},
 kent:{label:"Dartford & Kent",apprentice:"Dartford",miles:"25",job:"Kent"},
 london:{label:"London",apprentice:"London",miles:"15",job:"London"}
};
function ukToday(now = new Date()) {
 const parts = new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit"})
  .formatToParts(now);
 const day = Object.fromEntries(parts.map(({type,value})=>[type,value]));
 return `${day.year}-${day.month}-${day.day}`;
}
function opportunityDate(date) {
 return new Intl.DateTimeFormat("en-GB",{timeZone:"UTC",day:"numeric",month:"short",year:"numeric"}).format(new Date(date));
}
function matchingOpportunities(track,type,area,today = ukToday()) {
 return opportunities.filter(item=>
  (track === "all" || item.tracks.includes(track)) &&
  (type === "all" || item.type === type) &&
  (area === "local" || item.area === area) &&
  (item.closes || item.reviewBy) >= today
 );
}
function opportunitySearchUrls(track,area) {
 const [apprentice,job] = opportunitySearch[track];
 const place = opportunityAreas[area];
 const faa = new URL("/apprenticeships",apprenticeshipSite);
 for (const level of ["5","6","7"]) faa.searchParams.append("levelIds",level);
 for (const [key,value] of Object.entries({searchTerm:apprentice,location:place.apprentice,distance:place.miles,sort:"DistanceAsc"})) faa.searchParams.set(key,value);
 const indeed = new URL("https://uk.indeed.com/jobs");
 indeed.search = new URLSearchParams({q:job,l:place.job});
 const kentJobs = new URL(indeed);
 kentJobs.searchParams.set("l","Kent");
 return {faa:faa.href,indeed:indeed.href,kentJobs:kentJobs.href};
}
function opportunityExternal(url,label,style = "ghost") {
 return `<a class="button ${style}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}${icon("external")}</a>`;
}
function opportunityCard(item) {
 const source = item.type === "apprentice" ? "GOV.UK" : item.company;
 const tags = item.tracks.map(id=>careerTracks.find(track=>track.id===id).name).join(" · ");
 return `<article class="card vacancy-card">
  <div class="vacancy-tags"><span class="tag">${item.type==="apprentice"?"Apprenticeship":"Job"}</span><span class="tag">${item.level}</span></div>
  <h3>${item.title}</h3><p class="vacancy-company">${item.company} · ${item.location}</p>
  <p class="vacancy-description">${item.detail}</p><p class="vacancy-track">${tags}</p>
  <div class="vacancy-dates">${[item.pay,item.starts && "Starts "+opportunityDate(item.starts),item.closes ? "Closes "+opportunityDate(item.closes) : "Check deadline on employer site"].filter(Boolean).join(" · ")}</div>
  <a class="text-link vacancy-link" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="View ${esc(item.title)} at ${esc(item.company)}">View on ${source} ${icon("external")}</a>
  ${opportunityApplicationControl(item)}
 </article>`;
}
function opportunityResults(track,type,area) {
 const urls = opportunitySearchUrls(track,area);
 const matches = matchingOpportunities(track,type,area);
 return `<div class="opportunity-searches">
  ${type!=="job" ? opportunityExternal(urls.faa,"Search Level 5+ apprenticeships") : ""}
  ${type!=="apprentice" ? opportunityExternal(urls.indeed,area==="local"?"Search London jobs":"Search jobs on Indeed") : ""}
  ${type!=="apprentice" && area==="local" ? opportunityExternal(urls.kentJobs,"Search Kent jobs") : ""}
  </div>
  ${type!=="job" ? `<section class="dash-section" data-live-vacancies data-track="${track}" data-area="${area}" aria-labelledby="live-vacancy-heading">
    <h2 id="live-vacancy-heading">Live Level 5+ apprenticeships</h2><p class="section-sub live-vacancy-status" role="status">Checking GOV.UK…</p><div class="live-vacancy-results"></div>
  </section>` : ""}
  <section class="dash-section" aria-labelledby="vacancy-heading">
   <div class="section-heading"><div><h2 id="vacancy-heading">Selected vacancies</h2>
    <p class="section-sub">Sources checked ${opportunityDate(opportunitiesChecked)}. Open the original advert for current availability and entry requirements.</p></div>
    <span class="tag">${matches.length} ${matches.length===1?"match":"matches"}</span></div>
   ${matches.length ? `<div class="vacancy-grid">${matches.map(opportunityCard).join("")}</div>` : '<p class="panel">No selected vacancies match these filters. Try a wider area or open a live search above.</p>'}
  </section>`;
}
function opportunitiesPage() {
 const chosen = Object.hasOwn(opportunitySearch,part) ? part : "all";
 return `${intro("Opportunities","Find Level 5+ apprenticeships and early-career jobs related to your career tracks.")}
 ${careerTabs()}
 <p id="application-notice" class="small-note" role="status"></p>
 <form id="opportunity-filters" class="panel form-row" aria-label="Filter opportunities">
  <label for="opportunity-track">Career track<select id="opportunity-track" name="track">
   <option value="all">All career tracks</option>${careerTracks.map(track=>`<option value="${track.id}" ${track.id===chosen?"selected":""}>${track.name}</option>`).join("")}</select></label>
  <label for="opportunity-type">Opportunity type<select id="opportunity-type" name="type">${Object.entries(opportunityTypes).map(([value,label])=>`<option value="${value}">${label}</option>`).join("")}</select></label>
  <label for="opportunity-area">Area<select id="opportunity-area" name="area">${Object.entries(opportunityAreas).map(([value,area])=>`<option value="${value}">${area.label}</option>`).join("")}</select></label>
 </form>
 <p id="opportunity-status" class="visually-hidden" role="status"></p>
 <div id="opportunity-results">${opportunityResults(chosen,"all","local")}</div>`;
}

const liveApprenticeshipRequests = new Map();

function getLiveApprenticeships(area) {
 const cached = liveApprenticeshipRequests.get(area);
 if (cached && cached.expires > Date.now()) return cached.response;
 const response = fetch("/api/apprenticeships?"+new URLSearchParams({area}),{signal:AbortSignal.timeout(16000)})
  .then(async result=>{
   const data = await result.json();
   if (data.status === "not_configured") return data;
   if (!result.ok || data.status !== "ready" || !Array.isArray(data.vacancies)) throw new Error("Apprenticeships unavailable");
   return data;
  }).catch(()=>({status:"unavailable"}));
 liveApprenticeshipRequests.set(area,{expires:Date.now()+60000,response});
 return response;
}
function liveApprenticeshipCard(item) {
 const href = new URL(item.url);
 if (href.origin !== apprenticeshipSite || !href.pathname.startsWith("/apprenticeship/")) return "";
 return `<article class="card vacancy-card">
  <div class="vacancy-tags"><span class="tag">Apprenticeship</span><span class="tag">Level ${esc(item.level)}</span></div>
  <h3>${esc(item.title)}</h3><p class="vacancy-company">${esc(item.company)} · ${esc(item.location)}</p>
  ${item.course ? `<p class="vacancy-description">${esc(item.course)}</p>` : ""}
  <div class="vacancy-dates">Closes ${opportunityDate(item.closes)}${item.starts ? " · Starts "+opportunityDate(item.starts) : ""}</div>
  <a class="text-link vacancy-link" href="${esc(href.href)}" target="_blank" rel="noopener noreferrer" aria-label="View ${esc(item.title)} at ${esc(item.company)}">View on GOV.UK ${icon("external")}</a>
  ${opportunityApplicationControl(item)}</article>`;
}
async function showLiveApprenticeships() {
 const panel = main.querySelector("[data-live-vacancies]");
 if (!panel) return;
 const status = panel.querySelector(".live-vacancy-status");
 const results = await getLiveApprenticeships(panel.dataset.area);
 if (!panel.isConnected) return;
 if (results.status !== "ready") {
  status.textContent = results.status === "not_configured" ?
   "Live listings are paused until the GOV.UK API key is configured. Use the GOV.UK search above or browse the selected vacancies below." :
   "Live listings couldn’t load. Use the GOV.UK search above or browse the selected vacancies below.";
  return;
 }
 const track = panel.dataset.track;
 const today = ukToday();
 const matching = results.vacancies.filter(item=>item.closes>=today && (track==="all" || item.tracks.includes(track)));
 const refreshed = new Date(results.checkedAt).toLocaleString("en-GB",{timeZone:"Europe/London",dateStyle:"medium",timeStyle:"short"});
 status.textContent = `${matching.length} ${matching.length===1?"match":"matches"} ${results.area}. Updated ${refreshed} UK time.`+
  (results.partial ? " Only the first pages are shown. Use the GOV.UK search for more." : "");
 panel.querySelector(".live-vacancy-results").innerHTML = matching.length ?
  `<div class="vacancy-grid">${matching.map(liveApprenticeshipCard).join("")}</div>` :
  '<p class="panel">No matching live apprenticeships. Try another career track or area.</p>';
 updateApplicationControls();
}
