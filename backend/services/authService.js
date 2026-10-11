// backend/services/authService.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sign } = require('../utils/jwt');

module.exports = {
  async register({ name, email, password }) {
    const user = await User.create({ name, email, password });
    return { userId: user._id, token: sign({ id: user._id }) };
  },

  async login({ email, password }) {
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