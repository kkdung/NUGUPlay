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

module.exports = quiz;