import { getMe, logout } from './auth.js';
import { request, post } from './api.js';
const levels = { easy: { time: 30, pairs: 3 }, medium: { time: 60, pairs: 6 }, hard: { time: 90, pairs: 8 } };
const $ = id => document.getElementById(id);
let user, level = 'easy', score = 0, lives = 5, time = 0, pairs = 0;
let selected = [], locked = true, active = false, paused = false, solution = null;
let timer, round = 0;
const pending = new Set();
function later(callback, delay) {
  const version = round;
  const id = setTimeout(() => { pending.delete(id); if (version === round) callback(); }, delay);
  pending.add(id);
}
function clearRound() {
  round++;
  clearInterval(timer);
  for (const id of pending) clearTimeout(id);
  pending.clear();
  active = false; paused = false; locked = true; selected = [];
  hidePuzzle();
  $('result-message').classList.add('hidden');
  $('quote-popup').classList.add('hidden');
}
function update() {
  $('score').textContent = `Score: ${score}`;
  $('lives').textContent = `Lives: ${lives}`;
  $('timer').textContent = `Time: ${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
}
function account() {
  const box = $('account-info');
  box.replaceChildren();
  if (user) {
    const name = document.createElement('strong'); name.textContent = user.name;
    box.append(name, document.createElement('br'), `High Score: ${user.highScore || 0}`);
  } else {
    const link = document.createElement('a'); link.href = 'login.html'; link.textContent = 'Login to play and save scores';
    box.append('Guest', document.createElement('br'), link);
  }
}
function section(id) {
  if (active) clearRound();
  document.querySelectorAll('.content-section').forEach(el => { el.style.display = el.id === id ? 'block' : 'none'; });
  if (id === 'leaderboard') loadLeaderboard();
  if (id === 'account') loadUserScores();
}
function startLevel(nextLevel) {
  if (!user) { $('login-prompt-modal').style.display = 'block'; return; }
  if (!Object.hasOwn(levels, nextLevel)) return;
  clearRound();
  level = nextLevel; score = 0; lives = 5; time = levels[level].time; pairs = 0;
  section('game-play'); active = true; locked = false;
  const grid = $('heart-box'); grid.replaceChildren();
  grid.style.setProperty('--columns', levels[level].pairs === 3 ? 3 : 4);
  const images = Array.from({ length: levels[level].pairs }, (_, i) => `heart${i + 1}.png`);
  const cards = [...images, ...images];
  for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
  for (const image of cards) {
    const card = document.createElement('button'); card.type = 'button'; card.className = 'card'; card.dataset.heart = image;
    card.setAttribute('aria-label', 'Reveal heart card');
    card.innerHTML = `<span class="card-inner"><span class="card-front">♥</span><span class="card-back"><img src="images/${image}" alt="Heart design ${image.replace(/\D/g, '')}"></span></span>`;
    card.addEventListener('click', () => flip(card)); grid.append(card);
  }
  update(); startTimer();
}
function startTimer() {
  clearInterval(timer);
  timer = setInterval(() => { if (!active || paused) return; time = Math.max(0, time - 1); update(); if (!time) endGame(false); }, 1000);
}
function flip(card) {
  if (!active || paused || locked || card.classList.contains('flipped')) return;
  card.classList.add('flipped'); selected.push(card);
  if (selected.length !== 2) return;
  locked = true;
  later(() => {
    const [first, second] = selected;
    if (first.dataset.heart === second.dataset.heart) {
      first.classList.add('matched'); second.classList.add('matched'); first.disabled = second.disabled = true;
      score += 10; pairs++; selected = []; update();
      quote();
      if (pairs === levels[level].pairs) { endGame(true); return; }
      locked = false;
    } else {
      lives--; update();
      later(() => {
        first.classList.remove('flipped'); second.classList.remove('flipped'); selected = [];
        if (!lives) offerPuzzle(); else locked = false;
      }, 600);
    }
  }, 700);
}
async function quote() {
  const version = round;
  let text = 'Believe in yourself!';
  try { const result = await request('/api/quote'); text = `${result.quote} — ${result.author}`; } catch {}
  if (version !== round || !active) return;
  $('quote-popup').textContent = text; $('quote-popup').classList.remove('hidden');
  later(() => $('quote-popup').classList.add('hidden'), 1800);
}
async function offerPuzzle() {
  if (!active || paused) return;
  paused = true; locked = true;
  if (!confirm('You lost all lives. Solve a puzzle for 2 extra lives?')) { endGame(false); return; }
  const version = round;
  let puzzle;
  try { puzzle = await request('/api/heart/external'); }
  catch { try { puzzle = await request('/api/heart'); } catch {} }
  if (version !== round || !active) return;
  if (!puzzle || !Number.isFinite(Number(puzzle.solution))) { endGame(false); return; }
  solution = Number(puzzle.solution);
  const image = $('life-image');
  const url = puzzle.question || puzzle.image;
  if (url && /^(https?:\/\/|\/images\/)/.test(url)) {
    image.onerror = () => {
      if (version !== round || !active || !paused) return;
      image.style.display = 'none';
      $('life-prompt').textContent = `Solve: heart + 1 = ${solution + 1}`;
    };
    image.src = url.replace(/^http:\/\//, 'https://'); image.style.display = 'block';
    $('life-prompt').textContent = 'Solve the missing heart value in this puzzle for 2 extra lives.';
  } else {
    image.style.display = 'none'; $('life-prompt').textContent = `Solve: ${puzzle.prompt}`;
  }
  $('life-answer').value = ''; $('extra-life-modal').style.display = 'block'; $('life-answer').focus();
}
function hidePuzzle() { $('extra-life-modal').style.display = 'none'; solution = null; }
function checkExtraLife() {
  const value = $('life-answer').value.trim();
  if (!active || !paused || solution === null || !value || !Number.isInteger(Number(value))) return;
  if (Number(value) === solution) { lives = 2; hidePuzzle(); paused = false; locked = false; update(); }
  else endGame(false);
}
async function endGame(win) {
  if (!active) return;
  active = false; locked = true; paused = false; clearInterval(timer);
  for (const id of pending) clearTimeout(id); pending.clear();
  hidePuzzle(); $('quote-popup').classList.add('hidden');
  const version = round;
  $('message-text').textContent = `${win ? 'Well done!' : 'Game Over!'} Final Score: ${score}`;
  $('result-message').classList.remove('hidden');
  if (score > 0) {
    try {
      await post('/api/leaderboard', { score, level });
      const refreshed = await getMe(); if (refreshed) { user = refreshed; account(); }
      await loadLeaderboard();
    } catch (error) {
      if (version === round) $('message-text').append(document.createElement('br'), `Score was not saved: ${error.message}`);
    }
  }
}
function renderScores(id, rows, personal = false) {
  const list = $(id); if (!list) return;
  list.replaceChildren();
  if (!rows.length) { const li = document.createElement('li'); li.textContent = 'No scores yet. Play a game to earn points!'; list.append(li); }
  rows.forEach((entry, index) => {
    const li = document.createElement('li');
    li.textContent = personal ? `${entry.score} points (${entry.level}) — ${new Date(entry.date).toLocaleDateString()}` : `${index + 1}. ${entry.playerName} — ${entry.score} (${entry.level})`;
    list.append(li);
  });
}
async function loadLeaderboard() {
  try { renderScores('leaderboard-list', await request('/api/leaderboard/top')); }
  catch { $('leaderboard-list').textContent = 'Unable to load leaderboard. Try again later.'; }
}
async function loadUserScores() {
  if (!user) { $('user-scores-list').textContent = 'Log in to view your scores.'; return; }
  try { renderScores('user-scores-list', await request('/api/leaderboard/myScores'), true); }
  catch { $('user-scores-list').textContent = 'Unable to load your scores.'; }
}
user = await getMe(); account(); loadLeaderboard();
document.querySelectorAll('[data-section]').forEach(button => button.addEventListener('click', () => section(button.dataset.section)));
document.querySelectorAll('.play-btn').forEach(button => button.addEventListener('click', () => startLevel(button.closest('.level-card').querySelector('.level-name').textContent.trim().toLowerCase())));
document.querySelector('.back-btn').addEventListener('click', () => { clearRound(); section('level-select'); });
document.querySelector('#result-message button').addEventListener('click', () => startLevel(level));
$('login-prompt-login').addEventListener('click', () => { location.href = 'login.html'; });
$('login-prompt-cancel').addEventListener('click', () => { $('login-prompt-modal').style.display = 'none'; });
$('life-answer').addEventListener('keydown', event => { if (event.key === 'Enter') checkExtraLife(); });
window.checkExtraLife = checkExtraLife;
window.cancelPuzzleModal = () => endGame(false);
window.logoutUser = async () => { clearRound(); try { await logout(); } catch { alert('Logout failed. Please try again.'); } };
