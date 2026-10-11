const Score = require('../models/Score');
const User = require('../models/User');

exports.saveScore = async (req, res) => {
  try {
    const { score, level, carrotsCollected = 0 } = req.body || {};
    const maximumScores = { easy: 30, medium: 60, hard: 80 };
    const userId = req.userId; // From auth middleware

    if (!Object.hasOwn(maximumScores, level) || !Number.isInteger(score) || score < 0 || score > maximumScores[level] || score % 10 !== 0) return res.status(400).json({ error: 'Invalid score or level' });
    if (!Number.isInteger(carrotsCollected) || carrotsCollected < 0) return res.status(400).json({ error: 'Invalid carrots count' });

    // Get user info for playerName
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Save score
    const s = new Score({
      userId,
      playerName: user.name,
      score,
      level,
      carrotsCollected,
      extra: {}
    });
    const saved = await s.save();

    // Update user's highScore if this is a new high score
    await User.updateOne({ _id: userId }, { $max: { highScore: score } });

    return res.status(201).json(saved);
  } catch (err) {
    console.error("Error saving score:", err);
    return res.status(500).json({ message: "Error saving score" });
  }
};

exports.getTop = async (req, res) => {
  try {
    // Get top 10 scores overall, sorted by score descending
    const top = await Score.find()
      .populate('userId', 'name')
      .sort({ score: -1, date: 1 })
      .limit(10);

    // Format response
    const formatted = top.map(s => ({
      playerName: s.playerName || 'Anonymous',
      score: s.score,
      level: s.level || 'N/A',
      date: s.date
    }));

    return res.json(formatted);
  } catch (err) {
    console.error("Error fetching top scores:", err);
    return res.status(500).json({ message: "Error fetching top scores" });
  }
};

exports.getUserScores = async (req, res) => {
  try {
    const userId = req.userId;
    const scores = await Score.find({ userId })
      .sort({ score: -1, date: -1 })
      .limit(10);
    return res.json(scores);
  } catch (err) {
    console.error("Error fetching user scores:", err);
    return res.status(500).json({ message: "Error fetching user scores" });
  }
};
