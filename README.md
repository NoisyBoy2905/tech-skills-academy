# Tech Skills Academy

A small personal site: live Level 5+ apprenticeship search near Dartford, selected jobs, and an applications tracker.
The old lessons were removed and saved as a file (also in the first git commit) so they can be added back one at a time.

## Run the frontend locally

```sh
python -m http.server 8000 --directory dist
```

Visit http://localhost:8000. Live apprenticeship results need the Worker and its key (below).

## Files

| Path | Contents |
| --- | --- |
| `dist/index.html`, `dist/style.css`, `dist/app.js` | Page shell, design, navigation |
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
