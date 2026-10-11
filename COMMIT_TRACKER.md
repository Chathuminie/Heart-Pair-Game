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
