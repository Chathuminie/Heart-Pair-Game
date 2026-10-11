# HeartPair commit tracker

The existing project is imported on `main` in the order below. Each row is a
separate local commit. No push is included in this import.

| Order | Commit message | Scope |
| --- | --- | --- |
| 1 | chore: add project setup and safe environment template | Package manifests and lockfiles, ignore rules, database configuration, environment template |
| 2 | feat(auth): add registration login and session APIs | User model, authentication service/controller/routes, middleware, JWT helper |
| 3 | feat(game): add heart challenges and quote APIs | Heart and quote models, controllers, routes, HTTP fetch helper, heart images |
| 4 | feat(leaderboard): add score history and rankings | Score and leaderboard models, leaderboard controller and routes |
| 5 | feat(ui): add landing and authentication screens | Landing, login and registration HTML, shared styles, authentication JavaScript, branding assets |
| 6 | feat(ui): add game screen and gameplay interactions | Game HTML, styles, JavaScript, difficulty images |
| 7 | feat(server): wire APIs static pages and realtime events | Express server and Socket.IO integration |
| 8 | docs: add development guide and commit tracker | Existing development guide and this tracker |

Use `git log --oneline --reverse` to find the hash for each row, and
`git show --stat <hash>` to review its files.

These commits capture the existing implementation; earlier import commits may
depend on files introduced by later commits. Runtime deployment validation is
separate from this history import.

For future changes, stage named files for one feature, review
`git diff --cached`, and commit before moving to the next feature.

To publish only through a chosen commit, use
`git push origin <commit-hash>:main`. A later push to a descendant includes
the intervening commits. `git push origin main` publishes every local commit
on the branch that the remote does not already contain.

## Project review and fixes

The follow-up review is recorded in separate local commits:

| Order | Commit message | Scope |
| --- | --- | --- |
| 9 | chore: unify workspace dependencies and project checks | Root workspace, complete backend dependencies, single lockfile, syntax and asset checker |
| 10 | fix(backend): repair sessions scores puzzles and server startup | Testable HTTP app, explicit environment loading, database startup, models, auth validation, score validation, Socket.IO authentication and user identity |
| 11 | fix(frontend): repair forms gameplay lifecycle and responsive layouts | Shared request helpers, native forms, timer/round cleanup, safe profile and ranking rendering, puzzle fallback, account score history, shared/game CSS separation |
| 12 | test: cover HTTP sockets frontend and MongoDB integration | Route/session/score checks, real WebSocket transport, frontend DOM regressions and opt-in isolated MongoDB test |
| 13 | docs: refresh setup structure testing and deployment guide | README, development guide and this tracker |

Validation completed: seven tests passed with the live MongoDB integration
enabled; JavaScript syntax and local HTML assets passed; configured MongoDB
read-only ping and live HTTP health passed. The database integration used a
random test database and removed it afterward. Existing application records
were untouched. Frontend interaction tests use jsdom; visual browser review
remains a separate check. No push is included.
