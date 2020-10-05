const express = require('express')
const router = express.Router()
router.use(express.json())

/***     audio 이벤트 처리      ***/
const playEvent = require('./controller/playEvent')
const finishEvent = require('./controller/finishEvent')
const etcEvent = require('./controller/etcEvent')

// play
router.post('/matching_start', playEvent.matching_start)
router.post('/betting_start',playEvent.betting_start)

// finish
router.post('/matching_finished',finishEvent.matching_finished)
router.post('/intro_finished',finishEvent.intro_finished)
router.post('/bet_finished',finishEvent.bet_finished)
router.post('/passnight_finished',finishEvent.passNight_finished)
router.post('/next_bet',finishEvent.nextBet_finished)

// etc..
router.post('/review_start', etcEvent.review_start)
router.post('/rating_start', etcEvent.rating_start)
router.post('/ticket_start',etcEvent.ticket_start)

module.exports = router