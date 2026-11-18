"use strict";

// Learning site: subjects -> lessons -> short quiz. Jobs and Applications are small extras.
const esc = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const shapes = {
 external:'<path d="M13 4h7v7m0-7-9 9m6 0v6H5V7h6"/>',
 arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>'
};
const icon = name => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" aria-hidden="true">${shapes[name] || shapes.arrow}</svg>`;
const main = document.querySelector("#main");
const topbar = document.querySelector("#topbar");
const academyName = "Tech Skills Academy";
let page = "home";
let part = "";

/* ---------- subjects (built from the content files) ---------- */
// Security+ lessons are stored as arrays: [id, title, intro, ideas[], example, question1, question2]
// and a question is [text, correct answer, wrong, wrong, wrong, explanation].
function buildSubjects() {
 const security = {
  id:"security-plus", kind:"Certification", name:"CompTIA Security+",
  blurb:"SY0-701 exam prep, one short lesson at a time.",
  sections:domains.map((d,i) => ({
   name:d.name, summary:d.summary + " (" + d.weight + "% of the exam)",
   lessons:lessons.filter(l => Number(l[0][0]) === i + 1).map(l => ({
    id:l[0], title:l[1], intro:l[2], ideas:l[3], example:l[4],
    questions:[l[5], l[6]].map(q => ({text:q[0], options:q.slice(1,5), correct:0, why:q[5]}))
   }))
  }))
 };
 const tracks = careerTracks.map(t => ({
  id:t.id, kind:"Career track", name:t.name, blurb:t.description,
  sections:[{name:t.name, summary:t.tools, lessons:t.lessons.map(l => ({
   id:l.id, title:l.title, intro:l.intro, ideas:l.concepts, example:l.example,
   questions:[{text:l.q, options:l.options, correct:l.correct, why:l.reason}]
  }))}]
 }));
 return [security, ...tracks];
}
const subjects = buildSubjects();
const subjectById = id => subjects.find(s => s.id === id);
const lessonList = subject => subject.sections.flatMap(s => s.lessons);
const lessonKey = (subject, lesson) => subject.id + "/" + lesson.id;

/* ---------- progress, saved in this browser only ---------- */
const STORE = "tsa-progress-v1";
let progress = {done:{}, answers:{}, last:""};
try { progress = Object.assign(progress, JSON.parse(localStorage.getItem(STORE)) || {}); } catch (e) { /* private mode: keep in memory */ }
function saveProgress() { try { localStorage.setItem(STORE, JSON.stringify(progress)); } catch (e) { /* ignore */ } }
const doneCount = subject => lessonList(subject).filter(l => progress.done[lessonKey(subject, l)]).length;

// Same shuffle every time for a given question, so answers don't jump around when the page redraws.
function seeded(text) {
 let h = 2166136261;
 for (const c of text) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
 return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function shuffledOptions(question, seed) {
 const items = question.options.map((text, i) => ({text, right:i === question.correct}));
 const next = seeded(seed);
 for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
 return items;
}

/* ---------- pages ---------- */
const intro = (title, description, label = "") =>
 `<div class="intro">${label ? `<div class="eyebrow">${label}</div>` : ""}<h1>${title}</h1><p>${description}</p></div>`;

function progressBar(done, total) {
 return `<div class="bar" role="img" aria-label="${done} of ${total} lessons done"><span style="width:${total ? Math.round(done / total * 100) : 0}%"></span></div>`;
}

function subjectCard(subject) {
 const total = lessonList(subject).length, done = doneCount(subject);
 return `<li><a class="subject" href="#subject/${subject.id}">
  <span class="subject-kind">${subject.kind}</span>
  <span class="subject-name">${esc(subject.name)}</span>
  <span class="subject-blurb">${esc(subject.blurb)}</span>
  ${progressBar(done, total)}
  <span class="subject-count">${done} of ${total} lessons done</span>
 </a></li>`;
}

function homePage() {
 let resume = "";
 const [sid, lid] = progress.last.split("/");
 const subject = subjectById(sid), lesson = subject && lessonList(subject).find(l => l.id === lid);
 if (lesson) {
  resume = `<a class="resume" href="#lesson/${subject.id}/${lesson.id}"><span><small>Pick up where you left off</small><strong>${esc(lesson.title)}</strong><em>${esc(subject.name)}</em></span>${icon("arrow")}</a>`;
 }
 const group = kind => `<ul class="subjects">${subjects.filter(s => s.kind === kind).map(subjectCard).join("")}</ul>`;
 return `${intro("What do you want to learn?","Pick a subject. Each lesson is a few minutes of reading and then a quick quiz. Your progress is saved in this browser.")}
 ${resume}
 <h2 class="group-title">Certification</h2>${group("Certification")}
 <h2 class="group-title">Career tracks</h2>${group("Career track")}`;
}

function subjectPage() {
 const subject = subjectById(part);
 const total = lessonList(subject).length, done = doneCount(subject);
 const sections = subject.sections.map(section => `<section class="section">
  ${subject.sections.length > 1 ? `<h2>${esc(section.name)}</h2><p class="section-sub">${esc(section.summary)}</p>` : `<p class="section-sub">${esc(section.summary)}</p>`}
  <ol class="lesson-list">${section.lessons.map(l => {
   const isDone = progress.done[lessonKey(subject, l)];
   return `<li><a href="#lesson/${subject.id}/${l.id}"><span class="tick${isDone ? " on" : ""}" aria-hidden="true">${isDone ? "✓" : ""}</span><span class="lesson-title">${esc(l.title)}</span><span class="visually-hidden">${isDone ? "(done)" : ""}</span>${icon("arrow")}</a></li>`;
  }).join("")}</ol></section>`).join("");
 return `<p class="crumbs"><a href="#home">All subjects</a></p>
 ${intro(esc(subject.name), esc(subject.blurb), subject.kind)}
 <div class="overall">${progressBar(done, total)}<span>${done} of ${total} lessons done</span></div>
 ${sections}`;
}

function quizHtml(subject, lesson) {
 const key = lessonKey(subject, lesson);
 const saved = progress.answers[key] || {};
 return lesson.questions.map((q, qi) => {
  const options = shuffledOptions(q, key + "#" + qi);
  const picked = saved[qi];
  const answered = picked !== undefined;
  const buttons = options.map((o, i) => {
   let state = "";
   if (answered && o.right) state = " right";
   else if (answered && i === picked) state = " wrong";
   return `<button type="button" class="choice${state}" data-q="${qi}" data-i="${i}"${answered ? " disabled" : ""}><span class="letter">${"ABCD"[i]}</span><span>${esc(o.text)}</span></button>`;
  }).join("");
  const verdict = answered ? `<div class="feedback ${options[picked].right ? "ok" : "no"}" id="fb-${qi}" tabindex="-1"><strong>${options[picked].right ? "Correct." : "Not quite."}</strong> ${esc(q.why)} <button type="button" class="link-button" data-retry="${qi}">Try again</button></div>` : "";
  return `<div class="question"><p class="q-text"><span class="q-num">Question ${qi + 1}</span>${esc(q.text)}</p><div class="choices">${buttons}</div>${verdict}</div>`;
 }).join("");
}

function lessonPage() {
 const subject = subjectById(part), all = lessonList(subject);
 const lesson = all.find(l => l.id === lessonId), at = all.indexOf(lesson);
 const section = subject.sections.find(s => s.lessons.includes(lesson));
 const key = lessonKey(subject, lesson);
 const prev = all[at - 1], next = all[at + 1];
 const isDone = progress.done[key];
 progress.last = key; saveProgress();
 return `<p class="crumbs"><a href="#home">All subjects</a> / <a href="#subject/${subject.id}">${esc(subject.name)}</a></p>
 <article class="lesson">
  <div class="eyebrow">${esc(section.name)} · Lesson ${at + 1} of ${all.length}</div>
  <h1>${esc(lesson.title)}</h1>
  <p class="lead">${esc(lesson.intro)}</p>
  <h2>Key ideas</h2>
  <ul class="ideas">${lesson.ideas.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
  <aside class="example"><h2>Example</h2><p>${esc(lesson.example)}</p></aside>
  <h2>Check yourself</h2>
  <div id="quiz">${quizHtml(subject, lesson)}</div>
  <div class="lesson-nav">
   ${prev ? `<a class="button" href="#lesson/${subject.id}/${prev.id}">← Previous</a>` : `<span></span>`}
   <button type="button" class="button dark" data-complete>${isDone ? "Done ✓ Next lesson" : "Mark done and continue"}${icon("arrow")}</button>
  </div>
  ${next ? "" : `<p class="small-note">This is the last lesson in ${esc(subject.name)}.</p>`}
 </article>`;
}

function missingPage() {
 return `${intro("Page not found","That page doesn’t exist.")}<p><a class="text-link" href="#home">Back to the lessons</a></p>`;
}

/* ---------- routing ---------- */
let lessonId = "";
const navItems = [["home","Learn"],["opportunities","Jobs"],["applications","Applications"]];
function shell() {
 const group = page === "subject" || page === "lesson" ? "home" : page;
 const link = ([id, label]) => `<a href="#${id}"${group === id ? ' class="active" aria-current="page"' : ""}>${label}</a>`;
 topbar.innerHTML = `<div class="topbar-inner"><a class="brand" href="#home">${academyName}</a><nav class="primary-nav" aria-label="Main">${navItems.map(link).join("")}</nav></div>`;
}

function render(focus = false) {
 const hash = location.hash.slice(1);
 const [section = "home", a = "", b = "", ...extra] = (hash || "home").split("/");
 page = section; part = a; lessonId = b;
 const subject = subjectById(a);
 const valid = !extra.length && ({
  home:() => !a && !b,
  subject:() => subject && !b,
  lesson:() => subject && lessonList(subject).some(l => l.id === b),
  opportunities:() => !b && (!a || Object.hasOwn(opportunitySearch, a)),
  applications:() => !a && !b
 }[section] || (() => false))();
 if (!valid) page = "";
 shell();
 const pages = {home:homePage, subject:subjectPage, lesson:lessonPage, opportunities:opportunitiesPage, applications:applicationsPage};
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
  window.scrollTo(0, 0);
 }
}

window.addEventListener("hashchange", () => render(true));
document.addEventListener("click", event => {
 if (event.target.closest(".skip")) {
  event.preventDefault();
  main.focus();
  return;
 }
 if (page !== "lesson") return;
 const subject = subjectById(part), all = lessonList(subject), lesson = all.find(l => l.id === lessonId);
 const key = lessonKey(subject, lesson);
 const choice = event.target.closest("[data-i]");
 const retry = event.target.closest("[data-retry]");
 if (choice) {
  progress.answers[key] = Object.assign({}, progress.answers[key], {[choice.dataset.q]:Number(choice.dataset.i)});
  saveProgress();
  render();
  document.querySelector("#fb-" + choice.dataset.q)?.focus({preventScroll:true});
 } else if (retry) {
  const answers = Object.assign({}, progress.answers[key]);
  delete answers[retry.dataset.retry];
  progress.answers[key] = answers;
  saveProgress();
  render();
 } else if (event.target.closest("[data-complete]")) {
  progress.done[key] = true;
  saveProgress();
  const next = all[all.indexOf(lesson) + 1];
  location.hash = next ? `#lesson/${subject.id}/${next.id}` : `#subject/${subject.id}`;
 }
});
document.addEventListener("submit", event => {
 const target = event.target;
 if (target.dataset.form !== "add-application") return;
 event.preventDefault();
 if (!main.contains(target) || !target.reportValidity()) return;
 addApplication(target, new FormData(target));
});
document.addEventListener("change", event => {
 if (event.target.matches("select[data-application-url],select[data-application-id]")) {
  updateApplicationStatus(event.target);
  return;
 }
 const filters = event.target.closest("#opportunity-filters");
 if (!filters) return;
 const {track, type, area} = Object.fromEntries(new FormData(filters));
 if (!Object.hasOwn(opportunitySearch, track) || !Object.hasOwn(opportunityTypes, type) || !Object.hasOwn(opportunityAreas, area)) return;
 document.querySelector("#opportunity-results").innerHTML = opportunityResults(track, type, area);
 document.querySelector("#opportunity-status").textContent = matchingOpportunities(track, type, area).length + " matching selected vacancies";
 showLiveApprenticeships();
 updateApplicationControls();
});
render();
