let applicationRecords;
let applicationLoad;
let applicationError = "";
let applicationSignInRequired = false;
const applicationWrites = new Set();

function applicationOptions(selected, placeholder) {
 return `${placeholder ? '<option value="" disabled selected>Track this application</option>' : ""}
 ${Object.entries(applicationStatuses).map(([value,label])=>`<option value="${value}" ${selected===value?"selected":""}>${label}</option>`).join("")}`;
}

function opportunityApplicationControl(item) {
 return `<label class="application-control">Application status
  <select data-application-url="${esc(item.url)}" data-title="${esc(item.title)}" data-employer="${esc(item.company)}" aria-label="Application status for ${esc(item.title)} at ${esc(item.company)}" disabled>
   ${applicationOptions("",true)}
  </select>
 </label>`;
}

function applicationList() {
 if (applicationSignInRequired) return '<p>Application tracking isn’t switched on yet. It needs a login and a database, which come next.</p>';
 if (!applicationRecords) return `<p>${esc(applicationError || "Loading your applications…")}</p>`;
 if (!applicationRecords.size) return "<p>Mark a vacancy from Opportunities or add an existing application below.</p>";
 const records = [...applicationRecords.values()].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
 return `<div class="vacancy-grid">
 ${records.map(item=>`<article class="card vacancy-card">
  <div class="vacancy-tags"><span class="tag" data-application-badge>${applicationStatuses[item.status]}</span></div>
  <h3>${esc(item.title)}</h3><p class="vacancy-company">${esc(item.employer)}</p>
  ${item.url ? `<a class="text-link vacancy-link" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">Open advert ${icon("external")}</a>` : ""}
  <label class="application-control">Application status
   <select data-application-id="${esc(item.id)}" aria-label="Application status for ${esc(item.title)} at ${esc(item.employer)}">${applicationOptions(item.status,false)}</select>
  </label>
 </article>`).join("")}</div>`;
}

function applicationsPage() {
 return `${intro("Applications","Keep track of roles you have applied for.","Tracker")}
 <p id="application-notice" class="small-note" role="status"></p>
 <section class="dash-section panel"><h2>Tracked applications</h2><div id="application-list">${applicationList()}</div></section>
 <section class="panel"><h2>Add an application</h2><p>Add a role you applied for outside the academy.</p>
  <form data-form="add-application" class="application-form">
   <label for="application-role">Role<input id="application-role" name="title" maxlength="180" required></label>
   <label for="application-employer">Employer<input id="application-employer" name="employer" maxlength="160" required></label>
   <label for="application-link">Advert link (optional)<input id="application-link" name="url" type="url" maxlength="1000" placeholder="https://"></label>
   <label for="application-status">Status<select id="application-status" name="status">${applicationOptions("applied",false)}</select></label>
   <div class="actions"><button type="submit" class="button dark" ${applicationRecords?"":"disabled"}>Add application ${icon("arrow")}</button></div>
  </form>
 </section>`;
}

function updateApplicationControls() {
 const list = main.querySelector("#application-list");
 if (list) {
  // Preserve focused controls when saving an existing record.
  if (!list.querySelector("[data-application-id]")) list.innerHTML = applicationList();
  main.querySelector('[data-form="add-application"] button').disabled = !applicationRecords || applicationWrites.has("new");
 }
 for (const input of main.querySelectorAll("select[data-application-url],select[data-application-id]")) {
  const id = input.dataset.applicationId || "url:"+applicationUrl(input.dataset.applicationUrl);
  const item = applicationRecords?.get(id);
  input.disabled = !applicationRecords || applicationWrites.has(id);
  input.value = item?.status || "";
  const badge = input.closest(".vacancy-card")?.querySelector("[data-application-badge]");
  if (badge && item) badge.textContent = applicationStatuses[item.status];
 }
}

function showApplicationNotice(message) {
 const notice = main.querySelector("#application-notice");
 if (notice) notice.textContent = message;
}
function loadApplicationRecords() {
 if (applicationRecords || applicationLoad) return;
 if (!main.querySelector("#application-list, #opportunity-results")) return;
 applicationLoad = fetch("/api/applications",{cache:"no-store",signal:AbortSignal.timeout(12000)})
  .then(async response=>{
   applicationSignInRequired = response.status===401;
   if (applicationSignInRequired) throw new Error("Application tracking isn’t switched on yet.");
   if (!response.ok) throw new Error("Application tracking is temporarily unavailable.");
   const {applications} = await response.json();
   applicationRecords = new Map(applications.map(item=>[item.id,item]));
   applicationError = "";
  }).catch(error=>{
   applicationError = error.message || "Application tracking is temporarily unavailable.";
   showApplicationNotice(applicationError);
  }).finally(()=>{
   applicationLoad = null;
   // Hide the per-job status dropdowns while tracking is unavailable.
   document.documentElement.classList.toggle("no-tracker",!applicationRecords);
   updateApplicationControls();
  });
}

async function saveApplication(key, details, form) {
 if (!applicationRecords || applicationWrites.has(key)) return;
 applicationWrites.add(key);
 updateApplicationControls();
 try {
  const response = await fetch("/api/applications",{
   method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(details),signal:AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error("Save failed");
  const {application} = await response.json();
  applicationRecords.set(application.id,application);
  if (form?.isConnected) form.reset();
  if (form) {
   const list = main.querySelector("#application-list");
   if (list) list.innerHTML = applicationList();
  }
  showApplicationNotice(`${application.title} marked as ${applicationStatuses[application.status].toLowerCase()}.`);
 } catch {
  showApplicationNotice("Couldn’t save this application. Please try again.");
 } finally {
  applicationWrites.delete(key);
  updateApplicationControls();
 }
}

function updateApplicationStatus(input) {
 const status = input.value;
 if (!Object.hasOwn(applicationStatuses,status)) return;
 const {applicationId,applicationUrl:url,title,employer} = input.dataset;
 if (applicationId) {
  saveApplication(applicationId,{id:applicationId,status});
  return;
 }
 const normal = applicationUrl(url);
 if (normal) saveApplication("url:"+normal,{url,title,employer,status});
}

function addApplication(target, form) {
 const details = Object.fromEntries(form);
 if (details.url && !applicationUrl(details.url)) {
  showApplicationNotice("Use a valid HTTPS link or leave the advert link blank.");
  return;
 }
 saveApplication("new",details,target);
}
