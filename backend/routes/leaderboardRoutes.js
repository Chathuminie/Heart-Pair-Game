const express = require('express');
const router = express.Router();
const lb = require('../controllers/leaderboardController');
const auth = require('../middleware/auth');

router.post('/', auth, lb.saveScore);
router.get('/top', lb.getTop);
router.get('/myScores', auth, lb.getUserScores);

module.exports = router;
