// backend/routes/authRoutes.js
const router = require('express').Router();
const authCtrl = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.get('/me', auth, authCtrl.me);
router.post('/logout', authCtrl.logout);

module.exports = router;
