const XLSX = require('xlsx');
const moment = require('./moment');
let quiz = {};

quiz.today = function () {
    try {
        const today = moment().format('D');
        const yearMonth = moment().format('YYYYMM');

        // today quiz
        const today_sheets = XLSX.readFile(`./rsc/today/${yearMonth}_revoicequizlist.xlsx`,
            { dateNF: 'yyyy-mm-dd', cellDates: true, encoding: 'utf8' }
        );
        const today_sheet1 = XLSX.utils.sheet_to_row_object_array(
            today_sheets.Sheets['Sheet1'],
            { raw: false }
        )

        // find cell
        for (var i = 0; i < today_sheet1.length; i++) {
            if (today_sheet1[i].DATE == today) {
                return today_sheet1[i];
            }
        }
        return null;
    } catch (e) {
        e.resultCode = process.env.SERVER_CHECK
        throw e;
    }
}

// quiz.bonus = function (bonusNumber) {
//     try {
//         const bonus_sheets = XLSX.readFile(`./rsc/bonus/bonus_revoicequizlist.xlsx`, { cellDates: true, encoding: 'utf8' })
//         const bonus_sheet1 = XLSX.utils.sheet_to_row_object_array(
//             bonus_sheets.Sheets['Sheet1'],
//             { raw: false }
//         );

//         /* Find desired cell */
//         for (var i = 0; i < bonus_sheet1.length; i++) {
//             if (bonus_sheet1[i].NUMBER == bonusNumber) {
//                 return bonus_sheet1[i];
//             }
//         }
//         return null;
//     } catch (e) {
//         e.resultCode = process.env.SERVER_CHECK
//         throw e;
//     }
// }
// quiz.ad = function () {
//     try {
//         const today = moment().format('YYYY-MM-DD');
//         const yearMonth = moment().format('YYYYMM');

//         // ad quiz
//         const ad_sheets = XLSX.readFile(`./rsc/ad/${yearMonth}_ad_revoicequizlist.xlsx`,
//             { dateNF: 'yyyy-mm-dd', cellDates: true, encoding: 'utf8' }
//         );
//         const ad_sheet1 = XLSX.utils.sheet_to_row_object_array(
//             ad_sheets.Sheets['Sheet1'],
//             { raw: false }
//         );

//         for (var i = 0; i < ad_sheet1.length; i++) {
//             if (ad_sheet1[i].DATE == today) {
//                 if (ad_sheet1[i]['CORRECT'] != undefined) {
//                     return ad_sheet1[i];
//                 }
//                 break;
//             }
//         }
//         return null;
//     } catch (e) {
//         e.resultCode = process.env.SERVER_CHECK
//         throw e;
//     }
// }

// const getCorrectRate = function (column) {
//     return new Promise(async function (resolve, reject) {
//         const today = moment().format('YYYY-MM-DD');
//         const todayAnswer = await db.select(column, today);
//         let T_correct = 0;
//         let percentage = 0;
//         for (var i = 0; i < todayAnswer.length; i++) {
//             if (todayQuiz['CORRECT'] == todayAnswer[i]['today_answer']) {
//                 T_correct++;
//             }
//         }
//         if (todayAnswer.length > 0) {
//             console.log('오늘 플레이 수 : ' + todayAnswer.length);
//             console.log('정답 수 ' + T_correct);
//             percentage = Math.round((T_correct / todayAnswer.length) * 100);
//         }
//         console.log('todayAnswer percentage : ' + percentage + '%');
//         resolve(percentage);
//     });
// }

module.exports = quiz;