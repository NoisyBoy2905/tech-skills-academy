# Tech Skills Academy

A CompTIA Security+ trainer. Read a short lesson once, then keep it with spaced repetition: missed questions come back
the same day, right answers come back after 1, 3, 7, 14 and 30 days. Progress is saved in the browser.
Jobs (live apprenticeships) and Applications are small extras in the footer.

To add lessons or questions, edit `dist/content-security.js`. The career-track and reverse-engineering lessons were
removed from the site but are in git history (commit 41dd7bf).

## Run the frontend locally

```sh
python -m http.server 8000 --directory dist
```

Visit http://localhost:8000. Live apprenticeship results need the Worker and its key (below).

## Files

| Path | Contents |
| --- | --- |
| `dist/index.html`, `dist/style.css`, `dist/app.js` | Page shell, design, lessons, daily review and progress |
| `dist/content-security.js` | The Security+ lessons and quiz questions |
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
