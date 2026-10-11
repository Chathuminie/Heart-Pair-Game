const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
const http = require('node:http');
const { Server } = require('socket.io');
const { createApp } = require('./app');
const connectDB = require('./config/db');
const { verify } = require('./utils/jwt');
const cookie = require('cookie');
function createServer() {
  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: app.locals.allowedOrigins, credentials: true } });
  io.use((socket, next) => {
    try { socket.userId = verify(socket.handshake.auth?.token || cookie.parse(socket.handshake.headers.cookie || '').jwt).id; next(); }
    catch { next(new Error('Unauthorized')); }
  });
  io.on('connection', socket => socket.on('scoreUpdate', async (data, acknowledge) => {
    const response = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(body) {
        if (this.statusCode < 400) io.emit('leaderboardUpdate', body);
        else socket.emit('scoreError', body);
        if (typeof acknowledge === 'function') acknowledge({ status: this.statusCode, ...body });
        return body;
      }
    };
    await require('./controllers/leaderboardController').saveScore({ body: data, userId: socket.userId }, response);
  }));
  return { app, server, io };
}
async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'replace-with-your-own-random-secret') throw new Error('Set JWT_SECRET in the root .env before starting');
  await connectDB();
  const { server } = createServer();
  const port = process.env.PORT || 5000;
  server.listen(port, () => console.log(`HeartPair: http://localhost:${port}`));
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  return server;
}
if (require.main === module) start().catch(error => { console.error(`Startup failed: ${error.message}`); process.exit(1); });
module.exports = { createServer, start };
