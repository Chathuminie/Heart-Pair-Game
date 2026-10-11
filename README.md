# HeartPair

A heart card matching game with three difficulty levels, account sessions,
leaderboards, score history, motivational quotes and extra-life puzzles.

## Run locally

Use Node.js 22+ and MongoDB. From the repository root:

```sh
npm ci
```

Copy `.env.example` to `.env`, set `MONGO_URI` and your own `JWT_SECRET`, then:

```sh
npm start
```

Open `http://localhost:5000`. The backend serves the frontend and API together.

```sh
npm run check
npm test
```

See [the development guide](DEVELOPMENT_GUIDE.md) for structure, API routes,
test coverage and deployment, and [the commit tracker](COMMIT_TRACKER.md) for
feature commits and gradual publishing.
