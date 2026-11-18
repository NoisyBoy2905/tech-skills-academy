# Tech Skills Academy

## Run the frontend locally

Extract the ZIP, open a terminal in the extracted project folder, and run:

```sh
python -m http.server 8000 --directory dist
```

Visit http://localhost:8000. The lessons, quizzes, labs and browser-local progress work in this preview. Live apprenticeship results and the signed-in applications tracker need the Worker and its hosting configuration.

## Where to make changes

| Path | Contents |
| --- | --- |
| `dist/index.html`, `dist/style.css`, `dist/app.js` | HTML, styling, navigation and main screens |
| `dist/careers.js`, `dist/career-ui.js` | Career track content and pages |
| `dist/study-ui.js`, `dist/course.js` | Certification catalogue and CompTIA Security+ content |
| `dist/challenges.js`, `dist/projects.js`, `dist/state.js` | Exercises, project logic and progress |
| `dist/opportunities.js`, `dist/applications.js` | Job search and application tracking interface |
| `worker/`, `drizzle/` | Server APIs and the database migration |

## Build and test

Use Node.js 24 or newer. No npm dependencies are required.

```sh
node tests/smoke.cjs
node scripts/build-worker.mjs
node tests/applications.mjs
node tests/apprenticeships.mjs
```

The build writes `dist/server/index.js`. The hosted Worker uses a D1 database bound as `DB`, the migration at `drizzle/0000_applications.sql`, and a server-side secret called `APPRENTICESHIPS_API_KEY`. The applications API relies on the authenticated user ID supplied by the ChatGPT Sites gateway. To use another host, adapt the authentication integration to use a trusted server identity before enabling the applications API. The archive includes the original Sites project manifest for reference. Use your own project configuration for a new deployment.
