const express = require('express');
const router = express.Router();
const q = require('../controllers/quoteController');
router.get('/', q.getQuote);
module.exports = router;
