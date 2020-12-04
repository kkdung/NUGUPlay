const express = require('express');
const router = express.Router();
const app = require('../core');

router.post("/common_start", app);
router.post("/openQuiz", app);
router.post("/answerQuiz", app);
router.post("/quiz_sound", app);
router.post("/repeat_answerstate", app);
//router.post("/bonusevent_sound", app);
//router.post("/adevent_sound", app);
//router.post("/finish_sound", app);
router.post("/default_finished", app);
//router.post("/askPoint", app);

module.exports = router;
