// Career track lessons (quant, AI, software, cyber), restored from the original build.
const careerTracks = [
 {
  id:"quant", name:"Quant development", icon:"chart", color:"mint", tools:"Python · market data · testing",
  description:"Build and test rule-based strategies with market data, realistic execution and measurable results.",
  project:{title:"Moving-average backtester",description:"Change two moving-average windows and transaction costs, then compare a strategy with buy and hold."},
  lessons:[
   {id:"market-data",title:"Candles and clean market data",intro:"Prepare time-series data you can trust before building a strategy.",
    concepts:["An OHLCV candle groups open, high, low, close and volume over one interval. Check whether a data source timestamps the start or end, convert to a consistent time zone and exclude an unfinished candle when generating rules that require a close.",
    "Sort by timestamp, check duplicates and detect gaps against the expected trading calendar. For a market that trades continuously, a missing interval may be a data issue. A rolling indicator usually needs a warm-up period before its first valid value.",
    "A close-to-close return is current close ÷ previous close − 1. That describes price movement. The strategy return also depends on when the position was held, size and costs."],
    example:"If a BTC 4-hour dataset jumps from 04:00 to 12:00 UTC, investigate the missing 08:00 candle before treating the two readings as consecutive. A 20-candle window no longer spans the expected time.",
    q:"What should you do when a continuously traded 4-hour dataset unexpectedly skips 08:00?", options:["Backfill it from the source or flag the gap before testing.","Duplicate the previous close and treat it as observed.","Change the timestamp of the 12:00 candle."],correct:0,reason:"Finding the missing observation or flagging the gap preserves the difference between observed and unavailable prices."},
   {id:"backtest-execution",title:"Signals, fills and look-ahead bias",intro:"Design a timeline that uses only the information available at each simulated decision.",
    concepts:["A rule using Tuesday’s closing price becomes known when Tuesday’s candle closes. A next-open model fills at Wednesday’s open. Keep separate records for the signal time, fill time, fill price and order side.",
    "Charge fees per side and define how slippage enters each fill. Model the final open position consistently, for example by marking it to market at the end. Label the assumption beside your results.",
    "Look-ahead bias also appears in data preparation. A centred rolling average includes future observations and a scaler fitted on a whole period can leak information across a chronological split."],
    example:"The fast average crosses the slow average when BTC closes at 100. The next candle opens at 103. Under next-open execution the strategy enters at 103 before fees.",
    q:"A crossover is confirmed at Monday’s close. What price should a next-open simulator use for the entry?",options:["Monday’s closing price","Tuesday’s opening price","Tuesday’s closing price"],correct:1,reason:"The signal becomes available at Monday’s close. The next eligible fill is Tuesday’s open."},
   {id:"backtest-review",title:"Returns, drawdown and out-of-sample tests",intro:"Read the equity curve and design a test that can expose overfitting.",
    concepts:["Net return compares ending equity with starting equity after modelled costs. Drawdown measures the fall from a running peak. An account that peaks at £1,250 and falls to £1,000 has a 20% drawdown from that peak.",
    "Compare with a simple benchmark under similar cost assumptions. Inspect the number of trades and the time spent exposed. A small sample can leave the estimate sensitive to one trade.",
    "Choose parameters on an earlier period, then evaluate on a later untouched period. Repeatedly selecting the best result on that later period turns it into another development set. Use a cost stress test to see how fragile the result is."],
    example:"Try your moving-average settings on the development sample. Write down the chosen windows before you evaluate them on a later dataset.",
    q:"You select the best window pair after comparing 50 pairs on the final test period. What has happened?",options:["The fee assumption was removed.","The benchmark becomes invalid by definition.","The final period has become part of parameter selection."],correct:2,reason:"The window choice used outcomes from the test period, so the resulting estimate needs an untouched evaluation period."}
  ]
 },
 {
  id:"ai", name:"AI engineering", icon:"cpu", color:"lilac", tools:"Python · model APIs · evals",
  description:"Build model-powered applications, organise multi-step workflows and measure output quality.",
  project:{title:"AI prompt evaluation bench",description:"Score two support-ticket classifiers using saved model outputs and labelled examples."},
  lessons:[
   {id:"model-apps",title:"Model calls and structured outputs",intro:"Give a model a clear task, then verify its response before your application uses it.",
    concepts:["Describe the task and its allowed output clearly. For a support ticket, define each label and give one example where labels are easy to confuse. Keep the incoming ticket separate from your application instructions.",
    "Use a JSON schema or equivalent validation for expected fields and types. Also check business constraints, such as whether a label is allowed. A response can have the right shape and still be wrong.",
    "Handle transport failures and malformed output explicitly. Retries need a limit. When a model call triggers a separate action, use an idempotency key or another way to prevent duplicate effects."],
    example:"Accept an output only when it contains an allowed category and a numeric confidence value in range. Save problematic responses for analysis.",
    q:"A response is valid JSON but uses a category outside the allowed list. What should the application do?",options:["Reject or handle it through a defined fallback.","Accept it because JSON parsed correctly.","Add the new category automatically."],correct:0,reason:"Parsing checks syntax. Your application still needs to enforce the allowed category list."},
   {id:"workflows",title:"Retrieval and multi-step workflows",intro:"Decide what your application should retrieve, validate or assign to a separate model call.",
    concepts:["Retrieval-augmented generation (RAG) fetches relevant passages and provides them to a model as context. Keep source identifiers so readers can trace claims. If retrieval finds weak evidence, the app can ask for clarification or return an unknown result.",
    "A manager-and-workers workflow breaks a task into specialist steps. Define what each step should receive and return. Validate the manager’s task assignments before sending work to the helpers.",
    "Compare a multi-step approach with a single-call baseline on the same tasks. Keep track of latency, number of model calls and failure modes as well as answer quality."],
    example:"In your Ollama EPQ setup, give the single-call and manager-plus-helpers versions the same task. Retain each helper response so you can audit what the manager combined.",
    q:"Which setup lets you fairly compare one model call with a multi-step workflow?",options:["Give the multi-step workflow easier tasks.","Use the same task set and grading rubric for both.","Compare by word count alone."],correct:1,reason:"A shared task set and rubric control what the two systems are measured against."},
   {id:"evals",title:"Evaluation datasets and failure analysis",intro:"Turn model quality into something you can measure, compare and debug.",
    concepts:["Define what counts as success before comparing variants. For a classifier, create labelled cases covering common labels and confusing edge cases. Separate development examples from a held-out check.",
    "Accuracy misses important detail when errors have different costs. Review outcomes per category and inspect which labels the model confuses. Include invalid output as a tracked failure.",
    "Store the input, expected result, actual output and version so a regression can be reproduced. Measure latency and cost alongside correctness if they matter to the app."],
    example:"Use labelled tickets about login, billing and security. A security report classified as a routine login problem is worth its own metric.",
    q:"A classifier gets most tickets right but misses several security reports. What should you examine?",options:["Only the response length","The number of prompt characters","Security-category recall and the missed cases"],correct:2,reason:"Recall tells you what fraction of genuine security cases were detected. The misses help identify where the prompt fails."}
  ]
 },
 {
  id:"software", name:"Software development", icon:"code", color:"blue", tools:"Python · Flask · SQL · testing",
  description:"Build full-stack features by connecting browser actions, server logic and relational data.",
  project:{title:"School cover allocation simulator",description:"Choose an absent lesson and inspect which staff pass the timetable and workload checks."},
  lessons:[
   {id:"requests",title:"HTTP and Flask routes",intro:"Follow a browser action through a route, business logic and a response.",
    concepts:["A URL identifies a resource and an HTTP method expresses the action. Use GET for reading and POST for a normal HTML form that submits a creation or change. Validate on the server because clients can send requests directly.",
    "A route should read the request, check permissions and input, call the relevant application logic and build a response. Keep allocation rules testable outside of the route.",
    "Use a status code that reflects the outcome. For example, use 404 when a requested resource is unavailable and 409 for a scheduling conflict that prevents a valid update."],
    example:"The cover coordinator submits a lesson ID and staff ID. The route verifies permission, runs allocation checks and redirects to the updated timetable after success.",
    q:"Where must the rule preventing double-booking be enforced?",options:["On the server when saving the allocation.","In the colour of the timetable slot.","Only in the browser dropdown."],correct:0,reason:"The server controls what can be saved, including requests sent without the normal UI."},
   {id:"databases",title:"Relational data and constraints",intro:"Represent staff, lessons and cover assignments in a database that protects its own consistency.",
    concepts:["A primary key identifies a row and a foreign key links to another row. Store each staff member once and reference their ID from assignments. A join can return both the assignment and the teacher’s current details.",
    "Use constraints where they express real invariants. For one cover assignment per lesson, a unique lesson ID on the assignment table can catch duplicates. For fixed timetable slots, a uniqueness rule on staff and slot can represent a double-booking limit when those fields are stored together.",
    "Choose a transaction when related writes must succeed as a unit. Validate weekly limits and conflicts against current data with suitable database constraints or concurrency controls."],
    example:"If assigning cover and creating a notification are database writes that must agree, commit them together. A failure can then roll back the whole operation.",
    q:"You update a cover assignment and add a notification in the same database. What keeps the two writes together if one fails?",options:["A JOIN","A transaction","A larger text field"],correct:1,reason:"A transaction can commit both writes or roll back the combined change."},
   {id:"testing",title:"Testing business rules and edge cases",intro:"Convert a requirement into observable behaviour and test its boundaries.",
    concepts:["Unit tests exercise a rule in isolation. Integration tests check that pieces such as the route and database work together. A browser test checks the full user action through the interface.",
    "Choose boundary cases that reveal the rule. With a four-hour limit and three assigned hours, a one-hour session reaches the limit exactly. A two-hour session exceeds it.",
    "Check both the response and side effects. A rejected allocation should leave the timetable and notification records consistent. Use deterministic test data so failures can be reproduced."],
    example:"Test an available member of staff, an existing booking in that slot, someone exactly at their cap after assignment, and someone just over.",
    q:"The limit is 4 hours, and a teacher has 3 hours assigned. What pair directly tests the upper boundary?",options:["0-minute and 10-minute covers","Two separate 20-minute covers","A 60-minute cover and a 61-minute cover"],correct:2,reason:"The 60-minute cover reaches the maximum exactly. The 61-minute cover exceeds it."}
  ]
 },
 {
  id:"cyber", name:"Cybersecurity", icon:"shield", color:"peach", tools:"Web security · SOC triage · incident response",
  description:"Investigate suspicious activity and practise securing applications in realistic scenarios.",
  project:{title:"School portal access-control lab",description:"Try requests as a pupil and teacher, then test whether an authorisation fix blocks cross-account access."},
  lessons:[
   {id:"authorisation",title:"Object-level access control",intro:"Check that a signed-in user is explicitly allowed to access the particular record they ask for.",
    concepts:["Authentication establishes identity. Authorisation checks whether that identity can perform an action on a specific object. Access to a page does not automatically grant access to every row it can display.",
    "An insecure direct object reference (IDOR) can occur when someone changes an identifier and accesses a record they should not see. A secure handler scopes the lookup to accessible records or checks policy before using the result.",
    "Use the trusted session identity. Test own-record access, cross-account access, staff scopes and anonymous requests. Changing numeric IDs to random IDs makes guessing harder but still requires an authorisation check."],
    example:"A pupil requests /grades/102. The handler checks whether the session’s pupil owns record 102 before returning it. A teacher gets access only to their assigned class.",
    q:"A pupil can read another pupil’s grade by swapping an ID in the URL. What fixes the underlying flaw?",options:["Check permission for the requested record on the server.","Change the record ID to a longer number.","Hide the link in the dashboard."],correct:0,reason:"The server must check the session user against the particular record on every request."},
   {id:"triage",title:"SOC triage and log correlation",intro:"Turn an alert into a timeline, confirm what happened and identify what still needs evidence.",
    concepts:["Start with the alert’s account, device, time and detection rule. Put events in one time zone and distinguish the activity timestamp from collection time.",
    "Join records using shared attributes such as account ID or host ID. A public IP can be shared by several devices. Treat it as a clue and look for stronger links.",
    "Write observations separately from conclusions in an investigation record. A successful sign-in is an observation. Account compromise is a hypothesis until the details support it."],
    example:"An identity log shows a new sign-in. An endpoint log shows a script launch. Check the account-to-device mapping and event timestamps before claiming the sign-in led to the script.",
    q:"Many users share a public IP. What evidence most directly ties two endpoint events to the same machine?",options:["The same public IP","The same stable endpoint device ID","The same time zone label"],correct:1,reason:"A stable device ID is a stronger host-specific correlate than a shared public IP."},
   {id:"response",title:"Incident containment and recovery",intro:"Choose actions that reduce damage while keeping the organisation able to investigate and recover.",
    concepts:["Containment limits damage or spread. Eradication removes the cause and persistence. Recovery restores service from a trusted state and monitors for recurrence.",
    "Consider the operational impact and evidence needed before acting. Isolating a compromised workstation may block spread while leaving evidence accessible through an approved tool. Turning it off can lose volatile information.",
    "Record the decision, reason, person responsible and time. After recovery, update detections or procedures based on what the investigation confirmed."],
    example:"A workstation starts encrypting shared files. The response team isolates the device, checks what accounts and shares it touched and plans recovery from verified backups.",
    q:"The team disconnects a workstation from the network to stop malware spreading. Which response stage best fits?",options:["Recovery","Eradication","Containment"],correct:2,reason:"Isolation limits immediate spread. Removing the malware and restoring normal service are later tasks."}
  ]
 }
];
