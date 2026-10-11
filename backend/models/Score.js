const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  playerName: { type: String, default: "Anonymous" },
  score: { type: Number, required: true },
  level: { type: String },
  carrotsCollected: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  extra: { type: Object }
});

ScoreSchema.index({ userId: 1, score: -1 });

module.exports = mongoose.model('Score', ScoreSchema);
