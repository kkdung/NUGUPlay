require('dotenv').config();
const express = require('express');
const router = require('./routes/router')
const app = express();
app.use(express.json());

app.get('/revoice/health', (req, res) => {
    console.log(`helath request : ${req.headers}`);
    return res.status(200).send('OK');
});

app.use('/revoice', router);

app.use(function (err, req, res, next) {
    console.error(err.message)
    res.status(err.status).send(err.message);
});

app.listen((process.env.PORT), () => {
    console.log(`todayQuiz app listening on port ${process.env.PORT}`);
});