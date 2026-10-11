// backend/utils/jwt.js
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'fallbackSecret123';

module.exports = {
  sign: (payload) => jwt.sign(payload, secret, { expiresIn: '7d' }),
  verify: (token) => jwt.verify(token, secret)
};