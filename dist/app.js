"use strict";

// Small shell for the bare-bones site: three pages and a few shared helpers.
const esc = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const shapes = {
 external:'<path d="M13 4h7v7m0-7-9 9m6 0v6H5V7h6"/>',
 arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>'
};
const icon = name => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" aria-hidden="true">${shapes[name] || shapes.arrow}</svg>`;
const main = document.querySelector("#main");
const topbar = document.querySelector("#topbar");
const academyName = "Tech Skills Academy";
const routes = {home:"Home",opportunities:"Jobs",applications:"Applications"};
let page = "home";
let part = "";

const intro = (title, description, label = "") =>
 `<div class="intro">${label ? `<div class="eyebrow">${label}</div>` : ""}<h1>${title}</h1><p>${description}</p></div>`;

function homePage() {
 return `<div class="intro home-intro">
  <div class="eyebrow">Tech Skills Academy</div>
  <h1>A clean slate.</h1>
  <p>The old lessons have been taken out. They are saved in a file, ready to add back one at a time.</p>
 </div>
 <ul class="home-links">
  <li><a href="#opportunities"><span>Jobs</span><small>Live Level 5+ apprenticeships and graduate roles</small>${icon("arrow")}</a></li>
  <li><a href="#applications"><span>Applications</span><small>Track what you have applied for</small>${icon("arrow")}</a></li>
 </ul>`;
}

function missingPage() {
 return `${intro("Page not found","That page doesn’t exist.")}<p><a class="text-link" href="#home">Back to home</a></p>`;
}

function shell() {
 const link = id => `<a href="#${id}"${page === id ? ' class="active" aria-current="page"' : ""}>${routes[id]}</a>`;
 topbar.innerHTML = `<div class="topbar-inner"><a class="brand" href="#home">${academyName}</a>
  <nav class="primary-nav" aria-label="Main">${link("home")}${link("opportunities")}${link("applications")}</nav></div>`;
}

function render(focus = false) {
 const hash = location.hash.slice(1);
 const [section = "home", sectionId = "", ...extra] = (hash || "home").split("/");
 page = section;
 part = sectionId;
 const valid = Object.hasOwn(routes,page) && !extra.length &&
  (page === "opportunities" || !part) &&
  (page !== "opportunities" || !part || Object.hasOwn(opportunitySearch,part));
 if (!valid) page = "";
 shell();
 const pages = {home:homePage,opportunities:opportunitiesPage,applications:applicationsPage};
 main.className = "page";
 main.innerHTML = valid ? pages[page]() : missingPage();
 if (page === "opportunities") showLiveApprenticeships();
 if (page === "opportunities" || page === "applications") {
  if (applicationRecords) updateApplicationControls();
  else loadApplicationRecords();
 }
 document.title = (main.querySelector("h1")?.textContent || academyName) + " | " + academyName;
 if (focus) {
  main.focus({preventScroll:true});
  window.scrollTo(0,0);
 }
}

window.addEventListener("hashchange", () => render(true));
document.addEventListener("click", event => {
 if (event.target.closest(".skip")) {
  event.preventDefault();
  main.focus();
 }
});
document.addEventListener("submit", event => {
 const target = event.target;
 if (target.dataset.form !== "add-application") return;
 event.preventDefault();
 if (!main.contains(target) || !target.reportValidity()) return;
 addApplication(target,new FormData(target));
});
document.addEventListener("change", event => {
 if (event.target.matches("select[data-application-url],select[data-application-id]")) {
  updateApplicationStatus(event.target);
  return;
 }
 const filters = event.target.closest("#opportunity-filters");
 if (!filters) return;
 const {track,type,area} = Object.fromEntries(new FormData(filters));
 if (!Object.hasOwn(opportunitySearch,track) || !Object.hasOwn(opportunityTypes,type) || !Object.hasOwn(opportunityAreas,area)) return;
 document.querySelector("#opportunity-results").innerHTML = opportunityResults(track,type,area);
 document.querySelector("#opportunity-status").textContent = matchingOpportunities(track,type,area).length + " matching selected vacancies";
 showLiveApprenticeships();
 updateApplicationControls();
});
render();
