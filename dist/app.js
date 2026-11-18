"use strict";

// Security+ trainer: read a lesson once, then keep the facts with spaced repetition.
// Jobs and Applications are small extras in the footer.
const esc = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const shapes = {
 external:'<path d="M13 4h7v7m0-7-9 9m6 0v6H5V7h6"/>',
 arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>'
};
const icon = name => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" aria-hidden="true">${shapes[name] || shapes.arrow}</svg>`;
const main = document.querySelector("#main");
const topbar = document.querySelector("#topbar");
const footer = document.querySelector("#footer");
const academyName = "Tech Skills Academy";
let page = "home";
let part = "";

/* ---------- the course (from content-security.js) ---------- */
// A lesson is stored as [id, title, intro, ideas[], example, question1, question2]
// and a question as [text, correct answer, wrong, wrong, wrong, explanation].
const course = lessons.map(l => ({
 id:l[0], title:l[1], intro:l[2], ideas:l[3], example:l[4], domain:Number(l[0][0]) - 1,
 questions:[l[5], l[6]].map((q, i) => ({key:l[0] + "#" + i, lesson:l[0], text:q[0], options:q.slice(1, 5), correct:0, why:q[5]}))
}));
const lessonById = id => course.find(l => l.id === id);
const questionByKey = Object.fromEntries(course.flatMap(l => l.questions).map(q => [q.key, q]));

/* ---------- progress, saved in this browser only ---------- */
// cards[key] = {level, due}. Level 0 = new or just missed. Each correct answer moves it up a level,
// and the due day moves further away: 1, 3, 7, 14, then 30 days. A wrong answer drops it back to 0.
const STORE = "tsa-progress-v2";
const INTERVALS = [0, 1, 3, 7, 14, 30];
const SESSION_MAX = 20;
let progress = {done:{}, cards:{}, answers:{}, days:{}};
try { progress = Object.assign(progress, JSON.parse(localStorage.getItem(STORE)) || {}); } catch (e) { /* private mode: keep in memory */ }
function saveProgress() { try { localStorage.setItem(STORE, JSON.stringify(progress)); } catch (e) { /* ignore */ } }
// Day number in the user's own time zone, so "tomorrow" starts at local midnight.
const today = () => { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); };

function grade(key, ok) {
 const card = progress.cards[key] || {level:0, due:today()};
 card.level = ok ? Math.min(card.level + 1, INTERVALS.length - 1) : 0;
 card.due = today() + (ok ? INTERVALS[card.level] : 0);
 progress.cards[key] = card;
}
const liveKeys = () => Object.keys(progress.cards).filter(k => questionByKey[k]);
const dueKeys = () => liveKeys().filter(k => progress.cards[k].due <= today());
const cardCount = () => liveKeys().length;
const strongCount = () => liveKeys().filter(k => progress.cards[k].level >= 3).length;
function nextDueText() {
 const future = liveKeys().filter(k => progress.cards[k].due > today()).map(k => progress.cards[k].due);
 if (!future.length) return "";
 const days = Math.min(...future) - today();
 return days === 1 ? "tomorrow" : "in " + days + " days";
}
function streak() {
 let day = today(), n = 0;
 if (!progress.days[day]) day--;
 while (progress.days[day]) { n++; day--; }
 return n;
}
const doneCount = () => course.filter(l => progress.done[l.id]).length;

// The same shuffle for the same seed, so answers don't jump around when the page redraws.
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
const choiceButtons = (options, picked, attr, qi = "") => options.map((o, i) => {
 const answered = picked !== undefined && picked !== null;
 const state = answered && o.right ? " right" : answered && i === picked ? " wrong" : "";
 return `<button type="button" class="choice${state}" ${attr}="${i}" data-q="${qi}"${answered ? " disabled" : ""}><span class="letter">${"ABCD"[i]}</span><span>${esc(o.text)}</span></button>`;
}).join("");

/* ---------- pages ---------- */
const intro = (title, description, label = "") =>
 `<div class="intro">${label ? `<div class="eyebrow">${label}</div>` : ""}<h1>${title}</h1><p>${description}</p></div>`;
const bar = (done, total, label) => `<div class="bar" role="img" aria-label="${label}"><span style="width:${total ? Math.round(done / total * 100) : 0}%"></span></div>`;

function homePage() {
 const due = dueKeys().length, total = cardCount();
 let review;
 if (due) {
  review = `<a class="today-card due" href="#review"><span><small>Review</small><strong>${due} ${due === 1 ? "question" : "questions"} due</strong><em>About ${Math.max(1, Math.round(Math.min(due, SESSION_MAX) / 3))} min</em></span><span class="go">Start${icon("arrow")}</span></a>`;
 } else if (total) {
  review = `<div class="today-card calm"><span><small>Review</small><strong>All caught up</strong><em>Next questions come back ${nextDueText() || "soon"}.</em></span></div>`;
 } else {
  review = `<div class="today-card calm"><span><small>Review</small><strong>Nothing to review yet</strong><em>Read a lesson and its questions will start coming back.</em></span></div>`;
 }
 const next = course.find(l => !progress.done[l.id]);
 return `${intro("Today", "A few minutes of review a day makes the facts stick.")}
 ${review}
 <dl class="stats">
  <div><dt>Day streak</dt><dd>${streak()}</dd></div>
  <div><dt>Lessons read</dt><dd>${doneCount()}<span> / ${course.length}</span></dd></div>
  <div><dt>Still learning</dt><dd>${total - strongCount()}</dd></div>
  <div><dt>Strong</dt><dd>${strongCount()}</dd></div>
 </dl>
 ${next ? `<h2>Up next</h2><a class="resume" href="#lesson/${next.id}"><span><small>${esc(domains[next.domain].short)} · ${next.id}</small><strong>${esc(next.title)}</strong></span>${icon("arrow")}</a>` : `<p class="small-note">You've read every lesson. Keep the daily review going.</p>`}`;
}

function lessonsPage() {
 const sections = domains.map((d, i) => {
  const items = course.filter(l => l.domain === i);
  const done = items.filter(l => progress.done[l.id]).length;
  return `<section class="section"><h2>${esc(d.name)}</h2>
   <p class="section-sub">${esc(d.summary)} ${d.weight}% of the exam.</p>
   <ol class="lesson-list">${items.map(l => `<li><a href="#lesson/${l.id}"><span class="tick${progress.done[l.id] ? " on" : ""}" aria-hidden="true">${progress.done[l.id] ? "✓" : ""}</span><span class="lesson-title">${esc(l.title)}</span><span class="visually-hidden">${progress.done[l.id] ? "(read)" : ""}</span>${icon("arrow")}</a></li>`).join("")}</ol>
   <p class="small-note">${done} of ${items.length} read</p></section>`;
 }).join("");
 return `${intro("Lessons", "Five exam domains. Read a lesson once, then let the review do the rest.", "CompTIA Security+ SY0-701")}
 <div class="overall">${bar(doneCount(), course.length, doneCount() + " of " + course.length + " lessons read")}<span>${doneCount()} of ${course.length} read</span></div>
 ${sections}`;
}

function lessonPage() {
 const lesson = lessonById(part), at = course.indexOf(lesson);
 const prev = course[at - 1];
 const saved = progress.answers[lesson.id] || {};
 const quiz = lesson.questions.map((q, qi) => {
  const options = shuffledOptions(q, q.key);
  const picked = saved[qi];
  const answered = picked !== undefined;
  const verdict = answered ? `<div class="feedback ${options[picked].right ? "ok" : "no"}" id="fb-${qi}" tabindex="-1"><strong>${options[picked].right ? "Correct." : "Not quite."}</strong> ${esc(q.why)} <button type="button" class="link-button" data-retry="${qi}">Try again</button></div>` : "";
  return `<div class="question"><p class="q-text"><span class="q-num">Question ${qi + 1}</span>${esc(q.text)}</p><div class="choices">${choiceButtons(options, picked, "data-i", qi)}</div>${verdict}</div>`;
 }).join("");
 return `<p class="crumbs"><a href="#lessons">All lessons</a></p>
 <article class="lesson">
  <div class="eyebrow">${esc(domains[lesson.domain].name)} · Lesson ${at + 1} of ${course.length}</div>
  <h1>${esc(lesson.title)}</h1>
  <p class="lead">${esc(lesson.intro)}</p>
  <h2>Key ideas</h2>
  <ul class="ideas">${lesson.ideas.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
  <aside class="example"><h2>Example</h2><p>${esc(lesson.example)}</p></aside>
  <h2>Check yourself</h2>
  <div id="quiz">${quiz}</div>
  <p class="small-note">These questions join your daily review when you mark the lesson read.</p>
  <div class="lesson-nav">
   ${prev ? `<a class="button" href="#lesson/${prev.id}">← Previous</a>` : `<span></span>`}
   <button type="button" class="button dark" data-complete>${progress.done[lesson.id] ? "Read ✓ Next lesson" : "Mark read and continue"}${icon("arrow")}</button>
  </div>
 </article>`;
}

/* ---------- review session (kept in memory until you finish or reload) ---------- */
let session = null;
function startReview() {
 const keys = dueKeys().sort(() => Math.random() - 0.5).slice(0, SESSION_MAX);
 session = {queue:keys, total:keys.length, seen:new Set(), missed:new Set(), firstTry:0, picked:null, pickedOk:false, ask:0};
}
const currentOptions = () => {
 const q = questionByKey[session.queue[0]];
 return shuffledOptions(q, q.key + "@" + session.ask);
};

function reviewPage() {
 if (!session) {
  const due = dueKeys().length;
  const body = due
   ? `<p class="big-number">${due}<span> ${due === 1 ? "question" : "questions"} due</span></p><button type="button" class="button dark" data-rstart>Start review${icon("arrow")}</button>${due > SESSION_MAX ? `<p class="small-note">Sessions are ${SESSION_MAX} questions. The rest wait for the next one.</p>` : ""}`
   : `<p class="big-number calm">All caught up</p><p class="small-note">${cardCount() ? "Next questions come back " + nextDueText() + "." : "Read a lesson first and its questions will appear here."}</p><p><a class="button" href="#lessons">Go to lessons</a></p>`;
  return `${intro("Review", "Answer from memory. Missed questions come back today. Ones you get right come back after 1, 3, 7, 14 and 30 days.")}<div class="panel review-start">${body}</div>`;
 }
 if (!session.queue.length) {
  const missedLessons = [...new Set([...session.missed].map(k => questionByKey[k].lesson))];
  return `${intro("Nice work", session.firstTry + " of " + session.total + " right first time.")}
  ${missedLessons.length ? `<div class="panel"><h2>Worth a re-read</h2><ul class="reread">${missedLessons.map(id => `<li><a class="text-link" href="#lesson/${id}">${id} ${esc(lessonById(id).title)}</a></li>`).join("")}</ul></div>` : ""}
  <button type="button" class="button dark" data-rfinish>Done${icon("arrow")}</button>`;
 }
 const q = questionByKey[session.queue[0]];
 const options = currentOptions();
 const answered = session.picked !== null;
 const again = session.seen.has(q.key) && !answered;
 return `<div class="eyebrow">Review · ${session.queue.length} left</div>
 <div class="question big">
  <p class="q-text">${again ? `<span class="q-num">Try that one again</span>` : ""}${esc(q.text)}</p>
  <div class="choices">${choiceButtons(options, session.picked, "data-rpick")}</div>
  ${answered ? `<div class="feedback ${session.pickedOk ? "ok" : "no"}" id="fb-r" tabindex="-1"><strong>${session.pickedOk ? "Correct." : "Not quite."}</strong> ${esc(q.why)} ${session.pickedOk ? "" : `<a class="text-link" href="#lesson/${q.lesson}">Read lesson ${q.lesson}</a>`}</div>
  <div class="lesson-nav"><span></span><button type="button" class="button dark" data-rnext>Next${icon("arrow")}</button></div>` : ""}
 </div>`;
}

function missingPage() {
 return `${intro("Page not found", "That page doesn’t exist.")}<p><a class="text-link" href="#home">Back to today</a></p>`;
}

/* ---------- routing ---------- */
function shell() {
 const group = page === "lesson" ? "lessons" : page;
 const due = dueKeys().length;
 const link = (id, label, extra = "") => `<a href="#${id}"${group === id ? ' class="active" aria-current="page"' : ""}>${label}${extra}</a>`;
 topbar.innerHTML = `<div class="topbar-inner"><a class="brand" href="#home">${academyName}</a><nav class="primary-nav" aria-label="Main">${link("home", "Today")}${link("lessons", "Lessons")}${link("review", "Review", due ? ` <span class="badge" aria-label="${due} due">${due}</span>` : "")}</nav></div>`;
 footer.innerHTML = `<span>Extras:</span> <a href="#opportunities">Jobs</a> <a href="#applications">Applications</a>`;
}

function render(focus = false) {
 const hash = location.hash.slice(1);
 const [section = "home", a = "", b = "", ...extra] = (hash || "home").split("/");
 page = section; part = a;
 const valid = !extra.length && ({
  home:() => !a && !b,
  lessons:() => !a && !b,
  lesson:() => lessonById(a) && !b,
  review:() => !a && !b,
  opportunities:() => !b && (!a || Object.hasOwn(opportunitySearch, a)),
  applications:() => !a && !b
 }[section] || (() => false))();
 if (!valid) page = "";
 shell();
 const pages = {home:homePage, lessons:lessonsPage, lesson:lessonPage, review:reviewPage, opportunities:opportunitiesPage, applications:applicationsPage};
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
 const hit = selector => event.target.closest(selector);
 if (hit(".skip")) {
  event.preventDefault();
  main.focus();
  return;
 }
 if (page === "lesson") {
  const lesson = lessonById(part);
  const choice = hit("[data-i]"), retry = hit("[data-retry]");
  if (choice) {
   const qi = Number(choice.dataset.q), q = lesson.questions[qi];
   progress.answers[lesson.id] = Object.assign({}, progress.answers[lesson.id], {[qi]:Number(choice.dataset.i)});
   // Only your first answer to a question counts towards its schedule.
   if (!progress.cards[q.key]) grade(q.key, shuffledOptions(q, q.key)[Number(choice.dataset.i)].right);
   saveProgress();
   render();
   document.querySelector("#fb-" + qi)?.focus({preventScroll:true});
  } else if (retry) {
   const answers = Object.assign({}, progress.answers[lesson.id]);
   delete answers[retry.dataset.retry];
   progress.answers[lesson.id] = answers;
   saveProgress();
   render();
  } else if (hit("[data-complete]")) {
   progress.done[lesson.id] = true;
   for (const q of lesson.questions) if (!progress.cards[q.key]) progress.cards[q.key] = {level:0, due:today()};
   saveProgress();
   const next = course[course.indexOf(lesson) + 1];
   location.hash = next ? "#lesson/" + next.id : "#lessons";
  }
  return;
 }
 if (page !== "review") return;
 if (hit("[data-rstart]")) {
  startReview();
  render();
 } else if (hit("[data-rpick]") && session && session.picked === null) {
  const q = questionByKey[session.queue[0]];
  const i = Number(hit("[data-rpick]").dataset.rpick);
  const ok = currentOptions()[i].right;
  if (!session.seen.has(q.key)) {
   // The first answer in a session sets the schedule. Re-asks after a miss only help you remember.
   session.seen.add(q.key);
   grade(q.key, ok);
   if (ok) session.firstTry++; else session.missed.add(q.key);
   progress.days[today()] = (progress.days[today()] || 0) + 1;
   saveProgress();
  }
  session.picked = i;
  session.pickedOk = ok;
  render();
  document.querySelector("#fb-r")?.focus({preventScroll:true});
 } else if (hit("[data-rnext]") && session && session.picked !== null) {
  const key = session.queue.shift();
  if (!session.pickedOk) session.queue.splice(Math.min(3, session.queue.length), 0, key);
  session.picked = null;
  session.ask++;
  render();
 } else if (hit("[data-rfinish]")) {
  session = null;
  location.hash = "#home";
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
