// frontend/js/game.js - Card Matching Game with Backend Integration
import { getMe } from './auth.js';

let currentUser = null;
let score = 0;
let lives = 3;
let maxLives = 3;
let timeLeft = 0;
let timerId = null;
let selectedCards = [];
let matchedPairs = 0;
let totalPairs = 0;
let currentLevel = 'easy';
let lockBoard = false;
let extraLifeSolution = null;
let gamePaused = false;

// DOM Elements
const elements = {};
const ids = ['level-select', 'game-play', 'heart-box', 'score', 'lives', 'timer', 'quote-popup', 'result-message', 'message-text', 'account-info', 'leaderboard-list', 'extra-life-modal', 'life-answer'];
ids.forEach(id => elements[id] = document.getElementById(id));

// Levels Configuration
const levels = {
  easy: { time: 30, lives: 5, pairs: 3 },
  medium: { time: 60, lives: 5, pairs: 6 },
  hard: { time: 90, lives: 5, pairs: 8 }
};

// Heart images list
const hearts = ['heart1.png', 'heart2.png', 'heart3.png', 'heart4.png', 'heart5.png', 'heart6.png', 'heart7.png', 'heart8.png'];

// Motivational Quotes
const quotes = [
  '❤️ Believe in yourself!',
  '❤️ You can do it!',
  '❤️ Never give up!',
  '❤️ Keep pushing forward!',
  '❤️ Every step counts!'
];

// === LOGIN PROMPT ===
function showLoginPrompt() {
  const modal = document.getElementById('login-prompt-modal');
  if (!modal) return;
  modal.style.display = 'block';
  document.body.classList.add('blur-active');
}

function hideLoginPrompt() {
  const modal = document.getElementById('login-prompt-modal');
  if (!modal) return;
  modal.style.display = 'none';
  document.body.classList.remove('blur-active');
}

// INIT
document.addEventListener('DOMContentLoaded', async () => {
  // Try to get user with a small retry in case cookie isn't ready yet
  let attempts = 0;
  while (attempts < 3 && !currentUser) {
    try {
      currentUser = await getMe();
      if (currentUser && currentUser._id) {
        console.log('✅ User authenticated:', currentUser.name);
        break;
      }
    } catch (err) {
      console.log('❌ Error getting user (attempt ' + (attempts + 1) + '):', err);
    }
    attempts++;
    if (!currentUser && attempts < 3) {
      await new Promise(r => setTimeout(r, 200)); // Wait 200ms before retry
    }
  }

  // Allow guests to view start UI. Require login when Play is clicked.
  updateAccountDisplay();
  setupNavigation();
  setupPlayButtons();
  loadLeaderboard();

  // Wire login prompt modal buttons
  const loginBtn = document.getElementById('login-prompt-login');
  const cancelBtn = document.getElementById('login-prompt-cancel');
  if (loginBtn) loginBtn.addEventListener('click', () => { window.location.href = 'login.html'; });
  if (cancelBtn) cancelBtn.addEventListener('click', hideLoginPrompt);
});

// === UPDATE ACCOUNT DISPLAY ===
function updateAccountDisplay() {
  if (currentUser && currentUser._id) {
    elements['account-info'].innerHTML = `<strong>${currentUser.name}</strong><br>High Score: <strong>${currentUser.highScore || 0}</strong>`;
  } else {
    // Guest view - show link to login
    elements['account-info'].innerHTML = `Player: <strong>Guest</strong><br><a href="login.html" style="color:#ff6b9d; text-decoration:none;">Login to save scores</a>`;
  }
}

// === SHUFFLE ARRAY ===
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// === NAVIGATION ===
function setupNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const match = btn.getAttribute('onclick')?.match(/'(.+)'/);
      if (match) showSection(match[1]);
    });
  });
}

function showSection(id) {
  document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
  const section = document.getElementById(id);
  if (section) {
    section.style.display = 'block';
    if (id === 'leaderboard') loadLeaderboard();
    // Force layout recalculation to center immediately
    section.offsetHeight;
  }
}

// === PLAY BUTTONS ===
function setupPlayButtons() {
  document.querySelectorAll('.play-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const level = btn.closest('.level-card')?.querySelector('.level-name')?.textContent.toLowerCase();
      if (level) {
        currentLevel = level;
        startLevel(level);
      }
    });
  });
  document.querySelector('.back-btn')?.addEventListener('click', goBackToLevels);
  document.querySelector('#result-message button')?.addEventListener('click', restartGame);
}

// === GAME LOGIC ===
async function startLevel(level) {
  // Require authenticated user to actually start a level
  if (!currentUser || !currentUser._id) {
    showLoginPrompt();
    return;
  }

  const config = levels[level];
  score = 0;
  lives = config.lives;
  maxLives = config.lives;
  timeLeft = config.time;
  totalPairs = config.pairs;
  matchedPairs = 0;
  selectedCards = [];
  lockBoard = false;

  updateUI();
  document.getElementById('level-select').style.display = 'none';
  document.getElementById('game-play').style.display = 'block';
  
  await createCardGame(config.pairs);
  startTimer();
}

// === CREATE CARD GAME ===
async function createCardGame(pairCount) {
  const heartGrid = elements['heart-box'];
  heartGrid.innerHTML = '';
  
  // Set grid columns based on pair count
  if (pairCount === 3) {
    heartGrid.style.gridTemplateColumns = 'repeat(3, 100px)';
  } else if (pairCount === 6) {
    heartGrid.style.gridTemplateColumns = 'repeat(4, 100px)';
  } else {
    heartGrid.style.gridTemplateColumns = 'repeat(4, 100px)';
  }

  // Select hearts for this game
  const selectedHearts = hearts.slice(0, pairCount);
  const cards = [...selectedHearts, ...selectedHearts];
  shuffle(cards);

  // Create card elements
  cards.forEach((imgName, idx) => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.heart = imgName;
    card.dataset.cardId = idx;
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">❤️</div>
        <div class="card-back">
          <img src="images/${imgName}" onerror="this.src='images/heart1.png'">
        </div>
      </div>`;
    card.addEventListener('click', () => flipCard(card));
    heartGrid.appendChild(card);
  });
}

// === FLIP CARD ===
function flipCard(card) {
  if (lockBoard || card.classList.contains('flipped') || selectedCards.length >= 2) return;
  
  card.classList.add('flipped');
  selectedCards.push(card);
  
  if (selectedCards.length === 2) {
    lockBoard = true;
    setTimeout(checkMatch, 1000);
  }
}

// === CHECK MATCH ===
async function checkMatch() {
  const [card1, card2] = selectedCards;
  const heart1 = card1.dataset.heart;
  const heart2 = card2.dataset.heart;

  if (heart1 === heart2) {
    // Match found!
    card1.classList.add('matched');
    card2.classList.add('matched');
    score += 10;
    matchedPairs++;
    showMotivationalQuote();
    
    if (matchedPairs === totalPairs) {
      // All pairs matched - WIN!
      setTimeout(() => endGame(true), 800);
    }
  } else {
    // No match - lose a life
    lives--;
    setTimeout(() => {
      card1.classList.remove('flipped');
      card2.classList.remove('flipped');
    }, 800);

    if (lives <= 0) {
      // Lives exhausted - offer puzzle
      setTimeout(() => confirmExtraLife(), 800);
    }
  }

  updateUI();
  selectedCards = [];
  lockBoard = false;
}

// === SHOW MOTIVATIONAL QUOTE ===
function showMotivationalQuote() {
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  const popup = elements['quote-popup'];
  popup.innerText = randomQuote;
  popup.classList.remove('hidden');
  setTimeout(() => popup.classList.add('hidden'), 2500);
}

// === TIMER ===
function startTimer() {
  clearInterval(timerId);
  updateTimerDisplay();
  timerId = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      // Time expired: force immediate end regardless of any active modal
      endGame(false, true);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');
  elements['timer'].textContent = `Time: ${minutes}:${seconds}`;
}

// === EXTRA LIFE PUZZLE ===
function confirmExtraLife() {
  if (lives > 0) return;
  // If time has already run out, do not offer an extra-life puzzle — end immediately.
  if (timeLeft <= 0) {
    endGame(false, true);
    return;
  }
  const confirmed = confirm('💔 You lost all lives! Want to solve a puzzle for 2 extra lives?');
  if (confirmed) {
    // Use Heart Game API to fetch an image + solution, fallback to local /api/heart
    fetchHeartQuestionAndShow();
  } else {
    // User declined — force end
    endGame(false, true);
  }
}

/**
 * Try to get a heart question from the external API, fallback to local /api/heart
 */
async function fetchHeartQuestionAndShow() {
  // Call backend proxy which fetches the external heart API server-side to avoid CORS
  let payload = null;
  try {
    const r = await fetch('/api/heart/external');
    if (r.ok) payload = await r.json();
  } catch (err) {
    console.warn('Proxied external Heart API failed:', err.message);
  }

  // Fallback to local endpoint (returns local images) if proxy failed or returned unexpected data
  if (!payload || (!payload.question && !payload.image)) {
    try {
      const r2 = await fetch('/api/heart');
      if (r2.ok) payload = await r2.json();
    } catch (err) {
      console.error('Local heart endpoint failed:', err.message);
    }
  }

  // Normalize payload: either { question, solution, carrots } or { image, solution, carrots }
  const questionUrl = payload?.question || payload?.image || null;
  const solution = payload?.solution ?? null;

  if (questionUrl && (solution !== null && solution !== undefined)) {
    extraLifeSolution = Number(solution);
    showPuzzleModalWithImage(questionUrl);
  } else {
    // If we couldn't obtain a puzzle, revert to simple generated one as last resort
    console.warn('No heart puzzle available, falling back to simple math puzzle.');
    generateLocalPuzzle();
  }
}

function generateLocalPuzzle() {
  // Previous simple math puzzle as fallback
  const operations = ['+', '-', '*'];
  const op = operations[Math.floor(Math.random() * operations.length)];
  let a = Math.floor(Math.random() * 20) + 1;
  let x, b;
  let puzzleText;

  if (op === '+') {
    x = Math.floor(Math.random() * 20) + 1;
    b = x + a;
    extraLifeSolution = x;
    puzzleText = `❤️ + ${a} = ${b}`;
  } else if (op === '-') {
    x = Math.floor(Math.random() * 20) + 1;
    b = x - a;
    extraLifeSolution = x;
    puzzleText = `❤️ - ${a} = ${b}`;
  } else {
    x = Math.floor(Math.random() * 10) + 1;
    b = x * a;
    extraLifeSolution = x;
    puzzleText = `${a} * ❤️ = ${b}`;
  }

  showPuzzleModal(puzzleText);
}

function showPuzzleModal(puzzleText) {
  const modal = elements['extra-life-modal'];
  modal.querySelector('h3').innerHTML = `🧩 Solve this: ${puzzleText}`;
  // hide image (text puzzle)
  const img = document.getElementById('life-image');
  if (img) img.style.display = 'none';
  // Pause game while puzzle is active
  clearInterval(timerId);
  gamePaused = true;
  modal.style.display = 'block';
  document.body.classList.add('blur-active');
  elements['life-answer'].value = '';
  elements['life-answer'].focus();
}

function hidePuzzleModal() {
  const modal = elements['extra-life-modal'];
  modal.style.display = 'none';
  document.body.classList.remove('blur-active');
}

/**
 * Cancel puzzle modal and end game (user gave up)
 */
function cancelPuzzleModal() {
  hidePuzzleModal();
  // Force immediate end of game when user cancels the puzzle
  endGame(false, true);
}

function showPuzzleModalWithImage(imageUrl) {
  const modal = elements['extra-life-modal'];
  const img = document.getElementById('life-image');
  const prompt = document.getElementById('life-prompt');
  if (img) {
    img.src = imageUrl;
    img.style.display = 'block';
  }
  if (prompt) prompt.innerText = '🧩 Count the hearts in the image and enter the number to earn 2 extra lives!';
  // Pause game while puzzle is active
  clearInterval(timerId);
  gamePaused = true;
  modal.style.display = 'block';
  document.body.classList.add('blur-active');
  elements['life-answer'].value = '';
  elements['life-answer'].focus();
}

// === CHECK EXTRA LIFE ===
window.checkExtraLife = async function() {
  const ans = parseInt(elements['life-answer'].value || 0);

  if (Number.isFinite(extraLifeSolution) && ans === Number(extraLifeSolution)) {
    alert('🎉 Correct! You earned 2 extra lives!');
    // Add 2 lives but don't exceed maxLives
    lives = Math.min(maxLives, lives + 2);
    hidePuzzleModal();
    updateUI();
    // Resume game
    lockBoard = false;
    if (gamePaused) {
      gamePaused = false;
      startTimer();
    }
  } else {
    alert('❌ Wrong! Game Over!');
    hidePuzzleModal();
    // Force end even if game was paused by the modal
    endGame(false, true);
  }
};

// === UPDATE UI ===
function updateUI() {
  elements['score'].textContent = `Score: ${score}`;
  elements['lives'].textContent = `Lives: ${lives}`;
}

// === END GAME ===
async function endGame(win, force = false) {
  // If the game is paused because the extra-life modal is open, do not end the game
  // unless the caller explicitly forces it (e.g., user cancelled or answered wrong).
  if (gamePaused && !force) {
    console.log('endGame skipped because game is paused (modal active)');
    return;
  }

  clearInterval(timerId);
  const messageEl = elements['message-text'];
  
  if (win) {
    messageEl.textContent = `🎉 Well done! Final Score: ${score}`;
  } else {
    messageEl.textContent = `😢 Game Over! Final Score: ${score}`;
  }
  
  // Save score (user is always authenticated at this point)
  if (score > 0) {
    await saveScore(score);
  }
  
  elements['result-message'].classList.remove('hidden');
}

// === SAVE SCORE TO BACKEND ===
async function saveScore(finalScore) {
  try {
    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score: finalScore,
        level: currentLevel
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Score saved successfully:', result);
      
      // Refresh user data to get updated highScore
      currentUser = await getMe();
      updateAccountDisplay();
      
      // Reload leaderboard
      await loadLeaderboard();
    } else {
      console.log('❌ Failed to save score:', response.status);
    }
  } catch (err) {
    console.log('❌ Error saving score:', err);
  }
}

// === GO BACK TO LEVELS ===
function goBackToLevels() {
  clearInterval(timerId);
  document.getElementById('game-play').style.display = 'none';
  document.getElementById('level-select').style.display = 'block';
  hidePuzzleModal();
}

// === RESTART GAME ===
function restartGame() {
  elements['result-message'].classList.add('hidden');
  startLevel(currentLevel);
}

// === LOAD LEADERBOARD ===
async function loadLeaderboard() {
  try {
    const res = await fetch('/api/leaderboard/top');
    if (res.ok) {
      const data = await res.json();
      elements['leaderboard-list'].innerHTML = data
        .map((s, i) => `<li>${i + 1}. ${s.playerName} - ${s.score} (${s.level || 'N/A'})</li>`)
        .join('');
    }
  } catch (err) {
    console.log('Error loading leaderboard:', err);
    elements['leaderboard-list'].innerHTML = '<li>No scores yet!</li>';
  }
}

// === LOAD USER SCORES ===
async function loadUserScores() {
  try {
    const res = await fetch('/api/leaderboard/myScores', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      const scoresList = document.getElementById('user-scores-list');
      if (data.length === 0) {
        scoresList.innerHTML = '<li style="text-align: center; color: #999; padding: 20px;">No scores yet. Play a game to earn scores!</li>';
      } else {
        scoresList.innerHTML = data
          .map((s, i) => {
            const date = new Date(s.date).toLocaleDateString();
            return `<li style="background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%); padding: 15px 20px; margin-bottom: 10px; border-radius: 15px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); border-left: 5px solid #ff6b9d;">
              <div>
                <strong>${s.score}</strong> points (${s.level || 'N/A'})
                <br>
                <small style="color: #999;">${date}</small>
              </div>
            </li>`;
          })
          .join('');
      }
    }
  } catch (err) {
    console.log('Error loading user scores:', err);
    document.getElementById('user-scores-list').innerHTML = '<li>Error loading scores</li>';
  }
}

// === EXPORT FUNCTIONS FOR ONCLICK HANDLERS ===
window.showSection = showSection;
window.startLevel = startLevel;
window.goBackToLevels = goBackToLevels;
window.restartGame = restartGame;
window.checkExtraLife = checkExtraLife;

// === REFRESH USER AUTH (for debugging/recovery) ===
window.refreshAuth = async function() {
  console.log('🔄 Manually refreshing auth...');
  currentUser = await getMe();
  updateAccountDisplay();
  console.log('✅ Auth refreshed. User:', currentUser);
};

// === LOGOUT ===
window.logoutUser = async function() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (err) {
    console.log('Logout error:', err);
  }
  // Clear current user and redirect
  currentUser = null;
  window.location.href = 'login.html';
};