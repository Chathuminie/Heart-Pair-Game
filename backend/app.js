const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('node:path');
const mongoose = require('mongoose');
function createApp() {
  const app = express();
  const allowedOrigins = ['http://localhost:5000', 'http://127.0.0.1:5000'];
  if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);
  app.locals.allowedOrigins = allowedOrigins;
  app.disable('x-powered-by');
  if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
  app.use(cors({ origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    const error = new Error('Origin is not allowed'); error.status = 403; callback(error);
  }, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.get('/api/health', (req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
  for (const route of ['auth', 'heart', 'quote', 'leaderboard']) app.use(`/api/${route}`, require(`./routes/${route}Routes`));
  app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found' }));
  app.use(express.static(path.join(__dirname, '..', 'frontend')));
  app.use((req, res) => res.status(404).send('Page not found'));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    res.status(error.status || 500).json({ error: error.status ? error.message : 'Internal server error' });
  });
  return app;
}
module.exports = { createApp };
