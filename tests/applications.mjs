import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {default as worker} from "../dist/server/index.js";

const sqlite = new DatabaseSync(":memory:");
sqlite.exec(readFileSync(new URL("../drizzle/0000_applications.sql",import.meta.url),"utf8"));
const DB = {prepare(sql){
 return {bind(...args){
  const statement = sqlite.prepare(sql);
  return {
   async first(){ return statement.get(...args) ?? null; },
   async all(){ return {results:statement.all(...args)}; }
  };
 }};
}};
const endpoint = "https://academy.example/api/applications";
function call(user,body,overrides = {}) {
 const headers = new Headers(overrides.headers);
 if (user) headers.set("oai-authenticated-user-id",user);
 if (body) headers.set("content-type","application/json");
 return worker.fetch(new Request(endpoint,{
  method:body ? "PUT":"GET",body:body ? JSON.stringify(body):undefined,headers
 }),{DB});
}
assert.equal((await call(null)).status,401);
assert.equal((await call("alice",{title:"role",employer:"employer",status:"complete"},{headers:{Origin:"https://third-party.example"}})).status,403);
const record = {title:"Data science apprentice",employer:"Example employer",url:"https://www.findapprenticeship.service.gov.uk/apprenticeship/reference/20001",status:"applied"};
const created = await call("alice",record);
assert.equal(created.status,200);
assert.equal(created.headers.get("cache-control"),"private, no-store");
const {application} = await created.json();
assert.equal(application.url,"https://www.findapprenticeship.service.gov.uk/apprenticeship/VAC20001");
assert.equal(application.status,"applied");
assert.equal((await call("bob",{id:application.id,status:"complete"})).status,404);
assert.deepEqual(await (await call("bob")).json(),{applications:[]});
await call("bob",{...record,status:"assessment"});
await call("alice",{...record,url:application.url,status:"complete"});
const alice = (await (await call("alice")).json()).applications;
const bob = (await (await call("bob")).json()).applications;
assert.equal(alice.length,1);
assert.equal(alice[0].status,"complete");
assert.equal(bob[0].status,"assessment");
assert.equal((await call("alice",{title:"An older application",employer:"Example employer",status:"complete"})).status,200);
assert.equal((await (await call("alice")).json()).applications.length,2);
assert.equal((await call("alice",{...record,status:"other"})).status,400);
assert.equal((await call("alice",{...record,url:"javascript:alert(1)"})).status,400);
assert.equal((await call("alice",{...record,userId:"bob",status:"assessment"})).status,200);
assert.equal((await (await call("bob")).json()).applications.length,1);
console.log("Application tracking validated with real SQLite queries, including status updates, private caching, duplicate advert IDs, manual entries and separation between two accounts.");
