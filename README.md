# Tech Skills Academy

A personal learning site. Pick a subject (CompTIA Security+ or a career track), read short lessons, answer a quick quiz.
Progress is saved in the browser. Jobs (live apprenticeships) and Applications are small extras.

To add lessons, edit `dist/content-security.js` (Security+) or `dist/content-careers.js` (career tracks).

## Run the frontend locally

```sh
python -m http.server 8000 --directory dist
```

Visit http://localhost:8000. Live apprenticeship results need the Worker and its key (below).

## Files

| Path | Contents |
| --- | --- |
| `dist/index.html`, `dist/style.css`, `dist/app.js` | Page shell, design, lessons and quiz screens, progress |
| `dist/content-security.js`, `dist/content-careers.js`, `dist/content-reverse.js` | The lessons and quiz questions |
| `dist/opportunities.js` | Jobs page and live apprenticeships |
| `dist/applications.js`, `dist/application-model.js` | Applications tracker (needs login + database) |
| `worker/`, `drizzle/` | Server APIs and the database migration |
| `wrangler.toml` | Cloudflare Worker config |

## Build and test (Node.js 22 or newer)

```sh
node tests/smoke.cjs
node scripts/build-worker.mjs
node tests/applications.mjs
node tests/apprenticeships.mjs
```

The build writes `dist/server/index.js`. Add the secret `APPRENTICESHIPS_API_KEY` in Cloudflare for live results.
The applications API still expects the ChatGPT Sites user header, so it returns 401 until a login is added.
