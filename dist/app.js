"use strict";

const shapes = {
 shield:'<path d="M12 22s7-3.5 7-10V5l-7-3-7 3v7c0 6.5 7 10 7 10Z"/><path d="m9 12 2 2 4-4"/>',
 cpu:'<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v3m6-3v3m4 4h3m-3 6h3M9 19v3m6-3v3M2 9h3m-3 6h3"/>',
 code:'<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-2-15-4 18"/>',
 briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 book:'<path d="M4 19V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1 0-4h13M8 7h7m-7 4h5"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 flask:'<path d="M10 3h4m-3 0v7L5 19a1.3 1.3 0 0 0 1 2h12a1.3 1.3 0 0 0 1-2l-6-9V3M8 15h8"/>',
 chart:'<path d="M3 3v18h18M8 16v-4m5 4V8m5 8V5"/>',
 layers:'<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
 activity:'<path d="M2 12h5l3-7 4 14 3-7h5"/>',
 clipboard:'<rect x="5" y="5" width="14" height="16" rx="2"/><rect x="9" y="3" width="6" height="4" rx="1" fill="currentColor"/><path d="M9 12h6m-6 4h6"/>',
 arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
 chevron:'<path d="m9 6 6 6-6 6"/>',
 back:'<path d="M20 12H5m6 6-6-6 6-6"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
 external:'<path d="M13 4h7v7m0-7-9 9m6 0v6H5V7h6"/>'
};
const icon = (name) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name] || shapes.shield}</svg>`;
const esc = (value) => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const main = document.querySelector("#main");
const topbar = document.querySelector("#topbar");
const academyName = "Tech Skills Academy";
const byDomain = domains.map((_, i) => lessons.filter(lesson => Number(lesson[0][0]) === i + 1));
const routeNames = {dashboard:"Dashboard",careers:"Careers",certifications:"Certifications",opportunities:"Opportunities",applications:"My applications",curriculum:"Curriculum",practice:"Practice",labs:"Labs",progress:"My progress",lesson:"Curriculum"};
const official = "https://assets.ctfassets.net/82ripq7fjls2/6TYWUym0Nudqa8nGEnegjG/0f9b974d3b1837fe85ab8e6553f4d623/CompTIA-Security-Plus-SY0-701-Exam-Objectives.pdf";
let labResult = null;
let page = "dashboard";
let part = "";
let subpart = "";
let previouslyRendered = "";

function shuffled(values) {
 const copy = [...values];
 for (let i = copy.length - 1; i > 0; i--) {
  const index = Math.floor(Math.random() * (i + 1));
  [copy[i], copy[index]] = [copy[index], copy[i]];
 }
 return copy;
}
function pct(current, max) {
 return max ? Math.round(current / max * 100) : 0;
}
function bar(value) {
 return `<div class="bar" role="progressbar" aria-label="Completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}"><div class="fill" style="width:${value}%"></div></div>`;
}
const iconTile = (name, color) => `<span class="tile-icon ${color}">${icon(name)}</span>`;
const view = (href, label, theme = "dark", symbol = "arrow") => `<a class="button ${theme}" href="#${href}">${label}${icon(symbol)}</a>`;
const link = (href, label, symbol = "arrow") => `<a class="text-link" href="#${href}">${symbol === "back" ? icon(symbol) : ""}${label}${symbol === "back" ? "" : icon(symbol)}</a>`;
const back = (href, label) => `<div class="back">${link(href, label, "back")}</div>`;
const intro = (title, description, label = "") => `<div class="intro">${label ? `<div class="eyebrow">${label}</div>` : ""}<h1>${title}</h1><p>${description}</p></div>`;
const head = (title, description, action = "") => `<div class="section-heading"><div><h2>${title}</h2><p class="section-sub">${description}</p></div>${action}</div>`;
const footer = () => `<footer class="foot"><span>Independent study material for CompTIA Security+ SY0-701</span><a href="${official}" target="_blank" rel="noopener noreferrer">Official SY0-701 objectives (PDF) ${icon("external")}</a></footer>`;

function shell(area) {
 const nav = (id, symbol) => {
  const selected = area === id;
  const exactPage = page === id && !part;
  return `<a href="#${id}"${selected ? ` class="active" aria-current="${exactPage ? "page" : "location"}"` : ""}>${symbol ? icon(symbol) : ""}${routeNames[id]}</a>`;
 };
 topbar.innerHTML = `<div class="topbar-inner">
 <a class="brand" href="#dashboard"><span class="brand-mark">${icon("layers")}</span><strong>${academyName}</strong></a>
 <nav class="primary-nav" aria-label="Academy">${nav("dashboard")}${nav("careers")}${nav("certifications")}${nav("progress","chart")}</nav>
 </div>`;
}

function catalogueHero({label,title,description,buttons,symbol="shield",meta=""}) {
 return `<section class="hero catalogue-hero"><div class="hero-body">
 ${label ? `<div class="hero-label">${label}</div>` : ""}
 <h2>${title}</h2><p>${description}</p><div class="hero-actions">${buttons}${meta ? `<span class="hero-meta">${meta}</span>` : ""}</div></div>
 <div class="catalogue-art" aria-hidden="true">${icon(symbol)}</div></section>`;
}

function domainCard(domain, i) {
 const count = byDomain[i].filter(lesson => state.done.includes(lesson[0])).length;
 return `<a href="#curriculum/${i+1}" class="card domain-card"><div class="card-top">${iconTile(domain.icon,domain.color)}<span class="weight">${domain.weight}% exam</span></div>
 <div class="eyebrow domain-label">Domain 0${i+1}</div><h3>${domain.name}</h3><p>${domain.summary}</p>${bar(pct(count,byDomain[i].length))}<div class="domain-meta"><span>${count} / ${byDomain[i].length} lessons</span>${icon("arrow")}</div></a>`;
}
function labCard(lab) {
 const score = state.labScores[lab.id];
 return `<a href="#labs/${lab.id}" class="card lab-card"><div class="card-top">${iconTile(lab.icon,lab.color)}<span class="tag">${score == null ? lab.objective : `Best ${Number(score)}/${lab.tasks.length}`}</span></div><h3>${lab.title}</h3><p>${lab.summary}</p><div class="domain-meta"><span>${lab.tasks.length} decisions</span>${icon("arrow")}</div></a>`;
}
function metric(name, value, symbol, color) {
 return `<div class="metric">${iconTile(symbol,color)}<div><strong>${value}</strong><span>${name}</span></div></div>`;
}
function metrics() {
 const correct = state.attempts.reduce((sum, a) => sum + Number(a.correct), 0);
 const total = state.attempts.reduce((sum, a) => sum + Number(a.total), 0);
 return `<div class="metrics">${metric("Security+ lessons",`${state.done.length}/${lessons.length}`,"book","mint")}${metric("Quiz accuracy",total ? pct(correct,total)+"%" : "—","target","blue")}${metric("Labs attempted",`${Object.keys(state.labScores).length}/${labs.length}`,"flask","lilac")}</div>`;
}
function nextLesson() {
 const recent = lessons.find(lesson => lesson[0] === (state.last || state.done.at(-1)));
 if (recent && !state.done.includes(recent[0])) return recent;
 const start = recent ? lessons.indexOf(recent)+1 : 0;
 return [...lessons.slice(start),...lessons.slice(0,start)].find(lesson=>!state.done.includes(lesson[0]));
}
function securityCertificationHero() {
 if (!state.done.length) {
  return {
   title:"Start Security+ prep",
   description:"Begin with the first lesson on security controls.",
   buttons:view("lesson/"+lessons[0][0],"Start Security+","primary"),
   symbol:"shield"
  };
 }
 const next = nextLesson();
 if (!next) return {
  label:"Security+ practice",title:"Mixed practice",description:"Revisit questions from all five exam domains.",
  buttons:view("practice/security-plus","Open practice","primary"),symbol:"shield"
 };
 return {
  label:"Continue Security+",title:next[1],description:`${domains[Number(next[0][0])-1].short} · Objective ${next[0]}`,
  buttons:view("lesson/"+next[0],"Open lesson","primary"),symbol:"shield"
 };
}
function dashboard() {
 return `${intro("Your training dashboard","Choose your learning path.")}
 <div class="career-grid academy-areas">
  <a class="card career-card" href="#careers"><div class="card-top">${iconTile("briefcase","mint")}${icon("arrow")}</div>
   <h2>Careers</h2><p>Explore career tracks, practise practical skills and find jobs and apprenticeships.</p></a>
  <a class="card career-card" href="#certifications"><div class="card-top">${iconTile("shield","lilac")}${icon("arrow")}</div>
   <h2>Certifications</h2><p>Find exam-focused lessons, practice questions and labs for each certification.</p></a>
 </div>`;
}
function securityCertificationOverview() {
 const feature = securityCertificationHero();
 return `${back("certifications","All certifications")}
 ${intro("CompTIA Security+","Prepare for SY0-701 across the five exam domains.")}
 <section class="hero" aria-labelledby="hero-title"><div class="hero-body">
 ${feature.label ? `<div class="hero-label"><i></i>${feature.label}</div>` : ""}
 <h2 id="hero-title">${feature.title}</h2><p>${feature.description}</p>
 <div class="hero-actions">${feature.buttons}</div></div>
 <div class="hero-art" aria-hidden="true"><div class="cross-x"></div><div class="cross-y"></div><div class="scaffold">${icon(feature.symbol)}</div><span class="art-dot dot1"></span><span class="art-dot dot2"></span><span class="art-dot dot3"></span></div></section>
 ${metrics()}
 <section class="dash-section">${head("Exam domains","Follow the curriculum or jump to a topic you want to revise.",link("curriculum/security-plus","View Security+ curriculum"))}<div class="domain-grid">${domains.map(domainCard).join("")}</div></section>
 <section class="dash-section">${head("PBQ labs","Apply what you know in guided scenarios.",link("labs/security-plus","Browse Security+ labs"))}<div class="lab-grid">${labs.map(labCard).join("")}</div></section>${footer()}`;
}
function lessonRow(lesson) {
 const done = state.done.includes(lesson[0]);
 return `<a class="lesson-row" href="#lesson/${lesson[0]}"><span class="tag">${lesson[0]}</span><span class="row-name">${lesson[1]}</span>${done ? `<small>Completed</small>${icon("check")}` : icon("chevron")}</a>`;
}
function curriculum() {
 if (!part) return studyOverview("curriculum");
 const track = careerTracks.find(item=>item.id===part);
 if (track) return studyTrackPage("curriculum",track);
 const i = Number(part) - 1;
 const domain = domains[i];
 if (domain) return `${back("curriculum/security-plus","All Security+ domains")}${intro(domain.name,domain.summary,`Domain 0${i+1} · ${domain.weight}% of exam`)}
 <div class="row-list">${byDomain[i].map(lessonRow).join("")}</div><div class="actions">${view("practice/"+(i+1),"Practise this domain")}</div>`;
 return `${back("certifications/security-plus","Security+ overview")}${intro("Security+ curriculum","28 lessons across the five CompTIA Security+ SY0-701 domains.")}
 <div class="domain-grid">${domains.map(domainCard).join("")}</div>
 <section class="dash-section">${head("Find a lesson","Search by objective number or topic.")}
 <div class="filters"><label for="lesson-search">Search lessons</label><input type="search" id="lesson-search" autocomplete="off" placeholder="e.g. cryptography or 5.3"></div>
 <p id="search-status" class="visually-hidden" role="status"></p><div class="row-list" id="search-output">${lessons.map(lessonRow).join("")}</div></section>${footer()}`;
}
function lessonPage() {
 const lesson = lessons.find(item => item[0] === part);
 if (!lesson) return missing("curriculum/security-plus");
 const [id, name, summary, points, example] = lesson;
 const domain = Number(id[0]);
 const next = lessons[lessons.indexOf(lesson)+1];
 const done = state.done.includes(id);
 return `${back("curriculum/"+domain,domains[domain-1].name)}${intro(name,summary,`Objective ${id}`)}
 <article class="panel"><h2>What to know</h2><ul>${points.map(point => `<li>${point}</li>`).join("")}</ul></article>
 <article class="panel example"><h2>Worked scenario</h2><p>${example}</p></article>
 <section class="panel"><h2>Quick check</h2><p>Answer two questions and see the reasoning for each one.</p><div class="actions">
 <button class="button dark" data-action="lessonQuiz" data-id="${id}">Check understanding ${icon("target")}</button>
 <button class="button ghost" data-action="complete" data-id="${id}" aria-pressed="${done}">Mark lesson complete ${icon("check")}</button>
 ${next ? view("lesson/"+next[0],"Next lesson","ghost") : ""}</div>${done ? '<p class="small-note">Lesson complete</p>' : ""}</section>`;
}
function practiceMenu() {
 if (!part) return studyOverview("practice");
 const track = careerTracks.find(item=>item.id===part);
 if (track) return studyTrackPage("practice",track);
 const chosen = Number(part);
 return `${back("certifications/security-plus","Security+ overview")}${intro("Security+ practice","Choose a question set and review the reasoning behind each answer.")}
 ${part === "missed" && !state.missed.length ? '<p class="panel">You have no missed questions to review.</p>' : ""}
 ${quiz && !quiz.finished ? `<div class="resume-quiz panel"><p>${quiz.title} in progress. Starting a new quiz replaces this attempt.</p>${view("practice/session","Resume quiz")}</div>` : ""}
 <section class="panel quiz-panel"><h2>Quick quiz</h2><p>Get feedback as you go. Questions and choices are shuffled.</p>
 <form class="form-row actions" data-form="quiz"><label for="scope">Question set<select id="scope" name="scope">
 <option value="mixed">Mixed domains · 10 questions</option>
 ${domains.map((d,i) => `<option value="${i+1}" ${chosen === i+1 ? "selected" : ""}>${i+1}. ${d.short} · ${Math.min(10,byDomain[i].length*2)} questions</option>`).join("")}
 <option value="missed" ${part === "missed" && state.missed.length ? "selected" : ""} ${state.missed.length ? "" : "disabled"}>Missed questions · ${Math.min(10,state.missed.length)} available</option>
 </select></label><button class="button dark" type="submit">Start quiz ${icon("arrow")}</button></form></section>
 <section class="panel quiz-panel"><h2>Mixed mock quiz</h2><p>Take 20 questions sampled across all five domains, roughly in proportion to exam weights. Review your score and explanations at the end.</p>
 <div class="actions"><button class="button dark" data-action="mock">Start mock quiz ${icon("arrow")}</button></div></section>`;
}
function startQuiz(scope, mock = false) {
 if (!quizScopes.includes(scope)) return;
 let questions = allQuestions;
 if (mock) {
  const sample = [2,4,4,6,4];
  questions = domains.flatMap((_, i) => shuffled(allQuestions.filter(q => +q.objective[0] === i+1)).slice(0,sample[i]));
 } else if (scope === "missed") {
  questions = allQuestions.filter(q => state.missed.includes(q.id));
 } else if (scope.includes(".")) {
  questions = allQuestions.filter(q => q.objective === scope);
 } else if (scope !== "mixed") {
  questions = allQuestions.filter(q => q.objective[0] === scope);
 }
 if (!questions.length) {
  render(true);
  return;
 }
 quiz = {title:quizTitle(scope,mock),mock,list:shuffled(questions).slice(0,mock ? 20 : 10).map(q=>({...q,options:shuffled(q.options)})),index:0,answers:[],scope,finished:false};
 saveQuiz();
 if (location.hash !== "#practice/session") history.pushState(null,"","#practice/session");
 render(true);
}
function quizPage() {
 if (part !== "session") return practiceMenu();
 if (!quiz) return `${intro("Quiz session unavailable","Start a new quiz from Practice.")}${view("practice/security-plus","Open Security+ practice")}`;
 const {list, index, answers, title, mock, scope} = quiz;
 const q = list[index];
 if (quiz.finished) {
  const score = list.filter((question, i) => question.correct === answers[i]).length;
  return `${intro(`${score} / ${list.length} correct`, "Review the clues behind each answer.", title)}
  <section class="panel quiz-panel"><h2>Answer review</h2><ol class="score-list">${list.map((question, i) => `<li><a class="text-link" href="#lesson/${question.objective}">${question.objective}</a> · <strong>${question.prompt}</strong><br>${question.correct === answers[i] ? "Correct" : `You chose ${esc(answers[i])}. Correct answer: ${question.correct}`}<br>${question.reason}</li>`).join("")}</ol>
  <div class="actions">${scope !== "missed" || state.missed.length ? `<button class="button dark" data-action="retry">New attempt ${icon("arrow")}</button>` : ""}${view(scope.includes(".") ? "lesson/"+scope : "practice/security-plus",scope.includes(".") ? "Back to lesson" : "More practice","ghost","back")}${state.missed.length ? view("practice/missed","Drill missed questions","ghost") : ""}</div></section>`;
 }
 const answered = !mock && answers.length > index;
 const correct = answers[index] === q.correct;
 return `${back(scope.includes(".") ? "lesson/"+scope : "practice/security-plus",scope.includes(".") ? "Back to lesson" : "All practice")}
 ${intro(title,mock ? "Answers and explanations appear at the end." : "Choose the best answer for this scenario.","Practice")}
 <section class="panel quiz-panel"><div class="quiz-count"><span>QUESTION ${index+1} / ${list.length}</span><span>OBJECTIVE ${q.objective}</span></div>
 ${bar(pct(answers.length,list.length))}
 <form data-form="answer"><h2 class="question" id="quiz-question">${q.prompt}</h2><div class="opts" role="radiogroup" aria-labelledby="quiz-question">
 ${q.options.map((option,i) => `<label class="option ${answered && option === q.correct ? "correct" : ""} ${answered && option === answers[index] && !correct ? "wrong" : ""}"><input type="radio" name="option" value="${i}" required ${answered ? "disabled" : ""} ${option === answers[index] ? "checked" : ""}><span>${option}</span></label>`).join("")}
 </div>${answered ? `<div class="answer-note ${correct ? "" : "missed"}" id="quiz-feedback" role="status" tabindex="-1"><strong>${correct ? "Correct." : "Correct answer: "+q.correct+"."}</strong> ${q.reason}</div>` : ""}
 <div class="actions">${answered ? `<button class="button dark" type="button" data-action="next">${index+1 === list.length ? "View results" : "Next question"} ${icon("arrow")}</button>` : `<button class="button dark" type="submit">${mock ? index+1 === list.length ? "Finish quiz" : "Next question" : "Check answer"} ${icon("arrow")}</button>`}</div></form></section>`;
}
function nextQuestion() {
 if (!quiz || quiz.finished || quiz.answers.length !== quiz.index+1) return;
 if (quiz.index + 1 < quiz.list.length) {
  quiz.index++;
 } else {
  quiz.finished = true;
  changeProgress(progress => {
   const missed = new Set(progress.missed);
   let correct = 0;
   quiz.list.forEach((question,i) => {
    if (question.correct === quiz.answers[i]) {
     correct++;
     missed.delete(question.id);
    } else {
     missed.add(question.id);
    }
   });
   progress.missed = [...missed];
   progress.attempts.push({scope:quiz.scope,title:quiz.title,total:quiz.list.length,correct,date:new Date().toISOString()});
  });
 }
 saveQuiz();
 render(true);
}
function evidenceTable(rows, label = "Results table") {
 return `<div class="table-wrap" tabindex="0" role="region" aria-label="${esc(label)}"><table><thead><tr>${rows[0].map(cell => `<th scope="col">${esc(cell)}</th>`).join("")}</tr></thead><tbody>${rows.slice(1).map(row => `<tr>${row.map(cell=>`<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
function labPage() {
 if (!part) return studyOverview("labs");
 const track = careerTracks.find(item=>item.id===part);
 if (track) return studyTrackPage("labs",track);
 if (part==="security-plus") return `${back("certifications/security-plus","Security+ overview")}${intro("Security+ PBQ labs","Performance-based question practice with simulated evidence and feedback on each decision.")}<div class="lab-grid">${labs.map(labCard).join("")}</div>`;
 const lab = labs.find(item => item.id === part);
 if (!lab) return missing("labs/security-plus");
 const result = labResult?.id === lab.id ? labResult.answers : null;
 const score = result ? lab.tasks.filter((task, i)=>task[2] === result[i]).length : null;
 return `${back("labs/security-plus","All Security+ labs")}${intro(lab.title,lab.summary,`Objectives ${lab.objective}`)}
 <section class="panel"><h2>Scenario</h2><p>${lab.brief}</p>${evidenceTable(lab.evidence,"Scenario evidence")}</section>
 <section class="panel"><h2>${result ? `Results · ${score}/${lab.tasks.length}` : "Your decisions"}</h2><form data-form="lab">
 ${lab.tasks.map(([question,options,correct,reason],i) => `<fieldset class="lab-task"><legend>${i+1}. ${question}</legend><div class="opts">
 ${options.map((option,j) => `<label class="option ${result && j === correct ? "correct" : ""} ${result && j === result[i] && j !== correct ? "wrong" : ""}">
 <input type="radio" name="task${i}" value="${j}" ${result ? "disabled" : "required"} ${result?.[i] === j ? "checked" : ""}>${option}</label>`).join("")}</div>
 ${result ? `<div class="answer-note ${result[i] === correct ? "" : "missed"}"><strong>${result[i] === correct ? "Correct." : "Correct answer: "+options[correct]+"."}</strong> ${reason}</div>` : ""}</fieldset>`).join("")}
 <div class="actions">${result ? `<button type="button" class="button ghost" data-action="resetLab">Retry lab ${icon("arrow")}</button>${view("labs/security-plus","All Security+ labs","dark")}` : `<button type="submit" class="button dark">Submit lab ${icon("arrow")}</button>`}</div></form></section>`;
}
function progressPage() {
 const rows = state.attempts.slice(-10).reverse().map(a => [a.title,new Date(a.date).toLocaleDateString("en-GB"),`${Number(a.correct)} / ${Number(a.total)}`]);
 return `${intro("My progress",storageAvailable ? "Your lesson completions, quiz history and lab scores are saved in this browser." : "Browser storage is unavailable. Progress is tracked for this visit.")}
 ${metrics()}<section class="panel"><h2>Recent quiz attempts</h2>${rows.length ? evidenceTable([["Question set","Date","Score"],...rows]) : "<p>Complete a quiz to see your score here.</p>"}
 <div class="actions">${state.missed.length ? view("practice/missed",`Review ${state.missed.length} missed question${state.missed.length === 1 ? "" : "s"}`) : view("practice/security-plus","Open Security+ practice","ghost")}</div></section>
 <section class="panel"><h2>Lab scores</h2>${evidenceTable([["Lab","Best score"],...labs.map(lab=>[lab.title,state.labScores[lab.id] == null ? "—" : `${Number(state.labScores[lab.id])} / ${lab.tasks.length}`])])}</section>
 <section>${head("Domain progress","Track Security+ lessons completed in each domain.")}<div class="domain-grid">${domains.map(domainCard).join("")}</div></section>
 <section class="dash-section">${head("Career progress","Track lessons and projects across the four career tracks.")}<div class="career-grid">${careerTracks.map(careerCard).join("")}</div></section>`;
}
function missing(route, label = "Back to the list") {
 return `${intro("Page unavailable","Choose a topic from the list to continue.")}${view(route,label)}`;
}
function render(focus = false) {
 const hash = location.hash.slice(1);
 const [section, sectionId = "", itemId = "", ...extra] = (!hash || hash === "main" ? "dashboard" : hash).split("/");
 page = section;
 part = sectionId;
 subpart = itemId;
 const valid = Object.hasOwn(routeNames,page) && !extra.length && (!subpart || page === "careers") &&
  (!["dashboard","progress","applications"].includes(page) || !part) &&
  (page !== "certifications" || !part || certifications.some(cert=>cert.id===part)) &&
  (page !== "opportunities" || !part || Object.hasOwn(opportunitySearch,part)) &&
  (page !== "curriculum" || !part || /^[1-5]$/.test(part) || part==="security-plus" || trackIds.includes(part)) &&
  (page !== "practice" || !part || /^[1-5]$/.test(part) || ["missed","session","security-plus"].includes(part) || trackIds.includes(part));
 if (!valid) page = "";
 const route = page+"/"+part+"/"+subpart;
 if (route !== previouslyRendered) {
  careerFeedback = null;
  projectResult = null;
  projectError = false;
  if (page !== "labs" || (labResult && labResult.id !== part)) labResult = null;
  if (page === "lesson" && objectiveIds.includes(part) && state.last !== part) {
   changeProgress(progress => { progress.last = part; });
  }
 }
 previouslyRendered = route;
 const study = currentStudySection();
 const certificate = certifications.find(cert=>cert.id===study.track);
 const inCareers = ["careers","opportunities","applications"].includes(page) || Object.hasOwn(studySections,page) && !certificate;
 const area = certificate || page === "certifications" ? "certifications" : inCareers ? "careers" : page;
 shell(area);
 const pages = {dashboard,careers:careerPage,certifications:certificationsPage,opportunities:opportunitiesPage,applications:applicationsPage,curriculum,lesson:lessonPage,practice:quizPage,labs:labPage,progress:progressPage};
 main.className = "page" + (page === "lesson" || page === "practice" || part && page !== "opportunities" ? " detail" : "");
 const studyTabs = study.track && (certificate || trackIds.includes(study.track)) ? studyNavigation(study,certificate) : "";
 main.innerHTML = valid ? studyTabs + pages[page]() : missing("dashboard","Return to dashboard");
 if (page === "opportunities") showLiveApprenticeships();
 if (page === "opportunities" || page === "applications") {
  if (applicationRecords) updateApplicationControls();
  else loadApplicationRecords();
 }
 document.title = (main.querySelector("h1")?.textContent || "Dashboard") + " | " + academyName;
 if (focus) {
  main.focus({preventScroll:true});
  window.scrollTo(0,0);
 }
}

window.addEventListener("hashchange", () => render(true));
window.addEventListener("storage", event => {
 if (event.storageArea !== localStorage || (event.key !== storeKey && event.key !== null) || !storageAvailable) return;
 state = readProgress(event.newValue);
 // Keep answers and search text intact in another open tab.
 if (["dashboard","progress"].includes(page)) render();
});
document.addEventListener("click", event => {
 if (event.target.closest(".skip")) {
  event.preventDefault();
  main.focus();
  return;
 }
 const button = event.target.closest("[data-action]");
 if (!button) return;
 const {action,id} = button.dataset;
 if (action === "complete" && event.detail <= 1) {
  changeProgress(progress => {
   progress.done = progress.done.includes(id) ? progress.done.filter(value => value !== id) : [...progress.done,id];
  });
  render();
  main.querySelector('[data-action="complete"]').focus();
 }
 if (action === "lessonQuiz") startQuiz(id);
 if (action === "mock") startQuiz("mixed",true);
 if (action === "retry" && quiz?.finished) startQuiz(quiz.scope,quiz.mock);
 if (action === "next") nextQuestion();
 if (action === "retryCareer") {
  careerFeedback = null;
  render();
  main.querySelector('[name="answer"]').focus();
 }
 if (action === "resetLab") {
  labResult = null;
  render();
  main.querySelector('[name="task0"]').focus();
 }
});
function optionIndex(form, name, count) {
 const value = form.get(name);
 if (typeof value !== "string" || !/^(0|[1-9][0-9]*)$/.test(value)) return -1;
 const index = Number(value);
 return index < count ? index : -1;
}
document.addEventListener("submit", event => {
 const target = event.target;
 const type = target.dataset.form;
 if (!type) return;
 event.preventDefault();
 if (!main.contains(target) || !target.reportValidity()) return;
 const form = new FormData(target);
 if (type === "add-application") addApplication(target,form);
 if (type === "career-challenge") submitCareerChallenge(form);
 if (type === "career-answer") {
  const lesson = careerTracks.find(track=>track.id===part)?.lessons.find(item=>item.id===subpart);
  if (!lesson || careerFeedback !== null) return;
  const answer = optionIndex(form,"answer",lesson.options.length);
  if (answer < 0) return;
  careerFeedback = answer;
  const key = part+"/"+subpart;
  if (answer === lesson.correct && !state.careerDone.includes(key)) {
   changeProgress(progress => {
    if (!progress.careerDone.includes(key)) progress.careerDone.push(key);
   });
  }
  render();
  main.querySelector("#career-feedback").focus();
 }
 if (type === "career-project") {
  const project = projectFields[part];
  if (!project || subpart !== "project") return;
  const params = Object.fromEntries(form);
  projectError = !project.fields.every(([name,,choices])=>choices.some(([value])=>String(value) === params[name]));
  if (!projectError) {
   projectResult = params;
   if (!state.projectsTried.includes(part)) changeProgress(progress => {
    if (!progress.projectsTried.includes(part)) progress.projectsTried.push(part);
   });
  }
  render();
  main.querySelector(projectError ? "#project-error" : "#project-output").focus();
 }
 if (type === "quiz") {
  const scope = form.get("scope");
  if (quizScopes.includes(scope)) startQuiz(scope);
 }
 if (type === "answer") {
  if (!quiz || quiz.finished || quiz.answers.length !== quiz.index) return;
  const {options} = quiz.list[quiz.index];
  const index = optionIndex(form,"option",options.length);
  if (index < 0) return;
  quiz.answers.push(options[index]);
  if (quiz.mock) nextQuestion();
  else {
   saveQuiz();
   render();
   main.querySelector("#quiz-feedback").focus();
  }
 }
 if (type === "lab") {
  const lab = labs.find(item => item.id === part);
  if (!lab || labResult) return;
  const answers = lab.tasks.map((task,i)=>optionIndex(form,"task"+i,task[1].length));
  if (answers.includes(-1)) return;
  const score = lab.tasks.filter((task,i)=>task[2] === answers[i]).length;
  changeProgress(progress => { progress.labScores[part] = Math.max(progress.labScores[part] ?? 0,score); });
  labResult = {id:part,answers};
  render();
  const results = main.querySelector("form[data-form=lab]").previousElementSibling;
  results.tabIndex = -1;
  results.focus();
 }
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
document.addEventListener("input", event => {
 if (event.target.id !== "lesson-search") return;
 const value = event.target.value.toLowerCase().trim();
 const results = lessons.filter(lesson => [lesson[0],lesson[1],lesson[2],...lesson[3]].join(" ").toLowerCase().includes(value));
 document.querySelector("#search-output").innerHTML = results.length ? results.map(lessonRow).join("") : '<p>No lessons match that search.</p>';
 document.querySelector("#search-status").textContent = results.length ? `${results.length} matching lessons` : "No lessons match that search.";
});
render();
