async function applicationsResponse(request, env) {
 const json = (data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
 const userId = request.headers.get("oai-authenticated-user-id");
 if (!userId) return json({error:"sign_in_required"},401);
 if (!["GET","PUT"].includes(request.method)) return new Response(null,{status:405,headers:{Allow:"GET, PUT"}});
 if (!env.DB) return json({error:"tracking_unavailable"},503);
 const columns = "id, title, employer, url, status, updated_at AS updatedAt";

 try {
  if (request.method==="GET") {
   const {results} = await env.DB.prepare(
    `SELECT ${columns} FROM applications WHERE user_id = ? ORDER BY updated_at DESC, id`
   ).bind(userId).all();
   return json({applications:results});
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({error:"origin_mismatch"},403);
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
   return json({error:"json_required"},415);
  }
  const raw = await request.text();
  if (raw.length>4096) return json({error:"application_too_large"},413);
  let body;
  try { body = JSON.parse(raw); }
  catch { return json({error:"invalid_json"},400); }
  if (!body || typeof body.status!=="string" || !Object.hasOwn(applicationStatuses,body.status)) {
   return json({error:"invalid_status"},400);
  }
  const updatedAt = new Date().toISOString();
  if (body.id !== undefined) {
   if (typeof body.id !== "string" || body.id.length>1050) return json({error:"invalid_id"},400);
   const application = await env.DB.prepare(
    `UPDATE applications SET status = ?, updated_at = ? WHERE user_id = ? AND id = ? RETURNING ${columns}`
   ).bind(body.status,updatedAt,userId,body.id).first();
   return application ? json({application}) : json({error:"not_found"},404);
  }

  const title = typeof body.title==="string" ? body.title.trim() : "";
  const employer = typeof body.employer==="string" ? body.employer.trim() : "";
  const url = body.url ? applicationUrl(body.url) : null;
  if (!title || title.length>180 || !employer || employer.length>160 || (body.url && !url)) {
   return json({error:"invalid_application"},400);
  }
  const id = url ? "url:"+url : "manual:"+crypto.randomUUID();
  const application = await env.DB.prepare(
   `INSERT INTO applications (user_id,id,title,employer,url,status,updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id,id) DO UPDATE SET status=excluded.status, updated_at=excluded.updated_at
    RETURNING ${columns}`
  ).bind(userId,id,title,employer,url,body.status,updatedAt).first();
  return json({application});
 } catch {
  return json({error:"tracking_unavailable"},503);
 }
}
