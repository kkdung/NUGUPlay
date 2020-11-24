const Nugu = require('nugu-kit');
const quiz = require('./quiz')
//const User = require('./user[del]');

async function common_start(nugu) {
    try {
        const todayQuiz = quiz.today();
        if(todayQuiz["SOUND_COMMENT"]===undefined){ todayQuiz["SOUND_COMMENT"]="" }
        let open_ment = { "nugu_common_openment" : `${todayQuiz["OPENMENT"]} ${todayQuiz["SOUND_COMMENT"]}`};
        
        nugu.addDirective(); 
        nugu.directiveType = 'AudioPlayer.Play';
        nugu.directiveUrl = `https://www.inseop.pe.kr/music/${todayQuiz["SOUND"]}.mp3`;
        nugu.directiveToken = 'quiz_sound';
        nugu.output = open_ment;
        console.log(open_ment);
    } catch (e) {
        throw e;
    }
}
async function openQuiz(nugu) {
    try {
        const todayQuiz = quiz.today();
        if(todayQuiz["SOUND_COMMENT"]===undefined){ todayQuiz["SOUND_COMMENT"]="" }
        let open_ment = { "nugu_openment" : `${todayQuiz["OPENMENT"]} ${todayQuiz["SOUND_COMMENT"]}`};
        
        nugu.addDirective(); 
        nugu.directiveType = 'AudioPlayer.Play';
        nugu.directiveUrl = `https://www.inseop.pe.kr/music/${todayQuiz["SOUND"]}.mp3`;
        nugu.directiveToken = 'quiz_sound';
        nugu.output = open_ment;
        console.log(open_ment);
    } catch (e) {
        throw e;
    }
}

function answerQuiz(nugu) {
    try {
        const todayQuiz = quiz.today();
        const userAnswer = nugu.getValue("userAnswer");
        let answerMent = {};
        
        if (userAnswer === todayQuiz["CORRECT"]) {
            answerMent = { "nugu_answerment" : `정답입니다. ${todayQuiz["COMMENTARY"]}` };
        } else {
            answerMent = { "nugu_answerment" : `이런 틀렸어요. 정답은 ${todayQuiz['CORRECT']}번, ${todayQuiz["CHOICE"+todayQuiz['CORRECT']]}입니다. ${todayQuiz["COMMENTARY"]}` };
        }
        nugu.output = answerMent;
    } catch (e) {
        throw e;
    }
}

function quizSound(nugu) {
    try {
        const todayQuiz = quiz.today();
        nugu.output = {'nugu_todayquiz' : ` ${todayQuiz["QUESTION"]}. 1번, ${todayQuiz["CHOICE1"]}. 2번, ${todayQuiz["CHOICE2"]}. 3번, ${todayQuiz["CHOICE3"]}. 4번, ${todayQuiz["CHOICE4"]}. `};
        } catch (e) {
        throw e;
    }
}

function repeatQuiz(nugu) {
    try {
        const todayQuiz = quiz.today();
        nugu.output = {'repeat_todayquiz' : `네, 문제를 다시 들려드릴게요. ${todayQuiz["QUESTION"]}. 1번, ${todayQuiz["CHOICE1"]}. 2번, ${todayQuiz["CHOICE2"]}. 3번, ${todayQuiz["CHOICE3"]}. 4번, ${todayQuiz["CHOICE4"]}. `};
        } catch (e) {
        throw e;
    }
}

function defaultFinished(nugu) {

}

module.exports = (req, res) => {
    const nugu = new Nugu(req);

    try {
        switch (nugu.actionName) {
            case 'common_start':
                common_start(nugu);
                break;
            case 'openQuiz':
                openQuiz(nugu);
                break;
            case 'repeatQuiz':
                repeatQuiz(nugu);
                break;
            case 'answerQuiz':
                answerQuiz(nugu);
                break;
            case 'quiz_sound':
                quizSound(nugu);
                break;
            case 'finish_sound':
                finishSound(nugu);
                break;
            case 'default_finished':
                defaultFinished(nugu);
                break;
        }
    }
    catch (e) {
        console.log(`\n${e.stack}`);
        nugu.resultCode = e.resultCode;
    } finally {
        console.log(nugu.response);
        return res.json(nugu.response);
    }
}