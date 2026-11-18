"use strict";

const careerChallenges = {
 quant:[
  {id:"next-bar",title:"Next-bar fill audit",module:"Q3–Q4",summary:"Trace a rule from candle close to the next open and catch look-ahead bias.",
   brief:"The account starts flat. The close of session 1 sets a long target. The close of session 2 sets a flat target. Fill at the next session’s open. Use all available equity, fractional units and zero fees.",
   evidence:[["Session","Open","Close","Target decided at close"],["1","100","102","Long"],["2","103","105","Flat"],["3","104","100","Flat"],["4","99","101","Flat"]],
   fields:[
    {label:"Entry fill price",kind:"number",answer:103,reason:"The first signal is only known at the end of session 1. Its next open is 103."},
    {label:"Exit fill price",kind:"number",answer:104,reason:"The flat signal appears at the end of session 2. You remain long until session 3 opens at 104."},
    {label:"Final equity multiplier (six decimal places)",kind:"number",answer:104/103,tolerance:0.000001,reason:"You paid 103 per unit and received 104. Starting equity is multiplied by 104 ÷ 103."},
    {label:"Which rolling window avoids future data?",choices:["Current close and two previous closes","Previous, current and next closes"],answer:0,reason:"At the current close, the next session’s close is still unknown."}
   ],local:"Implement the fill ledger in Python. Add tests for a final-bar signal with no next open and a position held across consecutive gaps."},
  {id:"friction",title:"Fees and slippage ledger",module:"Q5",summary:"Work out which fills cost money in a flat synthetic market.",
   brief:"All opens and closes are £100. The targets after sessions 1–4 are Long, Flat, Long, Flat. Each target takes effect at the following open. Deduct a simplified round of costs of 10 basis points in fees plus 5 basis points in slippage on each fill. One basis point is 0.01%.",
   evidence:[["Session","Open","Close target"],["1","£100","Long"],["2","£100","Flat"],["3","£100","Long"],["4","£100","Flat"]],
   fields:[
    {label:"Number of filled orders",kind:"number",answer:3,reason:"The first three targets fill within the sample. Session 4 has no next open."},
    {label:"Final equity multiplier (six decimal places)",kind:"number",answer:0.9985**3,tolerance:0.000001,reason:"There are three costs of 0.15% of current equity, so multiply by 0.9985 three times."},
    {label:"What cost applies on a bar where the position stays the same?",choices:["No turnover cost","15 bps on the existing position","30 bps for both sides"],answer:0,reason:"In this model, fees and slippage apply to fills. Holding a position generates no new fill."}
   ],local:"Extend your Python ledger with fee_bps and slippage_bps. Add a test in which a position stays long and pays no extra cost on a hold bar."}
 ],
 ai:[
  {id:"response-replay",title:"Recorded response repair",module:"A1–A2",summary:"Validate a captured model response and decide when to request a correction.",
   brief:"Replay a recorded support-ticket response. The schema accepts category billing, bug or feature, an integer priority from 1 to 5, and a non-empty summary. Your client allows one retry using the validator’s error. The captured response is valid JSON once its code fence is removed.",
   sample:'```json\n{"category":"bug","priority":7,"summary":"Login crashes"}\n```',
   fields:[
    {label:"Which field still fails once the fence is removed?",choices:["priority","category","summary"],answer:0,reason:"Seven is an integer but exceeds the permitted range."},
    {label:"What should happen after validation fails?",choices:["Ask for one corrected response using the validation error","Accept the result","Retry until any JSON parses"],answer:0,reason:"Report the schema error to the model or replay client and cap retries."},
    {label:"A replay entry needs to distinguish which requests?",choices:["Requests with different model, prompt or schema settings","Only requests with different labels","Only requests made at different times"],answer:0,reason:"A replay key should represent all the request inputs that can change the response."}
   ],local:"With Python, hash a canonical JSON representation of the model and request using hashlib.sha256. Validate with Pydantic and test one recorded response that succeeds after a single repair."},
  {id:"rag-citations",title:"Ground a retrieved answer",module:"A4",summary:"Check policy citations against the passages actually retrieved.",
   brief:"The question is whether staff need MFA for remote admin access. The model says yes, citing P3. Use the retrieved policy fragments to decide whether to accept that answer and which source should support a corrected version.",
   evidence:[["ID","Evidence"],["P1","Remote administrator access requires multi-factor authentication."],["P2","Routine password resets are handled by the help desk."]],
   fields:[
    {label:"Which retrieved passage supports the answer?",choices:["P1","P2","P3"],answer:0,reason:"P1 explicitly covers remote administrator access. P3 is absent from the retrieved evidence."},
    {label:"What should the verifier do with the submitted citation?",choices:["Reject it because P3 was not retrieved","Accept it because the conclusion sounds right","Swap it to P2 without checking"],answer:0,reason:"A valid citation must identify an available source that supports the claim."},
    {label:"If the retrieved evidence only contained P2, what should the assistant return?",choices:["Insufficient context","The original answer with P3","The same answer citing P2"],answer:0,reason:"P2 does not say whether remote administrator access requires MFA."}
   ],local:"Write a Python function that checks citation IDs against retrieved chunks. Add a separate test where the ID exists but the passage does not support the claim."}
 ],
 software:[
  {id:"sqlite-cover",title:"SQLite cover constraints and ranking",module:"S3–S4",summary:"Test which assignments the database should reject and rank eligible staff.",
   brief:"You are covering Maths on Tuesday in period 2. Exclude teachers who are absent, teaching, or already covering in that period. Rank subject matches first, then fewest covers this week.",
   evidence:[["Teacher","Subject","Tuesday period 2","Weekly covers"],["Asha","Maths","Free","2"],["Leo","Maths","Teaching","0"],["Nia","Computing","Free","0"],["Chris","Maths","Absent","0"],["Sam","Maths","Already covering","1"]],
   fields:[
    {label:"Who ranks first?",choices:["Leo","Nia","Asha","Sam"],answer:2,reason:"Asha is the only available Maths specialist. Nia is eligible but ranks behind a subject match."},
    {label:"Which rule catches the same teacher booked twice in one slot?",choices:["Unique constraint on teacher, date and period","Primary key on assignment ID alone","Foreign key on absence ID"],answer:0,reason:"Two different assignment IDs can still refer to the same teacher and slot."},
    {label:"Which access pattern retains candidates with zero covers?",choices:["INNER JOIN on cover records","LEFT JOIN with a zero-aware count","Filter for more than zero covers"],answer:1,reason:"A left join retains a teacher with no matching cover record. Count the joined assignment ID."}
   ],local:"Implement the schema and parameterised eligibility query using Python’s sqlite3 module. Test orphan references with PRAGMA foreign_keys = ON and verify that the query returns Asha before Nia."},
  {id:"atomic-cover",title:"Atomic cover assignment tests",module:"S5–S6",summary:"Work through workload limits, double-booking and rollback.",
   brief:"The cap is two cover periods per teacher per day. An assignment and its notification are written to the same database. A failed allocation must leave both tables unchanged. Use separate seed data for each test.",
   evidence:[["Case","Existing cover periods","Requested period","Notification write"],["A","1","Free","Succeeds"],["B","2","Free","Never attempted"],["C","0","Already teaching","Never attempted"],["D","1","Free","Fails"]],
   fields:[
    {label:"Which case reaches exactly the limit and should commit?",choices:["A","B","C","D"],answer:0,reason:"One existing cover plus one new cover gives two, and both writes succeed."},
    {label:"How many new assignments should remain after case D?",kind:"number",answer:0,reason:"The notification error rolls back the transaction, including the assignment insert."},
    {label:"What should case C prove?",choices:["The service rejects clashes even below the workload cap","The service only checks workload","An already-timetabled period takes priority over the cap"],answer:0,reason:"Availability and workload limits are independent checks."}
   ],local:"Write independent pytest tests for exactly-at-cap, above-cap, timetable clash and notification rollback. Use a fresh database or isolated transaction for each test."}
 ],
 cyber:[
  {id:"log-investigation",title:"Password-spray investigation",module:"C6 · SY0-701 2.4, 4.4",summary:"Correlate sign-in and web logs to identify a source and separate observations from conclusions.",
   brief:"In this exercise, flag five distinct failed accounts from one IP within ten minutes. Times are UTC. A sensitive path returned HTTP 200, which confirms a successful HTTP response. You still need to verify what the response contained.",
   evidence:[["Time","Source IP","Event"],["09:00","198.51.100.42","Failed a.khan"],["09:01","198.51.100.42","Failed b.reed"],["09:02","198.51.100.42","Failed c.hill"],["09:04","198.51.100.42","Failed d.patel"],["09:05","198.51.100.42","Failed j.smith"],["09:06","198.51.100.42","Accepted j.smith"],["09:07","198.51.100.42","GET /backup.sql → 200"],["09:08","203.0.113.9","Five failures for the same user"]],
   fields:[
    {label:"IP address meeting the spray rule",kind:"text",answer:"198.51.100.42",reason:"That IP failed against five different accounts in five minutes. The other IP repeated failures against one account."},
    {label:"Account with a successful sign-in after the failures",kind:"text",answer:"j.smith",reason:"The authentication log records a successful sign-in for j.smith at 09:06."},
    {label:"Sensitive path returning HTTP 200",kind:"text",answer:"/backup.sql",reason:"The web log records HTTP 200 for /backup.sql. Inspect the response or application logs to see what was served."}
   ],local:"Write a Python parser with a rolling ten-minute window per IP. Test that five failures against a single account do not trigger the spray rule."},
  {id:"firewall-headers",title:"Firewall and session hardening",module:"C1–C5",summary:"Apply a first-match firewall policy and choose the right protections for a session cookie.",
   brief:"Rules are read from top to bottom. The public website belongs in the DMZ and SSH management is restricted to IT. The site has a session cookie that should stay off plain HTTP and out of JavaScript.",
   evidence:[["Order","Source","Destination","TCP port","Action"],["1","Public","DMZ web","443","Allow"],["2","IT","DMZ web","22","Allow"],["3","Any","Any","Any","Deny"]],
   fields:[
    {label:"Decision for a public client sending SSH to the DMZ web server",choices:["Allow under rule 1","Allow under rule 2","Deny under rule 3"],answer:2,reason:"The public SSH request matches neither allow rule and reaches the default deny."},
    {label:"Which cookie flag limits transmission to secure connections?",choices:["Secure","HttpOnly","SameSite"],answer:0,reason:"Secure limits where the browser sends the cookie."},
    {label:"Which cookie flag blocks JavaScript from reading the cookie?",choices:["Secure","HttpOnly","SameSite"],answer:1,reason:"HttpOnly blocks access through script APIs such as document.cookie."}
   ],local:"Write a first-match rule evaluator and a separate cookie-attribute checker. Test public HTTPS, public SSH, IT SSH, and a cookie missing HttpOnly."}
 ]
};

function challengeAnswerMatches(field,value) {
 if (typeof value !== "string" || !value.trim()) return false;
 if (field.choices) return value === String(field.answer);
 if (field.kind==="text") return value.trim().toLowerCase() === field.answer.toLowerCase();
 const number = Number(value);
 return Number.isFinite(number) && Math.abs(number-field.answer) <= (field.tolerance ?? 0);
}
function challengeKey(track,challenge) {
 return track + "/" + challenge.id;
}
function challengeCards(track, showHeading = true) {
 return `<section class="dash-section">${showHeading ? head("Practice challenges","Work through a fixture and check your result.") : ""}
 <div class="career-grid">${careerChallenges[track.id].map(challenge=>{
  const passed = state.challengesDone.includes(challengeKey(track.id,challenge));
  return `<a class="card career-card" href="#careers/${track.id}/${challenge.id}">
   <div class="card-top"><span class="tag">${challenge.module}</span>${icon(passed?"check":"arrow")}</div>
   <h3>${challenge.title}</h3><p>${challenge.summary}</p>${passed?'<span class="domain-meta">Passed</span>':""}</a>`;
 }).join("")}</div></section>`;
}
function challengePage(track,challenge) {
 return `${back("practice/"+track.id,track.name+" practice")}${intro(challenge.title,challenge.summary,challenge.module)}
 <section class="panel"><h2>Scenario</h2><p>${challenge.brief}</p>${challenge.evidence ? evidenceTable(challenge.evidence,"Challenge evidence") : ""}
 ${challenge.sample ? `<pre class="challenge-code"><code>${esc(challenge.sample)}</code></pre>` : ""}</section>
 <section class="panel"><h2>Your answers</h2>
 <form id="challenge-form" class="challenge-form" data-form="career-challenge">
  ${challenge.fields.map((field,i)=>`<label for="challenge-${i}">${field.label}</label>
   ${field.choices ? `<select id="challenge-${i}" name="answer${i}" required><option value="">Choose an answer</option>${field.choices.map((answer,j)=>`<option value="${j}">${answer}</option>`).join("")}</select>`
   : `<input id="challenge-${i}" name="answer${i}" type="${field.kind}" ${field.kind==="number"?'step="any"':""} required>`}`).join("")}
  <div class="actions"><button class="button dark" type="submit">Check challenge ${icon("check")}</button></div>
 </form><div id="challenge-result" aria-live="polite"></div></section>
 <section class="panel example"><h2>Build it in Python</h2><p>${challenge.local}</p></section>`;
}
function submitCareerChallenge(form) {
 const challenge = careerChallenges[part]?.find(item=>item.id===subpart);
 if (!challenge) return;
 const results = challenge.fields.map((field,i)=>challengeAnswerMatches(field,form.get("answer"+i)));
 const score = results.filter(Boolean).length;
 const key = challengeKey(part,challenge);
 if (score === results.length && !state.challengesDone.includes(key)) {
  changeProgress(progress=>{
   if (!progress.challengesDone.includes(key)) progress.challengesDone.push(key);
  });
 }
 const output = document.querySelector("#challenge-result");
 output.innerHTML = `<h3 tabindex="-1">${score} / ${results.length} correct${score===results.length?" · Passed":""}</h3>
 <ul>${challenge.fields.map((field,i)=>`<li><strong>${results[i]?"Correct.":"Try again."}</strong> ${field.reason}</li>`).join("")}</ul>`;
 output.querySelector("h3").focus();
}
