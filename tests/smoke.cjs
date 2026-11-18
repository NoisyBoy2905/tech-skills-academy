"use strict";

const assert = require("node:assert/strict");
const {existsSync,readFileSync} = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const dist = path.join(__dirname,"../dist");
const html = readFileSync(path.join(dist,"index.html"),"utf8");
const scripts = [...html.matchAll(/<script defer src="([^"]+)"/g)].map(match=>match[1]);
const elements = new Map();
const listeners = new Map();
const element = selector => {
 if (!elements.has(selector)) {
  elements.set(selector,{innerHTML:"",classList:{toggle(){}},setAttribute(){},removeAttribute(){},remove(){},focus(){},
   contains(target){ return target?.attached !== false; },
   querySelector(){ return null; }});
 }
 return elements.get(selector);
};
const storage = () => {
 const values = new Map();
 return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
};
const sessionStorage = storage();
const localStorage = storage();
const context = vm.createContext({
 document:{body:element("body"),querySelector:element,addEventListener:(name,fn)=>listeners.set(name,fn)},
 localStorage,sessionStorage,URL,URLSearchParams,location:{hash:""},
 history:{pushState(_state,_title,hash){context.location.hash=hash;}},
 FormData:class { constructor(target){return new Map(Object.entries(target.fields??{}));} },
 matchMedia:()=>({matches:false,addEventListener(){}}),
 window:{addEventListener(){},scrollTo(){}}
});
const run = expression => vm.runInContext(expression,context);
const json = expression => JSON.parse(run("JSON.stringify("+expression+")"));
for (const file of scripts) vm.runInContext(readFileSync(path.join(dist,file),"utf8"),context,{filename:file});
for (const [,asset] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
 if (!asset.startsWith("https:") && !asset.startsWith("#")) assert.ok(existsSync(path.join(dist,asset)),asset);
}
const routes = new Set(json(`[
 "dashboard","applications","opportunities",...trackIds.map(id=>"opportunities/"+id),"curriculum","practice","practice/missed","practice/session","labs","progress","careers","main",
 "certifications",...certifications.map(cert=>"certifications/"+cert.id),
 ...Object.keys(studySections).flatMap(section=>[...careerTracks.map(track=>section+"/"+track.id),...certifications.map(cert=>cert.routes[section])]),
 ...objectiveIds.map(id=>"lesson/"+id),
 ...domains.flatMap((_,i)=>["curriculum/"+(i+1),"practice/"+(i+1)]),
 ...labs.map(lab=>"labs/"+lab.id),
 ...careerTracks.flatMap(track=>["careers/"+track.id,"careers/"+track.id+"/project",...track.lessons.map(lesson=>"careers/"+track.id+"/"+lesson.id),...careerChallenges[track.id].map(task=>"careers/"+track.id+"/"+task.id)])
]`));
function validateMarkup(markup, name) {
 assert.doesNotMatch(markup,/\bundefined\b|\bNaN\b/,name);
 const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]);
 assert.equal(ids.length,new Set(ids).size,name+" duplicate ID");
 for (const [,ref] of markup.matchAll(/\s(?:for|aria-labelledby|aria-controls)="([^"]+)"/g)) {
  for (const id of ref.split(" ")) assert.ok(ids.includes(id),name+" missing ID "+id);
 }
 for (const [,route] of markup.matchAll(/href="#([^"]+)"/g)) assert.ok(routes.has(route),name+" broken route "+route);
}
function check(route) {
 context.location.hash="#"+route;
 run("render()");
 const main = element("#main").innerHTML;
 assert.match(main,/<h1>/,route);
 validateMarkup(element("#topbar").innerHTML+main,route);
 return main;
}
for (const route of routes) check(route);
assert.match(check("practice/session"),/Quiz session unavailable/);
assert.match(check("practice/missed"),/no missed questions/);
for (const invalid of ["unknown","curriculum/01","lesson/1.8","practice/foo","dashboard/extra","careers/quant/project/extra"]) {
 assert.match(check(invalid),/Page unavailable/,invalid);
}

assert.equal(run("allQuestions.length"),56);
assert.equal(run("questionsById.size"),56);
assert.ok(run("allQuestions.every(q=>new Set(q.options).size===4 && q.options.includes(q.correct))"));
assert.equal(run("careerLessonIds.length"),12);
assert.ok(run("careerTracks.every(t=>t.lessons.every(l=>l.options[l.correct]))"));
assert.deepEqual(json('readProgress("{broken").done'),[]);
assert.deepEqual(json('normaliseProgress({done:["1.1","1.1",{}],careerDone:null,attempts:[null],labScores:{recovery:9}})'),{
 done:["1.1"],attempts:[],missed:[],labScores:{},last:null,careerDone:[],projectsTried:[],challengesDone:[]
});
assert.equal(run('optionIndex(new Map(),"answer",3)'),-1);
assert.equal(run('optionIndex(new Map([["answer","0"]]),"answer",3)'),0);
assert.equal(run('optionIndex(new Map([["answer","7"]]),"answer",3)'),-1);
assert.equal(run('optionIndex(new Map([["answer",""]]),"answer",3)'),-1);

run('startQuiz("1.1")');
assert.match(check("practice/session"),/QUESTION 1 \/ 2/);
assert.equal(run("quiz.list.length"),2);
run("nextQuestion()");
assert.equal(run("quiz.index"),0);
run("quiz.answers.push(quiz.list[0].correct); saveQuiz(); quiz = restoreQuiz(JSON.parse(sessionStorage.getItem(quizKey)))");
assert.match(check("practice/session"),/quiz-feedback/);
run("nextQuestion()");
assert.equal(run("quiz.index"),1);
run("quiz.answers.push(quiz.list[1].correct); nextQuestion(); nextQuestion()");
assert.equal(run("state.attempts.length"),1);
assert.match(check("practice/session"),/2 \/ 2 correct/);
run('startQuiz("mixed",true)');
assert.equal(run("quiz.list.length"),20);
assert.equal(run("new Set(quiz.list.map(q=>q.id)).size"),20);
assert.ok(!check("practice/session").includes("quiz-feedback"));
run("while (!quiz.finished) { quiz.answers.push(quiz.list[quiz.index].correct); nextQuestion(); }");
assert.match(check("practice/session"),/20 \/ 20 correct/);

run('changeProgress(p=>{p.missed=["1.1-1"]}); startQuiz("missed"); quiz.answers.push(quiz.list[0].correct); nextQuestion()');
assert.doesNotMatch(check("practice/session"),/data-action="retry"/);
const submit = fields => listeners.get("submit")({
 target:{dataset:{form:"lab"},reportValidity:()=>true,fields},preventDefault(){}
});
check("labs/recovery");
submit({task0:"2",task1:"0"});
assert.ok(!run('Object.hasOwn(state.labScores,"recovery")'));
assert.equal(run('gradeRequest("patched","pupil",102)'),403);
assert.equal(run('gradeRequest("vulnerable","pupil",102)'),200);
assert.equal(run('gradeRequest("patched","teacher",999)'),404);
assert.ok(run('accessCases.every(([session,record,code])=>gradeRequest("patched",session,record)===code)'));
assert.equal(run('findCover("maths")[0].name'),"Asha Patel");
assert.ok(run('findCover("physics").find(staff=>staff.name==="Asha Patel").reasons.includes("Over weekly cap")'));
assert.equal(run('scorePredictions("development","candidate").securityCorrect'),2);
assert.equal(run('scorePredictions("holdout","candidate").securityCorrect'),1);
assert.ok(run('runBacktest(3,10,.003).equity.at(-1)<runBacktest(3,10,.0015).equity.at(-1)'));
assert.ok(run('runBacktest(3,10,.003).fills.every(fill=>fill.session===fill.signal+1)'));
for (const track of json("trackIds")) {
 const route = "careers/"+track+"/project";
 check(route);
 run("projectResult = Object.fromEntries(projectFields[part].fields.map(([name,,options])=>[name,String(options[0][0])]))");
 assert.match(check(route),/id="project-output"/);
}
console.log("Checked "+routes.size+" routes, local asset paths, rendered ID references, progress migration, quiz and validation edge cases, and all four project engines.");

assert.equal(run('matchingOpportunities("all","apprentice","local","2026-11-17").length'),4);
assert.ok(run('matchingOpportunities("all","apprentice","local","2026-11-17").every(item=>Number(item.level.split(" ")[1])>=5)'));
assert.ok(run('matchingOpportunities("ai","apprentice","london","2026-11-20").every(item=>item.company!=="British Airways")'));
assert.deepEqual(json('new URL(opportunitySearchUrls("ai","kent").faa).searchParams.getAll("levelIds")'),["5","6","7"]);
assert.equal(run('new URL(opportunitySearchUrls("ai","kent").faa).searchParams.get("searchTerm")'),"data science");
assert.equal(run('new URL(opportunitySearchUrls("quant","local").kentJobs).searchParams.get("l")'),"Kent");
assert.equal(run("challengeIds.length"),8);
assert.ok(run("Object.values(careerChallenges).flat().every(task=>task.fields.every(field=>challengeAnswerMatches(field,String(field.answer))))"));
assert.ok(!run("Object.values(careerChallenges).flat().some(task=>task.fields.some(field=>challengeAnswerMatches(field,'')))"));
assert.ok(run('challengeAnswerMatches(careerChallenges.quant[0].fields[2],"1.009709")'));
assert.ok(!run('challengeAnswerMatches(careerChallenges.quant[0].fields[2],"1.009000")'));
console.log("Level 5+ search links, closing dates and all eight challenge answer sets verified.");

run('changeProgress(p=>{p.done=[]; p.last="5.3";})');
assert.match(check("dashboard"),/Choose your learning path/);
assert.match(check("certifications/security-plus"),/href="#lesson\/1\.1">Start Security\+/);
assert.doesNotMatch(check("dashboard"),/Continue Security\+/);
assert.doesNotMatch(element("#topbar").innerHTML,/Security\+ progress/);
assert.match(element("#topbar").innerHTML,/Tech Skills Academy/);
run('changeProgress(p=>{p.done=["1.1"]; p.last="1.1";})');
assert.match(check("certifications/security-plus"),/Continue Security\+/);
assert.match(check("certifications/security-plus"),/href="#lesson\/1\.2">Open lesson/);
run('changeProgress(p=>{p.done=objectiveIds;})');
assert.match(check("certifications/security-plus"),/Mixed practice/);
console.log("Dashboard verified for first-time, returning and completed learners.");

for (const section of json("Object.keys(studySections)")) {
 for (const track of json("[...trackIds,...certifications.map(cert=>cert.id)]")) {
  const markup = check(section+"/"+track);
  assert.ok(!markup.includes("Page unavailable"),section+"/"+track);
  const navigation = markup;
  assert.ok(navigation.includes('href="#'+section+'/'+track+'" class="active" aria-current="page"'),section+"/"+track);
 }
}
assert.match(check("curriculum/quant"),/lesson-row/);
assert.match(check("practice/ai"),/career-card/);
assert.match(check("labs/software"),/Open project/);
assert.match(check("practice/security-plus"),/Mixed mock quiz/);
assert.match(check("labs/security-plus"),/Security\+ PBQ labs/);
assert.match(element("#topbar").innerHTML, /href="#certifications" class="active" aria-current="location"/);
assert.match(check("opportunities"), /href="#opportunities" class="active" aria-current="page"/);
assert.match(element("#topbar").innerHTML, /href="#careers" class="active" aria-current="location"/);
assert.match(check("applications"), /href="#applications" class="active" aria-current="page"/);
assert.match(check("careers"),/Jobs and apprenticeships/);
assert.match(check("certifications"),/CompTIA Security\+/);
assert.match(check("dashboard"),/href="#careers"/);
assert.match(check("dashboard"),/href="#certifications"/);
assert.doesNotMatch(check("curriculum"),/Security\+/);
assert.doesNotMatch(check("certifications"),/Quant development/);
console.log("Careers and Certifications own their respective pages and top tabs.");
