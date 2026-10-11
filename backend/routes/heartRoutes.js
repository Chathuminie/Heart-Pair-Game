// backend/routes/heartRoutes.js
const router = require("express").Router();
const heartCtrl = require("../controllers/heartController");

router.get("/", heartCtrl.getHeart);   // → local images { image, solution, carrots }
router.get("/external", heartCtrl.getExternal); // → proxied external Heart API JSON

module.exports = router;