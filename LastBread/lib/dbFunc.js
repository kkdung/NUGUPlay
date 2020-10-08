const pool = require('./dbconfig');

const saveUser = (user,callback) => {
    console.log('saveUser 호출됨')
    const data = [user.id, user.name,user.email,user.locale]
    const param = {}
    const sql = 'insert into users (ID,name,email,locale) values (?,?,?,?) ON DUPLICATE KEY UPDATE count=count+1'
    executeSQL(sql,data,param,callback)
}
const setUserScore = (ID, score, callback) =>{
    console.log('setUserScore 호출됨')
    const data = [score,ID]
    const param = {}
    const sql = 'update users set score=? where ID=?'
    executeSQL(sql,data,param,callback)
}
const getUserScore = (ID,callback) =>{
    console.log('getUserScore 호출됨')
    const data = [ID]
    const param = {}
    const sql = 'select score from users where ID=?'
    executeSQL(sql,data,param,callback)
}

// SQL문 실행
const executeSQL = (sql, data, param, callback)=> {
    if(pool){
        pool.getConnection((err,conn)=>{
            if(err){
                if(conn){
                    conn.release()
                }
                callback(err,null);
                return
            }

            const exec = conn.query(sql, data,(err,result)=>{
                conn.release()
                if(err){
                    console.log("SQL 실행 시 오류 발생함.")
                    console.dir(err)

                    callback(err, null)
                    return
                }
                callback(null, result, param)
            })
        })
    }
}

module.exports = {saveUser,getUserScore,setUserScore}