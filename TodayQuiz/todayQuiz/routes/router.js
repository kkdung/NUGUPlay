const express = require('express');
const router = express.Router();
const app = require('../core');

router.post("/common_start", app);
router.post("/openQuiz", app);
router.post("/answerQuiz", app);
router.post("/quiz_sound", app);
router.post("/repeatQuiz", app);
router.post("/finish_sound", app);
router.post("/default_finished", app);

module.exports = router;
