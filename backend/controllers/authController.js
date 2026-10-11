// backend/controllers/authController.js
const authService = require('../services/authService');

exports.register = async (req, res) => {
  try {
    const data = await authService.register(req.body);
    res.cookie('jwt', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({ userId: data.userId });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.login = async (req, res) => {
  try {
    const data = await authService.login(req.body);
    res.cookie('jwt', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({ userId: data.userId });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
};

exports.me = async (req, res) => {
  const user = await authService.getUser(req.userId);
  res.json(user);
};

exports.logout = (req, res) => {
  res.clearCookie('jwt');
  res.json({ message: 'Logged out' });
};