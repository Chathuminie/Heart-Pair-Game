import { request, post } from './api.js';
export const login = (email, password) => post('/api/auth/login', { email, password });
export const register = (name, email, password) => post('/api/auth/register', { name, email, password });
export async function getMe() {
  try { return await request('/api/auth/me', { cache: 'no-store' }); }
  catch { return null; }
}
export async function logout() {
  await post('/api/auth/logout', {});
  location.href = 'login.html';
}
