"use strict";

const storeKey = "security-plus-academy-v1";
const quizKey = "security-plus-academy-quiz";
const objectiveIds = lessons.map(lesson => lesson[0]);
const careerLessonIds = careerTracks.flatMap(track => track.lessons.map(lesson => track.id+"/"+lesson.id));
const challengeIds = Object.entries(careerChallenges).flatMap(([track,items])=>items.map(item=>challengeKey(track,item)));
const trackIds = careerTracks.map(track => track.id);
const allQuestions = lessons.flatMap(lesson => lesson.slice(5).map(([prompt, correct, ...others], index) => ({
 id: `${lesson[0]}-${index + 1}`, objective: lesson[0], prompt, correct, options: [correct, ...others.slice(0, 3)], reason: others[3]
})));
const questionsById = new Map(allQuestions.map(question => [question.id,question]));
const quizScopes = ["mixed","missed",...domains.map((_,i)=>String(i+1)),...objectiveIds];

function quizTitle(scope, mock) {
 if (mock) return "Mixed mock quiz";
 if (scope === "mixed") return "Mixed domains";
 if (scope === "missed") return "Missed questions";
 return scope.includes(".") ? "Objective "+scope : domains[Number(scope)-1].short;
}
function validIds(values, allowed) {
 return Array.isArray(values) ? [...new Set(values.filter(value=>allowed.includes(value)))] : [];
}
function normaliseProgress(raw) {
 const saved = raw && typeof raw === "object" ? raw : {};
 const attempts = Array.isArray(saved.attempts) ? saved.attempts.filter(attempt =>
  attempt && typeof attempt.title === "string" && typeof attempt.date === "string" &&
  Number.isFinite(Date.parse(attempt.date)) && Number.isInteger(attempt.total) &&
  attempt.total > 0 && attempt.total <= 20 && Number.isInteger(attempt.correct) &&
  attempt.correct >= 0 && attempt.correct <= attempt.total
 ).map(({scope,title,date,total,correct})=>({scope,title,date,total,correct})) : [];
 const labScores = {};
 for (const lab of labs) {
  const score = saved.labScores?.[lab.id];
  if (Number.isInteger(score) && score >= 0 && score <= lab.tasks.length) labScores[lab.id] = score;
 }
 return {
  done:validIds(saved.done,objectiveIds), attempts,
  missed:validIds(saved.missed,[...questionsById.keys()]), labScores,
  last:objectiveIds.includes(saved.last) ? saved.last : null,
  careerDone:validIds(saved.careerDone,careerLessonIds),
  projectsTried:validIds(saved.projectsTried,trackIds),
  challengesDone:validIds(saved.challengesDone,challengeIds)
 };
}
function readProgress(raw) {
 try { return normaliseProgress(JSON.parse(raw)); }
 catch { return normaliseProgress(null); }
}

let storageAvailable = true;
let state = normaliseProgress(null);
try { state = readProgress(localStorage.getItem(storeKey)); }
catch { storageAvailable = false; }

function changeProgress(update) {
 // Read the latest snapshot so a tab opened earlier does not erase newer progress.
 try {
  if (storageAvailable) state = readProgress(localStorage.getItem(storeKey));
 } catch { storageAvailable = false; }
 update(state);
 try {
  localStorage.setItem(storeKey,JSON.stringify(state));
  storageAvailable = true;
 } catch { storageAvailable = false; }
}

function restoreQuiz(raw) {
 if (!raw || !quizScopes.includes(raw.scope) || typeof raw.mock !== "boolean" ||
     typeof raw.finished !== "boolean" || !Array.isArray(raw.list) || !Array.isArray(raw.answers) ||
     !Number.isInteger(raw.index) || raw.index < 0 || raw.index >= raw.list.length ||
     raw.list.length > (raw.mock ? 20 : 10)) return null;
 const list = raw.list.map(saved => {
  const question = questionsById.get(saved?.id);
  if (!question || !Array.isArray(saved.options) || saved.options.length !== question.options.length ||
      !question.options.every(option=>saved.options.includes(option))) return null;
  return {...question,options:saved.options};
 });
 if (list.some(q=>!q) || new Set(list.map(q=>q.id)).size !== list.length) return null;
 const answered = raw.answers.length;
 if (raw.finished ? raw.index !== list.length-1 || answered !== list.length
                  : answered !== raw.index && (raw.mock || answered !== raw.index+1)) return null;
 if (!raw.answers.every((answer,i)=>list[i].options.includes(answer))) return null;
 return {title:quizTitle(raw.scope,raw.mock),scope:raw.scope,mock:raw.mock,finished:raw.finished,index:raw.index,list,answers:raw.answers};
}

let quiz = null;
try { quiz = restoreQuiz(JSON.parse(sessionStorage.getItem(quizKey))); }
catch { /* A blocked or malformed session starts without a resumable quiz. */ }

function saveQuiz() {
 try {
  const {scope,mock,finished,index,list,answers} = quiz;
  sessionStorage.setItem(quizKey,JSON.stringify({scope,mock,finished,index,answers,list:list.map(({id,options})=>({id,options}))}));
 } catch { /* A live quiz still works when session storage is unavailable. */ }
}
