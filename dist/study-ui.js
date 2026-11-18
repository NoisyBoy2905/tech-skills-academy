"use strict";

const studySections = {
 curriculum:{name:"Curriculum",icon:"book",description:"Choose a subject to see its lessons."},
 practice:{name:"Practice",icon:"target",description:"Work through challenges or test your exam knowledge."},
 labs:{name:"Labs",icon:"flask",description:"Apply what you’ve learned in projects and practical scenarios."}
};
const certifications = [{
 id:"security-plus",name:"CompTIA Security+",code:"SY0-701",icon:"shield",color:"mint",
 description:"Study the five exam domains, practise exam questions and work through performance-based labs.",
 routes:{curriculum:"curriculum/security-plus",practice:"practice/security-plus",labs:"labs/security-plus"},
 overview:()=>securityCertificationOverview()
}];
function sectionTabs(label, links) {
 const route = [page,part,subpart].filter(Boolean).join("/");
 return `<nav class="section-tabs" aria-label="${label}">${links.map(([href,text,selected]) =>
  `<a href="#${href}"${href === route ? ' class="active" aria-current="page"' : selected ? ' class="active" aria-current="location"' : ""}>${text}</a>`
 ).join("")}</nav>`;
}

function careerTabs() {
 return sectionTabs("Careers",[
  ["careers","Career tracks",page === "careers"],
  ["opportunities","Opportunities",page === "opportunities"],
  ["applications","My applications",page === "applications"]
 ]);
}

function studyNavigation({active,track}, certificate) {
 const overview = certificate ? "certifications" : "careers";
 const routes = certificate?.routes ?? Object.fromEntries(Object.keys(studySections).map(section=>[section,section+"/"+track]));
 return sectionTabs("Study materials",[
  [overview+"/"+track,"Overview",active === overview],
  ...Object.entries(routes).map(([section,route])=>[route,studySections[section].name,active === section])
 ]);
}

function certificationsPage() {
 if (part) return certifications.find(cert=>cert.id===part)?.overview() ?? missing("certifications");
 const [featured,...others] = certifications;
 return `${intro("Certifications","Browse credentials and open the study materials for each exam.")}
 ${sectionTabs("Certifications",[["certifications","Catalogue"],["progress","My progress"]])}
 ${catalogueHero({label:featured.code,title:featured.name,description:featured.description,symbol:featured.icon,
  buttons:view("certifications/"+featured.id,"View study plan","primary"),meta:`${lessons.length} lessons · ${domains.length} domains · ${labs.length} labs`})}
 ${others.length ? `<section class="dash-section">${head("More certifications","Choose another exam to study.")}
 <div class="career-grid catalogue-grid">${others.map(cert=>`<a class="card career-card" href="#certifications/${cert.id}">
 <div class="card-top">${iconTile(cert.icon,cert.color)}<span class="tag">${cert.code}</span></div>
 <h3>${cert.name}</h3><p>${cert.description}</p></a>`).join("")}</div></section>` : ""}`;
}

function currentStudySection() {
 if (page==="certifications") return {active:page,track:part || undefined};
 if (page==="lesson") return {active:"curriculum",track:"security-plus"};
 if (page==="careers" && part) {
  const track = careerTracks.find(item=>item.id===part);
  if (track) {
   if (subpart==="project") return {active:"labs",track:part};
   if (careerChallenges[part].some(item=>item.id===subpart)) return {active:"practice",track:part};
   if (track.lessons.some(item=>item.id===subpart)) return {active:"curriculum",track:part};
   if (!subpart) return {active:page,track:part};
  }
 }
 if (Object.hasOwn(studySections,page) && part) {
  return {active:page,track:trackIds.includes(part)?part:"security-plus"};
 }
 return {active:page};
}

function studyOverview(section) {
 const {name,description} = studySections[section];
 return `${intro(name,description)}
 <div class="career-grid">${careerTracks.map(track=>{
  const summary = section==="curriculum" ? track.description :
   section==="practice" ? `${careerChallenges[track.id].length} challenges with feedback.` : track.project.title;
  return `<a class="card career-card" href="#${section}/${track.id}">
    <div class="card-top">${iconTile(track.icon,track.color)}${icon("arrow")}</div>
    <h3>${track.name}</h3><p>${summary}</p></a>`;
 }).join("")}</div>`;
}

function studyTrackPage(section,track) {
 const descriptions = {
  curriculum:track.description,
  practice:"Choose a challenge and check your understanding.",
  labs:"Apply this track’s skills in a browser-based project."
 };
 const content = section==="curriculum" ? careerLessonRows(track) :
  section==="practice" ? challengeCards(track,false) : careerProjectCard(track);
 return `${back(section,"All "+studySections[section].name.toLowerCase())}
 ${intro(track.name,descriptions[section],studySections[section].name)}${content}`;
}
