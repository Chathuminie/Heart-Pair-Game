// backend/models/Leaderboard.js
const leaderboardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  level: String,
  score: Number,
  timestamp: { type: Date, default: Date.now },
});
module.exports = mongoose.model('Leaderboard', leaderboardSchema);