const projectFields = {
 quant:{brief:"Start with £10,000. Go long when the fast average is above the slow average, and go flat when it is at or below it. Both use closed candles. Any trade fills at the following session’s open.",note:"Synthetic candles. Each side pays the selected fee. Buy and hold pays the same entry fee. Open positions are valued at the last close, with no forced closing trade. Drawdown uses end-of-session equity.",fields:[
  ["fast","Fast average",[[3,"3 sessions"],[5,"5 sessions"],[8,"8 sessions"]]],
  ["slow","Slow average",[[10,"10 sessions"],[15,"15 sessions"],[20,"20 sessions"]]],
  ["fee","Fee per side",[[0,"0%"],[0.15,"0.15%"],[0.30,"0.30%"],[1,"1%"]],0.15]
 ],action:"Run backtest",task:"Run it at 0.15%, then at 0.30% with the same windows. Compare trade count and net return. Explain which one changed and why."},
 ai:{brief:"You’re testing a classifier for a school help desk. Choose a prompt and a dataset, then score the saved predictions against the expected labels.",note:"These are fixed example responses for practice. Development and held-out tickets are distinct. Missing or unknown labels count as invalid predictions.",fields:[
  ["version","Prompt version",[["baseline","A · Short prompt"],["candidate","B · Label definitions"]]],
  ["sample","Dataset",[["development","Development · 6 tickets"],["holdout","Held-out check · 6 tickets"]]]
 ],action:"Evaluate predictions",task:"Run both prompts on the development set and check which catches more security reports. Repeat on the held-out set. Find a ticket the stronger prompt still gets wrong."},
 software:{brief:"Your school needs cover for an absent teacher. Select a lesson to run the eligibility and ranking rules across the staff roster.",note:"A booking in the same slot or a projected total above the weekly cap blocks eligibility. Among eligible staff, a subject match ranks first, then lower assigned workload. Hitting the cap exactly is allowed.",fields:[
  ["lesson","Lesson to cover",[["maths","Maths · Tuesday period 2 · 60 min"],["computing","Computing · Tuesday period 3 · 60 min"],["physics","Physics · Wednesday period 1 · 90 min"]]]
 ],action:"Find suitable staff",task:"Run Maths and Physics. Find the Maths specialist who can take the cover at their exact limit but would go over their limit with Physics."},
 cyber:{brief:"A school grade portal has an authentication-only handler and a patched handler. Select a session and record to try a request, then compare all four access cases in the regression tests.",note:"Simulated requests using fictional data. The patched policy allows pupils to see only their own grades. A teacher assigned to the class can see both records.",fields:[
  ["handler","Handler",[["vulnerable","Authentication only"],["patched","Authentication and record permissions"]]],
  ["session","Session",[["pupil","Pupil · record 101"],["teacher","Teacher · assigned to the class"],["guest","Signed out"]]],
  ["record","Requested record",[[101,"/grades/101"],[102,"/grades/102"]],102]
 ],action:"Send request and run tests",task:"Request record 102 as the pupil in both modes. Then check that the patched handler still lets the teacher read that record."}
};

const marketCloses = [101,100,102,104,105,107,108,110,109,111,112,109,107,103,101,97,96,95,96,94,92,94,95,97,100,103,105,108,111,112,110,114,117,119,117,116,110,108,103,102,99,96,100,103,107,106,112,118,117,120];
const market = marketCloses.map((close,i) => ({close,open:i ? marketCloses[i-1] + [0.45,-0.25,0.15,-0.55][i%4] : 100}));
function movingAverage(index, window) {
 return market.slice(index-window+1,index+1).reduce((sum,candle)=>sum+candle.close,0)/window;
}
function runBacktest(fast, slow, fee) {
 const start = 10000;
 let cash = start;
 let quantity = 0;
 let peak = start;
 let drawdown = 0;
 let target = false;
 const fills = [];
 const equity = market.map(({open,close},i) => {
  if (target && !quantity) {
   quantity = cash / (open * (1+fee));
   cash = 0;
   fills.push({signal:i, session:i+1, action:"Buy", price:open});
  } else if (!target && quantity) {
   cash = quantity * open * (1-fee);
   quantity = 0;
   fills.push({signal:i, session:i+1, action:"Sell", price:open});
  }
  const value = cash + quantity * close;
  peak = Math.max(peak,value);
  drawdown = Math.max(drawdown,(peak-value)/peak);
  target = i >= slow-1 && movingAverage(i,fast) > movingAverage(i,slow);
  return value;
 });
 const benchmark = market.map(({close}) => start * close / (market[0].open * (1+fee)));
 return {equity, benchmark, fills, drawdown, start};
}

const evalTickets = {
 development:[
  ["Someone reset my password and it wasn’t me.","Security","Login","Security"],
  ["I’ve forgotten my password.","Login","Login","Login"],
  ["The same subscription payment went through twice.","Billing","Billing","Billing"],
  ["I can sign in on my laptop but not my phone.","Login","Login","Login"],
  ["I opened a link in an email asking for my code.","Security","Security","Security"],
  ["Where do I download the invoice?","Billing","Other","Billing"]
 ],
 holdout:[
  ["My device shows a login approval I didn’t request.","Security","Login","Security"],
  ["Can you send the receipt for the renewal?","Billing","Billing","Billing"],
  ["The login page rejects my known temporary password.","Login","Login","Login"],
  ["A former employee can still read our files.","Security","Other","Login"],
  ["Our school needs to change the payment contact.","Billing","Billing","Billing"],
  ["I’ve locked myself out after several failed attempts.","Login","Security","Login"]
 ]
};
function scorePredictions(sample, version) {
 const cases = evalTickets[sample].map(([ticket,expected,base,candidate]) => ({ticket,expected,predicted:version==="baseline" ? base : candidate}));
 const allowed = ["Login","Billing","Security"];
 const security = cases.filter(item=>item.expected==="Security");
 return {
  cases,
  correct:cases.filter(item=>item.predicted===item.expected).length,
  securityCorrect:security.filter(item=>item.predicted==="Security").length,
  securityTotal:security.length,
  invalid:cases.filter(item=>!allowed.includes(item.predicted)).length
 };
}

const coverRoster = [
 {name:"Asha Patel", subject:"Maths", assigned:180, cap:240, busy:[]},
 {name:"Chris Evans", subject:"Physics", assigned:120, cap:240, busy:["Tue 2"]},
 {name:"Nia Clarke", subject:"Computing", assigned:60, cap:180, busy:["Tue 3"]},
 {name:"Leo Walsh", subject:"Maths", assigned:60, cap:180, busy:["Tue 2"]},
 {name:"Sam Ali", subject:"Computing", assigned:120, cap:180, busy:[]}
];
const coverSessions = {maths:{subject:"Maths",slot:"Tue 2",mins:60},computing:{subject:"Computing",slot:"Tue 3",mins:60},physics:{subject:"Physics",slot:"Wed 1",mins:90}};
function findCover(lesson) {
 const {subject,slot,mins} = coverSessions[lesson];
 return coverRoster.map(staff => {
  const projected = staff.assigned + mins;
  const reasons = [];
  if (staff.busy.includes(slot)) reasons.push("Already booked");
  if (projected > staff.cap) reasons.push("Over weekly cap");
  return {...staff, projected, reasons, match:staff.subject===subject};
 }).sort((a,b) => Number(Boolean(a.reasons.length))-Number(Boolean(b.reasons.length)) || Number(b.match)-Number(a.match) || a.assigned-b.assigned);
}

const accessCases = [
 ["pupil",101,200,"Pupil requests their own record"],
 ["pupil",102,403,"Pupil requests a classmate’s record"],
 ["teacher",102,200,"Assigned teacher requests a class record"],
 ["guest",101,401,"Signed-out visitor requests a record"]
];
function gradeRequest(handler, session, record) {
 if (session !== "pupil" && session !== "teacher") return 401;
 if (record !== 101 && record !== 102) return 404;
 if (handler === "patched" && session === "pupil" && record !== 101) return 403;
 return 200;
}
