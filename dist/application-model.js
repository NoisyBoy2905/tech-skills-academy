const applicationStatuses = {applied:"Applied",assessment:"Assessment",complete:"Complete"};

function applicationUrl(input) {
 if (typeof input !== "string" || input.length > 1000) return null;
 try {
  const url = new URL(input.trim());
  if (url.protocol !== "https:" || url.username || url.password) return null;
  if (url.origin === "https://www.findapprenticeship.service.gov.uk") {
   const reference = url.pathname.match(/^\/apprenticeship\/(?:reference\/)?(?:VAC)?([0-9]+)\/?$/i);
   if (reference) return url.origin+"/apprenticeship/VAC"+reference[1];
  }
  return url.href;
 } catch {
  return null;
 }
}
