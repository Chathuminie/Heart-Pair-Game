const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');

test('live MongoDB registration, login, score persistence and rankings', { skip: process.env.HEARTPAIR_INTEGRATION !== '1' }, async t => {
  require('dotenv').config({ quiet: true });
  const mongoose = require('mongoose');
  const database = `heartpair_test_${randomUUID().replaceAll('-', '')}`;
  // Override only the database name; never write to the configured application database.
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/heartpairdb', { dbName: database, serverSelectionTimeoutMS: 10000 });
  const { server, io } = require('../backend/server').createServer();
  t.after(async () => {
    await new Promise(resolve => io.close(resolve));
    assert.equal(mongoose.connection.name, database);
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
  await require('../backend/models/User').init();
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  const call = (url, body) => fetch(base + url, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: body ? JSON.stringify(body) : undefined });
  const registered = await call('/api/auth/register', { name: 'Integration Player', email: 'integration@example.com', password: 'integration-password-123' });
  assert.equal(registered.status, 201); cookie = registered.headers.get('set-cookie').split(';')[0];
  const profile = await (await call('/api/auth/me')).json(); assert.equal(profile.name, 'Integration Player'); assert.equal(profile.password, undefined);
  const stored = await require('../backend/models/User').findById(profile._id);
  assert.notEqual(stored.password, 'integration-password-123');
  assert.equal((await call('/api/auth/register', { name: 'Duplicate', email: 'integration@example.com', password: 'integration-password-123' })).status, 400);
  assert.equal((await call('/api/auth/login', { email: 'integration@example.com', password: 'wrong' })).status, 401);
  const loggedIn = await call('/api/auth/login', { email: 'INTEGRATION@example.com', password: 'integration-password-123' });
  assert.equal(loggedIn.status, 200); cookie = loggedIn.headers.get('set-cookie').split(';')[0];
  for (const [score, level] of [[30, 'easy'], [60, 'medium'], [80, 'hard'], [10, 'easy']]) assert.equal((await call('/api/leaderboard', { score, level })).status, 201);
  assert.equal((await (await call('/api/auth/me')).json()).highScore, 80);
  const top = await (await call('/api/leaderboard/top')).json(); assert.deepEqual(top.map(row => row.score), [80, 60, 30, 10]);
  assert.equal((await (await call('/api/leaderboard/myScores')).json()).length, 4);
  assert.equal((await call('/api/auth/logout', {})).status, 200);
});
