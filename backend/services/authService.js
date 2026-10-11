// backend/services/authService.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sign } = require('../utils/jwt');

module.exports = {
  async register({ name, email, password } = {}) {
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) throw new Error('Name must contain 1 to 80 characters');
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error('Enter a valid email');
    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) throw new Error('Password must have at least 8 characters and at most 72 bytes');
    name = name.trim(); email = email.trim().toLowerCase();
    const user = await User.create({ name, email, password });
    return { userId: user._id, token: sign({ id: user._id }) };
  },

  async login({ email, password } = {}) {
    if (typeof email !== 'string' || typeof password !== 'string') throw new Error('Invalid email or password');
    email = email.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid email or password');
    }
    return { userId: user._id, token: sign({ id: user._id }) };
  },

  async getUser(id) {
    return await User.findById(id).select('-password');
  }
};
