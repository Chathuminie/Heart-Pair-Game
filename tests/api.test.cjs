const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
process.env.JWT_SECRET = 'test-only-secret-not-used-by-the-running-app';
const { createServer } = require('../backend/server');
const User = require('../backend/models/User');
const Score = require('../backend/models/Score');
const bcrypt = require('bcryptjs');

test('HTTP routes: pages, sessions, validation, score history and API errors', async t => {
  const originals = { create: User.create, findOne: User.findOne, findById: User.findById, updateOne: User.updateOne, save: Score.prototype.save, find: Score.find };
  let storedUser;
  const scores = [];
  User.create = async values => {
    if (storedUser?.email === values.email) { const error = new Error(); error.code = 11000; throw error; }
    storedUser = { ...values, _id: '507f1f77bcf86cd799439011', highScore: 0, password: await bcrypt.hash(values.password, 4) };
    return storedUser;
  };
  User.findOne = async query => storedUser?.email === query.email ? storedUser : null;
  User.findById = () => {
    const promise = Promise.resolve(storedUser);
    promise.select = () => Promise.resolve(storedUser ? { ...storedUser, password: undefined } : null);
    return promise;
  };
  User.updateOne = async (query, update) => { storedUser.highScore = Math.max(storedUser.highScore, update.$max.highScore); };
  Score.prototype.save = async function () { scores.push(this.toObject()); return this; };
  Score.find = () => ({ populate() { return this; }, sort() { return this; }, limit: async () => scores });
  const { server, io } = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    Object.assign(User, { create: originals.create, findOne: originals.findOne, findById: originals.findById, updateOne: originals.updateOne });
    Score.prototype.save = originals.save; Score.find = originals.find;
    server.closeAllConnections(); await new Promise(resolve => io.close(resolve));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  async function call(url, data, authenticated = true) {
    return fetch(base + url, { method: data === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(authenticated && cookie ? { Cookie: cookie } : {}) }, body: data === undefined ? undefined : JSON.stringify(data) });
  }
  for (const page of ['/', '/login.html', '/register.html', '/game.html', '/js/game.js', '/images/heart1.png']) assert.equal((await call(page)).status, 200, page);
  assert.equal((await call('/missing.html')).status, 404);
  const missing = await call('/api/missing'); assert.equal(missing.status, 404); assert.ok((await missing.json()).error);
  assert.equal((await call('/api/health')).status, 200);
  assert.equal((await call('/api/auth/me')).status, 401);
  assert.equal((await call('/api/auth/register', { name: 'A', email: 'invalid', password: 'short' })).status, 400);
  const registered = await call('/api/auth/register', { name: ' Player ', email: ' PLAYER@EXAMPLE.COM ', password: 'password123' });
  assert.equal(registered.status, 201);
  cookie = registered.headers.get('set-cookie').split(';')[0];
  assert.match(registered.headers.get('set-cookie'), /HttpOnly/i);
  assert.equal(storedUser.name, 'Player'); assert.equal(storedUser.email, 'player@example.com');
  const me = await (await call('/api/auth/me')).json(); assert.equal(me.name, 'Player'); assert.equal(me.password, undefined);
  assert.equal((await call('/api/auth/register', { name: 'B', email: 'player@example.com', password: 'password123' })).status, 400);
  assert.equal((await call('/api/auth/login', { email: { $ne: '' }, password: 'password123' })).status, 401);
  assert.equal((await call('/api/auth/login', { email: 'player@example.com', password: 'wrong' })).status, 401);
  assert.equal((await call('/api/auth/login', { email: 'PLAYER@example.com', password: 'password123' })).status, 200);
  assert.equal((await call('/api/leaderboard', { score: 10, level: 'easy' }, false)).status, 401);
  for (const values of [{ score: -1, level: 'easy' }, { score: 40, level: 'easy' }, { score: 10, level: 'invalid' }, { score: 11, level: 'hard' }]) assert.equal((await call('/api/leaderboard', values)).status, 400);
  assert.equal((await call('/api/leaderboard', { score: 30, level: 'easy' })).status, 201);
  assert.equal((await call('/api/leaderboard', { score: 10, level: 'easy' })).status, 201);
  assert.equal(storedUser.highScore, 30);
  // Exercise the real Socket.IO transport and authenticated score path.
  async function socketRoundTrip(token, score) {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(base.replace('http:', 'ws:') + '/socket.io/?EIO=4&transport=websocket');
      const deadline = setTimeout(() => { socket.close(); reject(new Error('Socket timeout')); }, 3000);
      function done(value) { clearTimeout(deadline); socket.close(); resolve(value); }
      socket.addEventListener('error', () => { clearTimeout(deadline); reject(new Error('WebSocket connection failed')); });
      socket.addEventListener('message', event => {
        const message = String(event.data);
        if (message.startsWith('0{')) socket.send('40' + JSON.stringify(token ? { token } : {}));
        else if (message.startsWith('44')) done(JSON.parse(message.slice(2)));
        else if (message.startsWith('40')) socket.send('42' + JSON.stringify(['scoreUpdate', score]));
        else if (message.startsWith('42')) done(JSON.parse(message.slice(2)));
        else if (message === '2') socket.send('3');
      });
    });
  }
  assert.equal((await socketRoundTrip(null, {})).message, 'Unauthorized');
  const token = require('../backend/utils/jwt').sign({ id: storedUser._id });
  const invalidSocketScore = await socketRoundTrip(token, { score: 1000, level: 'easy' });
  assert.equal(invalidSocketScore[0], 'scoreError');
  const socketScore = await socketRoundTrip(token, { score: 60, level: 'medium' });
  assert.equal(socketScore[0], 'leaderboardUpdate'); assert.equal(socketScore[1].userId, storedUser._id);
  assert.equal(storedUser.highScore, 60);
  assert.equal((await (await call('/api/leaderboard/top')).json()).length, 3);
  assert.equal((await (await call('/api/leaderboard/myScores')).json()).length, 3);
  const puzzle = await (await call('/api/heart')).json();
  const values = puzzle.prompt.match(/heart \+ (\d+) = (\d+)/); assert.ok(values); assert.equal(puzzle.solution + Number(values[1]), Number(values[2]));
  const blocked = await fetch(base + '/api/health', { headers: { Origin: 'https://untrusted.example' } }); assert.equal(blocked.status, 403);
  const malformed = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' }); assert.equal(malformed.status, 400);
  const loggedOut = await call('/api/auth/logout', {}); assert.equal(loggedOut.status, 200); assert.match(loggedOut.headers.get('set-cookie'), /Expires=/);
  assert.equal((await call('/api/auth/logout', {}, false)).status, 200);
});

test('all mongoose models load and JWT requires an explicit secret', () => {
  for (const model of ['Heart', 'Quote', 'Leaderboard', 'Score', 'User']) assert.ok(require(`../backend/models/${model}`));
  const jwt = require('../backend/utils/jwt');
  const token = jwt.sign({ id: 'player' }); assert.equal(jwt.verify(token).id, 'player');
  const original = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET; assert.throws(() => jwt.sign({ id: 'player' }), /JWT_SECRET/);
  process.env.JWT_SECRET = original;
});
