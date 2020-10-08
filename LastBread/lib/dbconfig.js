var mysql = require('mysql');
var pool = mysql.createPool(
  JSON.parse(process.env.DB_CONFIG)
);
module.exports = pool;