// Basic checks for the bare-bones site: every file index.html points to exists,
// every script parses, and the filter data the pages rely on is consistent.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const dist = path.join(__dirname, "..", "dist");
const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const assert = (ok, message) => { if (!ok) { console.error("FAIL:", message); process.exit(1); } };

const refs = [...html.matchAll(/(?:src|href)="([^"#:]+\.(?:js|css|svg))"/g)].map(m => m[1]);
assert(refs.length >= 6, "index.html should reference its scripts and styles");
for (const ref of refs) assert(fs.existsSync(path.join(dist, ref)), "missing file: " + ref);

const scripts = refs.filter(ref => ref.endsWith(".js"));
for (const file of scripts) new vm.Script(fs.readFileSync(path.join(dist, file), "utf8"), {filename: file});

// Load the job-search code with a tiny fake page and check the filtering rules.
const code = scripts.filter(f => f !== "app.js").map(f => fs.readFileSync(path.join(dist, f), "utf8")).join("\n") +
 "\n;({matchingOpportunities, opportunitySearch, opportunities, applicationUrl})";
const api = vm.runInNewContext(code, {main: {}, esc: String, icon: () => "", part: "", document: {}, fetch: () => {}});
for (const item of api.opportunities) {
 assert(api.opportunitySearch.all && item.tracks.every(t => api.opportunitySearch[t]), "unknown track on " + item.title);
 assert(/^https:\/\//.test(item.url), "vacancy needs an https link: " + item.title);
}
assert(api.matchingOpportunities("all", "all", "local", "2000-01-01").length === api.opportunities.length, "all vacancies should match an early date");
assert(api.matchingOpportunities("all", "all", "local", "2999-01-01").length === 0, "closed vacancies should be hidden");
assert(api.applicationUrl("http://example.com") === null, "non-https links must be rejected");
console.log("Smoke checks passed:", refs.length, "files,", api.opportunities.length, "selected vacancies.");
