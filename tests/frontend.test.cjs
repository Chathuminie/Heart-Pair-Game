const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const flush = () => new Promise(resolve => setImmediate(resolve));

async function gameFixture(user, puzzle = null) {
  const dom = new JSDOM(fs.readFileSync('frontend/game.html', 'utf8'), { url: 'http://localhost:5000/game.html' });
  const timeouts = new Map(), intervals = new Map(), posts = [];
  let id = 0;
  const request = async url => url === '/api/quote' ? { quote: 'Keep going', author: 'Test' } : url.startsWith('/api/heart') ? puzzle : [];
  const source = fs.readFileSync('frontend/js/game.js', 'utf8').replace(/^\s*import[^\r\n]*;\r?$/gm, '');
  await new AsyncFunction('window', 'document', 'getMe', 'logout', 'request', 'post', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'confirm', 'alert', source)(
    dom.window, dom.window.document, async () => user, async () => {}, request, async (url, data) => { posts.push({ url, data }); },
    (fn, delay) => { timeouts.set(++id, { fn, delay }); return id; }, key => timeouts.delete(key),
    fn => { intervals.set(++id, fn); return id; }, key => intervals.delete(key), () => Boolean(puzzle), () => {}
  );
  return { dom, document: dom.window.document, timeouts, intervals, posts,
    async run(delay) { const jobs = [...timeouts].filter(([, task]) => task.delay === delay); for (const [key, task] of jobs) { timeouts.delete(key); task.fn(); } await flush(); }
  };
}

test('game starts once, stops pending callbacks on navigation, renders names safely and records one win', async t => {
  const fixture = await gameFixture({ _id: 'player', name: '<img src=x onerror=alert(1)>', highScore: 0 });
  t.after(() => fixture.dom.window.close());
  const { document, intervals, posts } = fixture;
  assert.equal(document.querySelector('#account-info img'), null);
  document.querySelector('.play-btn').click();
  assert.equal(document.querySelectorAll('.card').length, 6); assert.equal(intervals.size, 1);
  document.querySelectorAll('.card')[0].click(); document.querySelectorAll('.card')[1].click();
  document.querySelector('[data-section="how"]').click();
  assert.equal(intervals.size, 0); assert.equal(fixture.timeouts.size, 0);
  document.querySelector('[data-section="level-select"]').click(); document.querySelector('.play-btn').click();
  const pairs = new Map();
  for (const card of document.querySelectorAll('.card')) { const cards = pairs.get(card.dataset.heart) || []; cards.push(card); pairs.set(card.dataset.heart, cards); }
  for (const cards of pairs.values()) { cards[0].click(); cards[1].click(); await fixture.run(700); }
  await flush();
  assert.equal(posts.length, 1); assert.equal(posts[0].data.score, 30); assert.equal(intervals.size, 0);
  assert.equal(document.getElementById('result-message').classList.contains('hidden'), false);
  document.querySelector('#result-message button').click(); assert.equal(intervals.size, 1); assert.equal(document.getElementById('score').textContent, 'Score: 0');
});

test('guest sees login prompt and timeout ends a round once', async t => {
  const guest = await gameFixture(null); t.after(() => guest.dom.window.close());
  guest.document.querySelector('.play-btn').click();
  assert.equal(guest.document.getElementById('login-prompt-modal').style.display, 'block'); assert.equal(guest.intervals.size, 0);
  const player = await gameFixture({ _id: 'player', name: 'Player' }); t.after(() => player.dom.window.close());
  player.document.querySelector('.play-btn').click();
  const tick = [...player.intervals.values()][0]; for (let i = 0; i < 30; i++) tick();
  assert.equal(player.intervals.size, 0); assert.match(player.document.getElementById('message-text').textContent, /Game Over/);
  player.document.querySelector('.card').click(); assert.equal(player.document.querySelectorAll('.flipped').length, 0);
});

test('authentication form submits once, trims email and exposes network errors', async t => {
  const dom = new JSDOM(fs.readFileSync('frontend/login.html', 'utf8')); t.after(() => dom.window.close());
  const document = dom.window.document;
  let calls = 0;
  const source = fs.readFileSync('frontend/js/auth-form.js', 'utf8').replace(/^import .*;\r?$/gm, '');
  await new AsyncFunction('document', 'login', 'register', 'location', source)(document, async email => { calls++; assert.equal(email, 'player@example.com'); throw new Error('Connection failed'); }, async () => {}, {});
  document.getElementById('email').value = 'player@example.com'; document.getElementById('password').value = 'password123';
  document.querySelector('form').dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
  await flush(); assert.equal(calls, 1); assert.equal(document.getElementById('error').hidden, false); assert.match(document.getElementById('error').textContent, /Connection failed/); assert.equal(document.querySelector('button').disabled, false);
});

test('extra-life puzzle pauses time, rejects empty answers and resumes after the correct answer', async t => {
  const fixture = await gameFixture({ _id: 'player', name: 'Player' }, { prompt: 'heart + 3 = 5', solution: 2 });
  t.after(() => fixture.dom.window.close());
  const { document } = fixture;
  document.querySelector('.play-btn').click();
  const cards = [...document.querySelectorAll('.card')];
  const first = cards[0], second = cards.find(card => card.dataset.heart !== first.dataset.heart);
  for (let i = 0; i < 5; i++) { first.click(); second.click(); await fixture.run(700); await fixture.run(600); }
  await flush();
  assert.equal(document.getElementById('extra-life-modal').style.display, 'block');
  assert.match(document.getElementById('life-prompt').textContent, /heart \+ 3 = 5/);
  const time = document.getElementById('timer').textContent;
  [...fixture.intervals.values()][0](); assert.equal(document.getElementById('timer').textContent, time);
  fixture.dom.window.checkExtraLife(); assert.equal(document.getElementById('extra-life-modal').style.display, 'block');
  document.getElementById('life-answer').value = '2'; fixture.dom.window.checkExtraLife();
  assert.equal(document.getElementById('lives').textContent, 'Lives: 2');
  assert.equal(document.getElementById('extra-life-modal').style.display, 'none');
  [...fixture.intervals.values()][0](); assert.notEqual(document.getElementById('timer').textContent, time);
  fixture.dom.window.cancelPuzzleModal(); assert.equal(fixture.intervals.size, 0);
});
