// backend/middleware/auth.js
const { verify } = require('../utils/jwt');

module.exports = (req, res, next) => {
  const token = req.cookies?.jwt;  // ← SAFE: use optional chaining
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }
  try {
    const payload = verify(token);
    req.userId = payload.id;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};