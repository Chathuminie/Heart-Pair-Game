# HeartPair development guide

HeartPair uses two directories: `backend/` contains the Node.js API and
`frontend/` contains static HTML, CSS and browser JavaScript. Express serves
both from one origin. Run commands from the repository root.

## Setup

1. Install Node.js 22 or newer and provide a MongoDB instance.
2. Run `npm ci` from the root. npm workspaces install the backend dependencies.
3. Copy `.env.example` to `.env`. Set `MONGO_URI` and replace `JWT_SECRET`
   with a strong random secret. Keep `.env` out of Git.
4. Run `npm run dev` or `npm start`.
5. Open `http://localhost:5000`. Avoid opening the HTML files directly or
   serving them separately with Live Server: the browser uses relative API URLs.

`backend/package.json` declares runtime dependencies. The root package manages
workspace installation, checks and test dependencies. The root lockfile is the
single install lockfile. Running `npm start` from `backend/` is also supported;
the server always loads the root `.env`.

## File structure

- `backend/app.js`: HTTP middleware, routes, static pages and errors; can be
  imported for tests without connecting to a database.
- `backend/server.js`: environment loading, database startup and Socket.IO.
- `backend/config/db.js`: MongoDB connection. `MONGO_URI` is preferred;
  `MONGODB_URI` remains supported for older configurations.
- `backend/controllers/`: authentication, puzzles, quotes and rankings.
- `backend/services/authService.js`: registration, password checks and profile.
- `backend/middleware/auth.js`: verifies the HTTP-only session cookie.
- `backend/models/`: Mongoose schemas. User and Score are active persistence
  models; Heart, Quote and Leaderboard are retained for future stored content.
- `backend/utils/`: JWT signatures and external HTTP requests.
- `frontend/index.html`: welcome page.
- `frontend/login.html`, `register.html`: accessible forms using `auth-form.js`.
- `frontend/game.html`: levels, game, account history and leaderboard.
- `frontend/js/api.js`: JSON requests and HTTP error handling.
- `frontend/js/auth.js`: session API helpers.
- `frontend/js/game.js`: round state, cards, timer, puzzles and score UI.
- `frontend/css/`, `frontend/images/`: shared and gameplay styling and assets.
- `scripts/check.cjs`: JavaScript syntax and local HTML asset checks.
- `tests/`: HTTP tests with mocked database operations and frontend DOM tests.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account and session |
| POST | `/api/auth/login` | Create session |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current account; requires session |
| GET | `/api/heart` | Solvable local arithmetic puzzle |
| GET | `/api/heart/external` | External heart puzzle proxy |
| GET | `/api/quote` | External motivational quote |
| POST | `/api/leaderboard` | Save score; requires session |
| GET | `/api/leaderboard/top` | Top ten scores |
| GET | `/api/leaderboard/myScores` | Current user's best ten scores |
| GET | `/api/health` | HTTP status and database connection state |

Socket.IO supports authenticated `scoreUpdate` and broadcasts
`leaderboardUpdate`. Authentication accepts the same session cookie or a JWT
in the handshake. HTTP and socket score submissions share validation.

## Validation

Run `npm run check` and `npm test`. HTTP tests use mocked Mongoose operations
and never modify the configured database. Frontend tests run in jsdom; they
cover forms, guests, matching, timeouts, restarts, safe text rendering and
navigation cleanup. They do not replace a visual browser check or a live
MongoDB integration test.

To run the opt-in live database test, set `HEARTPAIR_INTEGRATION=1` and run
`npm test` (PowerShell: `$env:HEARTPAIR_INTEGRATION='1'; npm test`). This creates
an isolated randomly named test database on the configured MongoDB server,
checks password hashing, sessions and persisted scores, and removes only that
test database afterward. The account must be allowed to create/drop a test
database. Unset the variable afterward for the regular mocked test suite.

Manual integration check: start with MongoDB, register, log out, log in, play
each level, save a score, check leaderboard/account history, restart, navigate
away mid-round, and try the extra-life puzzle. Repeat on a narrow screen.

## Deployment

Install with `npm ci --omit=dev`, set `NODE_ENV=production`, `MONGO_URI`,
`JWT_SECRET`, `PORT`, and `CLIENT_URL` to the public origin, then run `npm start`.
Use HTTPS so production secure cookies work. The server connects to MongoDB
before listening. Missing secrets or database connection errors fail startup.
External quotes have a browser fallback; external puzzles fall back to local
arithmetic. Score values are range-checked, but scoring is still computed in
the browser; competitive anti-cheat requires server-managed rounds.

## Git workflow

See `COMMIT_TRACKER.md`. Stage specific files by feature, review the staged
diff and commit. Publishing to GitHub and hosting the application are separate
steps. Nothing is pushed automatically.
