import {mkdir,readFile,readdir,writeFile} from "node:fs/promises";
import {extname} from "node:path";

const root = new URL("../",import.meta.url);
const dist = new URL("dist/",root);
const mimeTypes = {".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml"};
const assets = {};
for (const file of await readdir(dist)) {
 const mime = mimeTypes[extname(file)];
 if (mime) assets["/"+file] = [mime+"; charset=utf-8",await readFile(new URL(file,dist),"utf8")];
}
if (!assets["/index.html"]) throw new Error("Academy index.html is missing");
const source = (await Promise.all(["dist/application-model.js","worker/applications.mjs","worker/index.mjs"]
 .map(path=>readFile(new URL(path,root),"utf8")))).join("\n");
await mkdir(new URL("server/",dist),{recursive:true});
await writeFile(new URL("server/index.js",dist),
 `const academyAssets = ${JSON.stringify(assets)};\nacademyAssets["/"] = academyAssets["/index.html"];\n${source}`);
