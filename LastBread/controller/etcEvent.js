const pool = require('../lib/dbconfig');
const db = require('../lib/dbFunc')
const redis = require("./redisFunc")
const flatten = require('flat')
exports.review_start = async function(req, res) {
    const responseObj = JSON.parse(process.env.RESPONSE)
    const user = await redis.hgetall(req.cache, req.user.id)
    

    if(user){
        const userRoom = flatten.unflatten( await redis.hgetall(req.cache, user.roomKey) )
        if(userRoom){
            let average, deadDay = 0, compareMent="" , lowerBetting=0, higherBetting=0
            console.log(userRoom)
            for(let i=1; i< parseInt(userRoom.day) + 1; i++){
                let livePlayerCount=0, sum = 0
                for(let j=1; j<5;j++){
                    if(userRoom["day"+i]["player"+j]){
                        sum += parseInt(userRoom["day"+i]["player"+j].betting)
                        livePlayerCount++
                    }
                }
                // 'i' th day, betting average                
                average = Math.floor( Math.round( sum / livePlayerCount ) / 10000 ) * 10000
                if(userRoom["day"+i]["player"+user.player].betting >= average){
                    higherBetting++
                }else{
                    lowerBetting++
                }
                // user's dead day
                if(userRoom["day"+i]["player"+user.player]){
                    let dayMent
                    if(i==1){dayMent="첫"}
                    if(i==2){dayMent="둘"}
                    if(i==3){dayMent="셋"}
                    if(i==4){dayMent="넷"}
                    if(i==5){dayMent="다섯"}
                    if(i==6){dayMent="여섯"}
                    if(i==7){dayMent="일곱"}
                    if(i==8){dayMent="여덟"}
                    if(i==9){dayMent="아홉"}
                    if(i==10){dayMent="열"}
                    const maxBettingPlayer = userRoom["day"+ i].endOfDay.maxBettingPlayer.split(',')
                    let maxBettingMent = ""
                    let maxBettingPlayerMent = ""
                    if(maxBettingPlayer.length == 1){
                        if(user.player == maxBettingPlayer[0]){
                            maxBettingMent = userRoom["day"+i]["player"+maxBettingPlayer[0]].betting + "원을 배팅한, 당신이 빵을 차지했습니다."
                        }else{
                            maxBettingMent = userRoom["day"+i]["player"+maxBettingPlayer[0]].betting + "원을 배팅한,"+ maxBettingPlayer[0] +"번 플레이어가 빵을 차지했습니다."
                        }
                    }else{
                        maxBettingMent = "NO"
                        for(let k=0; k<maxBettingPlayer.length; k++){                            
                            if(user.player == maxBettingPlayer[k]){
                                maxBettingMent = "OK"
                            }else{
                                maxBettingPlayerMent += maxBettingPlayer[k] + "번, "
                            }
                        }
                    }
                    
                    if(maxBettingMent=="OK"){
                        maxBettingMent = maxBettingPlayerMent + "플레이어가 당신과, 같은 금액을 배팅해 아쉽게도 빵을 얻지 못했습니다."
                    }
                    else if(maxBettingMent=="NO"){
                        maxBettingMent = maxBettingPlayerMent + "플레이어가 같은 금액을 배팅해 아무도 빵을 얻지 못했습니다."
                    }

                    if(userRoom["day"+i]["player"+user.player].life == "false"){
                        deadDay = i
                    }                   
                    
                    compareMent+= dayMent + "째날 평균 배팅 금액은 "+ average+"원 이었고, " +maxBettingMent
                    
                }
            }
            let dayMent= parseInt(userRoom.day)
            if(dayMent==2){dayMent="둘"}
            if(dayMent==3){dayMent="셋"}
            if(dayMent==4){dayMent="넷"}
            if(dayMent==5){dayMent="다섯"}
            if(dayMent==6){dayMent="여섯"}
            if(dayMent==7){dayMent="일곱"}
            if(dayMent==8){dayMent="여덟"}
            if(dayMent==9){dayMent="아홉"}
            if(dayMent==10){dayMent="열"}

            let compareBettingment
            if(deadDay==0){
                deadDay = "승리하셨네요."
                compareBettingment = "다음에도 이번 게임처럼 배팅을 하면 또 우승하실 수 있겠네요."
            }
            else{
                if(higherBetting>lowerBetting){
                    compareBettingment = "전반적으로 평균보다 높은 금액을 배팅하셨네요, 다음에는 좀 더 낮은 금액을 배팅해보세요."
                }else{
                    compareBettingment = "전반적으로 평균보다 낮은 금액을 배팅하셨네요, 다음에는 좀 더 높은 금액을 배팅해보세요."
                }
                if(deadDay==2){deadDay="둘째날에 사망하셨네요."}
                if(deadDay==3){deadDay="셋째날에 사망하셨네요."}
                if(deadDay==4){deadDay="넷째날에 사망하셨네요."}
                if(deadDay==5){deadDay="다섯째날에 사망하셨네요."}
                if(deadDay==6){deadDay="여섯째날에 사망하셨네요."}
                if(deadDay==7){deadDay="일곱째날에 사망하셨네요."}
                if(deadDay==8){deadDay="여덟째날에 사망하셨네요."}
                if(deadDay==9){deadDay="아홉째날에 사망하셨네요."}
                if(deadDay==10){deadDay="열째날에 사망하셨네요."}
            }  
            responseObj.output["review_ment"] = "이전 게임은 "+dayMent+"째날 까지 진행 됐었고, " + deadDay + compareMent + compareBettingment

        }else{
            responseObj.output["review_ment"] = "최근 게임 기록이 없네요. 게임을 플레이 해주세요~"
        }
    }else{
        responseObj.output["review_ment"] = "최근 게임 기록이 없네요. 게임을 플레이 해주세요~"
    }     
    
    console.log(responseObj.output["review_ment"])
    return res.json(responseObj)
}

exports.rating_start = function(req, res) {
    const responseObj = JSON.parse(process.env.RESPONSE)

    if(pool){
        db.getUserScore(req['user'].id,(err,result)=>{
            if(err){
                console.log("err : ",req['user'].id)
            }else{
                console.log(result)
                
                if(result && result.length){
                    console.log("get score :",req['user'].id)
                    responseObj.output["rating_score"] = result[0].score
                    responseObj.directives[0] = [] 
                }else{
                    responseObj.output["rating_score"] = 0
                    responseObj.directives[0] = []                     
                }
                /*
                    console.log("get score : 플레이를 해주세요.")
                    responseObj.directives[0] = []
                    responseObj.resultCode = JSON.parse(process.env.EXCEPTION).rating
                    return res.json(responseObj)
                */
                return res.json(responseObj)
            }
        })
    }    
}

// currently not use
exports.ticket_start = (req, res)=>{
    const jsonObj = req.body 
    const responseObj = JSON.parse(process.env.RESPONSE)
    responseObj.output["ticket"] = 3
    responseObj.directives[0] = []    
    
    return res.json(responseObj)
}