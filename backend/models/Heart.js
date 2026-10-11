// backend/models/Heart.js
const mongoose = require('mongoose');
const heartSchema = new mongoose.Schema({
  level: { type: String, enum: ['easy','medium','hard'], required: true },
  cards: [{ type: String }],          // e.g. ["heart1","heart2",...]
});
module.exports = mongoose.model('Heart', heartSchema);
