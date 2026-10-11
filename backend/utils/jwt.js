// backend/utils/jwt.js
const jwt = require('jsonwebtoken');
function secret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
  return process.env.JWT_SECRET;
}

module.exports = {
  sign: (payload) => jwt.sign(payload, secret(), { expiresIn: '7d', algorithm: 'HS256' }),
  verify: (token) => jwt.verify(token, secret(), { algorithms: ['HS256'] })
};
