// frontend/js/auth.js
export async function login(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

export async function register(name, email, password) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  return res.json();
}

export async function getMe() {
  try {
    const res = await fetch('/api/auth/me', { 
      credentials: 'include',
      cache: 'no-store'
    });
    console.log('GET /api/auth/me response:', res.status, res.statusText);
    if (res.ok) {
      const user = await res.json();
      console.log('✅ User data received:', user);
      return user;
    } else {
      console.log('❌ /api/auth/me returned', res.status);
      return null;
    }
  } catch (err) {
    console.log('❌ Error fetching user:', err);
    return null;
  }
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  location.href = '/';
}