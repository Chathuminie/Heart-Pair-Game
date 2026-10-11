// backend/routes/heartRoutes.js
const router = require("express").Router();
const heartCtrl = require("../controllers/heartController");

router.get("/", heartCtrl.getHeart); // Solvable local arithmetic fallback
router.get("/external", heartCtrl.getExternal); // → proxied external Heart API JSON

module.exports = router;
