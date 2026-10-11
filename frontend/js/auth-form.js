import { login, register } from './auth.js';
const form = document.querySelector('form');
form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button');
  if (button.disabled) return;
  const error = document.getElementById('error');
  button.disabled = true;
  error.hidden = true;
  try {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const name = document.getElementById('name');
    if (name) await register(name.value.trim(), email, password);
    else await login(email, password);
    location.href = 'game.html';
  } catch (failure) {
    error.textContent = failure.message;
    error.hidden = false;
  } finally {
    button.disabled = false;
  }
});
