"use strict";

let careerFeedback = null;
let projectResult = null;
let projectError = false;

function careerCard(track) {
 const passed = careerChallenges[track.id].filter(challenge=>state.challengesDone.includes(challengeKey(track.id,challenge))).length;
 const count = track.lessons.filter(lesson => state.careerDone.includes(track.id+"/"+lesson.id)).length;
 return `<a class="card career-card" href="#careers/${track.id}">
 <div class="card-top">${iconTile(track.icon,track.color)}${icon("arrow")}</div>
 <h3>${track.name}</h3><p>${track.description}</p><span class="career-tools">${track.tools}</span>
 ${bar(pct(count,track.lessons.length))}<div class="domain-meta"><span>${count} / ${track.lessons.length} lessons</span><span>${state.projectsTried.includes(track.id) ? "Project tried" : "1 project"} · ${passed}/${careerChallenges[track.id].length} challenges</span></div></a>`;
}
function careerPage() {
 if (!part) return `${intro("Careers","Explore technical roles, build practical skills and find your next opportunity.")}
 ${careerTabs()}
 ${catalogueHero({label:"Jobs and apprenticeships",title:"Find your next role",
  description:"Browse relevant jobs and Level 5+ apprenticeships, then track your applications.",
  buttons:view("opportunities","Browse opportunities","primary"),symbol:"briefcase"})}
 <section class="dash-section">${head("Career tracks","Choose a track for lessons, practice and labs.")}
 <div class="career-grid catalogue-grid">${careerTracks.map(careerCard).join("")}</div></section>`;
 const track = careerTracks.find(track=>track.id===part);
 if (!track) return missing("careers");
 if (subpart === "project") return careerProject(track);
 if (subpart) {
  const challenge = careerChallenges[track.id].find(item=>item.id===subpart);
  if (challenge) return challengePage(track,challenge);
  const lesson = track.lessons.find(item=>item.id===subpart);
  return lesson ? careerLesson(track,lesson) : missing("careers/"+track.id);
 }
 const next = track.lessons.find(item=>!state.careerDone.includes(track.id+"/"+item.id));
 return `${back("careers","All career tracks")}
 <section class="track-hero ${track.color}"><div>${intro(track.name,track.description)}<div class="career-tools">${track.tools}</div></div><span class="track-emblem">${icon(track.icon)}</span></section>
 <section class="dash-section">${head("Lessons","Work through the track in order or jump to a topic.")}
 ${careerLessonRows(track)}${next ? `<div class="actions">${view("careers/"+track.id+"/"+next.id,track.lessons[0]===next ? "Start learning" : "Continue learning")}</div>` : ""}</section>
 ${careerProjectCard(track)}
 ${challengeCards(track)}
 <div class="actions">${view("opportunities/"+track.id,"Find apprenticeships and jobs","ghost")}</div>`;
}
function careerLessonRows(track) {
 return `<div class="row-list">${track.lessons.map((lesson,i) => {
  const completed = state.careerDone.includes(track.id+"/"+lesson.id);
  return `<a class="lesson-row" href="#careers/${track.id}/${lesson.id}"><span class="tag">${String(i+1).padStart(2,"0")}</span><span class="row-name">${lesson.title}</span>${completed ? `<small>Completed</small>${icon("check")}` : icon("chevron")}</a>`;
 }).join("")}</div>`;
}
function careerProjectCard(track) {
 return `<section class="dash-section panel project-callout"><div><div class="eyebrow">Practical project</div><h2>${track.project.title}</h2><p>${track.project.description}</p></div>${view("careers/"+track.id+"/project","Open project","ghost")}</section>`;
}
function careerLesson(track, lesson) {
 const root = "careers/"+track.id;
 const index = track.lessons.indexOf(lesson);
 const next = track.lessons[index+1];
 const feedback = careerFeedback;
 const complete = state.careerDone.includes(track.id+"/"+lesson.id);
 return `${back("curriculum/"+track.id,track.name+" curriculum")}${intro(lesson.title,lesson.intro,`Lesson ${index+1} of ${track.lessons.length}`)}
 <section class="panel"><h2>What to know</h2><ul>${lesson.concepts.map(point=>`<li>${point}</li>`).join("")}</ul></section>
 <section class="panel example"><h2>Worked scenario</h2><p>${lesson.example}</p></section>
 <section class="panel"><h2>Check your understanding</h2>
 <form data-form="career-answer"><fieldset class="lab-task"><legend>${lesson.q}</legend>
 <div class="opts">${lesson.options.map((option,i)=>`<label class="option ${feedback!==null && i===lesson.correct ? "correct" : ""} ${feedback===i && i!==lesson.correct ? "wrong" : ""}"><input type="radio" name="answer" value="${i}" ${feedback!==null ? "disabled" : "required"} ${feedback===i ? "checked" : ""}>${option}</label>`).join("")}</div></fieldset>
 ${feedback!==null ? `<div class="answer-note ${feedback===lesson.correct ? "" : "missed"}" id="career-feedback" role="status" tabindex="-1"><strong>${feedback===lesson.correct ? "Correct." : "Correct answer: "+lesson.options[lesson.correct]+"."}</strong> ${lesson.reason}</div>` : ""}
 <div class="actions">${feedback===null ? `<button class="button dark" type="submit">Check answer ${icon("arrow")}</button>` : feedback!==lesson.correct ? `<button class="button ghost" data-action="retryCareer" type="button">Try this question again</button>` : ""}
 ${complete ? view(root+"/"+(next?.id || "project"),next ? "Next lesson" : "Open project","dark") : ""}</div>
 ${complete ? '<p class="small-note">Lesson complete</p>' : ""}</form></section>`;
}
function careerProject(track) {
 const project = projectFields[track.id];
 const previous = projectResult;
 return `${back("labs/"+track.id,track.name+" labs")}${intro(track.project.title,track.project.description,"Practical project")}
 <section class="panel"><h2>Scenario</h2><p>${project.brief}</p>
 <form class="form-row actions" data-form="career-project">
 ${project.fields.map(([name,label,options,initial])=>`<label for="project-${name}">${label}<select id="project-${name}" name="${name}">${options.map(([value,text])=>`<option value="${value}" ${String(previous?.[name] ?? initial)===String(value) ? "selected" : ""}>${text}</option>`).join("")}</select></label>`).join("")}
 <button type="submit" class="button dark">${project.action} ${icon("arrow")}</button></form>
 <p class="small-note">${project.note}</p>
 ${projectError ? '<p class="answer-note missed" id="project-error" role="alert" tabindex="-1">Choose one of the available values for each field and try again.</p>' : ""}</section>
 ${previous ? `<section class="panel" aria-labelledby="project-output"><h2 id="project-output" tabindex="-1">Results</h2><p class="small-note">${project.fields.map(([name,label,options])=>label+": "+options.find(([value])=>String(value)===previous[name])[1]).join(" · ")}</p>${projectOutputs[track.id](previous)}</section>` : ""}
 <section class="panel example"><h2>Try this</h2><p>${project.task}</p></section>`;
}
function outputStats(items) {
 return `<div class="project-stats">${items.map(([label,value])=>`<div><span>${label}</span><strong>${value}</strong></div>`).join("")}</div>`;
}
function equityChart(equity, benchmark, start) {
 const all = [...equity,...benchmark,start];
 const min = Math.floor(Math.min(...all)/500)*500;
 const max = Math.max(min+500,Math.ceil(Math.max(...all)/500)*500);
 const x = i=>60+i/Math.max(1,equity.length-1)*640;
 const y = value=>190-(value-min)/(max-min)*175;
 const line = items=>items.map((value,i)=>`${x(i).toFixed(1)},${y(value).toFixed(1)}`).join(" ");
 const ticks = Array.from({length:5},(_,i)=>min+(max-min)*i/4);
 return `<figure class="equity-figure" tabindex="0" aria-label="Strategy equity chart">
 <svg class="equity-chart" viewBox="0 0 720 222" role="img" aria-label="Equity at each session close for the strategy and buy and hold">
 ${ticks.map(value=>`<line x1="55" x2="700" y1="${y(value)}" y2="${y(value)}" stroke="#dbe6dd"/><text x="49" y="${y(value)+4}" text-anchor="end">£${Math.round(value).toLocaleString("en-GB")}</text>`).join("")}
 <polyline points="${line(benchmark)}" fill="none" stroke="#67749f" stroke-width="2.2" stroke-dasharray="6 4"/>
 <polyline points="${line(equity)}" fill="none" stroke="#23704a" stroke-width="2.8"/>
 <text x="60" y="211">Session 1</text><text x="700" y="211" text-anchor="end">Session ${equity.length}</text>
 </svg><figcaption><span class="equity-key">Strategy</span><span class="equity-key benchmark">Buy and hold</span></figcaption></figure>`;
}
const projectOutputs = {
 quant(params) {
  const {equity,benchmark,fills,drawdown,start} = runBacktest(+params.fast,+params.slow,+params.fee/100);
  const rate = (result)=>((result.at(-1)/start-1)*100).toFixed(2)+"%";
  return outputStats([["Strategy return",rate(equity)],["Buy-and-hold return",rate(benchmark)],["Max drawdown",(drawdown*100).toFixed(2)+"%"],["Orders filled",fills.length]])+
  equityChart(equity,benchmark,start)+
  '<h3>Trade fills</h3>'+evidenceTable([["Side","Signal session close","Fill session open","Fill price"],...fills.map(fill=>[fill.action,fill.signal,fill.session,"£"+fill.price.toFixed(2)])]);
 },
 ai(params) {
  const result = scorePredictions(params.sample,params.version);
  return outputStats([["Correct labels",result.correct+" / "+result.cases.length],["Security recall",result.securityCorrect+" / "+result.securityTotal],["Invalid labels",result.invalid]])+
  evidenceTable([["Ticket","Expected","Predicted","Outcome"],...result.cases.map(item=>[item.ticket,item.expected,item.predicted,item.expected===item.predicted?"Correct":"Missed"])]);
 },
 software(params) {
  const ranked = findCover(params.lesson);
  const eligible = ranked.filter(staff=>!staff.reasons.length);
  return outputStats([["Top suggestion",eligible[0]?.name || "None"],["Eligible",eligible.length+" / "+ranked.length]])+
  evidenceTable([["Staff","Subject match","Existing minutes","After cover / cap","Eligibility"],...ranked.map(staff=>[staff.name,staff.match?"Yes":"No",staff.assigned,staff.projected+" / "+staff.cap,staff.reasons.join("; ") || "Available"])]);
 },
 cyber(params) {
  const statuses = {200:"200 OK",401:"401 Sign-in required",403:"403 Forbidden",404:"404 Record not found"};
  const actual = gradeRequest(params.handler,params.session,+params.record);
  const cases = accessCases.map(([session,record,expected,scenario])=>{
   const actual = gradeRequest(params.handler,session,record);
   return {scenario,expected,actual};
  });
  return outputStats([["Selected request",statuses[actual]],["Response",actual===200?`Grade: ${params.record==="101"?"B":"A"}`:"No grade returned"],["Policy tests passed",cases.filter(row=>row.expected===row.actual).length+" / "+cases.length]])+
  evidenceTable([["Scenario","Expected status","Actual status","Policy check"],...cases.map(row=>[row.scenario,row.expected,row.actual,row.actual===row.expected?"Pass":"Fail"])]);
 }
};
