const redis = require('./redisFunc')
const flatten = require('flat')
const db = require('../lib/dbFunc')

exports.matching_finished = async function(req, res){
    const responseObj = JSON.parse(process.env.RESPONSE)
    const directives = responseObj.directives[0]    
    
    // Get background intro music
    // 1) get user roomKey
    try{
        const user = await redis.hgetall(req.cache, req.user.id)
        // 2) Bring intro music from users room
        directives.audioItem.stream["url"] = await redis.hmget(req.cache, user.roomKey, "introMusic")       
        directives.audioItem.stream["token"] = JSON.parse(process.env.TOKEN).intro
    }catch(err){
        console.error(err)
        let errObj = {}
        errObj["resultCode"] = JSON.parse(process.env.EXCEPTION).server
        return res.json(errObj)
    }
    
    console.log(directives)
    return res.json(responseObj)
}

exports.intro_finished = async function(req, res){
    const responseObj = JSON.parse(process.env.RESPONSE)
    const directives = responseObj.directives[0]    
    
    try{
        //get user 'player number'
        const user = await redis.hgetall(req.cache, req.user.id)

        //set user 'bettingAvailabilty' is true
        setTimeout(function() {
            redis.hmset(req.cache, req.user.id, {'bettingAvailabilty':true}, 25)
            console.log(req.user.id,' is bettingAvailabilty is true!');
        }, 15 *1000);          
       
        responseObj.output["playerNum"] = user.player    
        directives.audioItem.stream["token"] = JSON.parse(process.env.TOKEN).ready_bet
        directives.audioItem.stream["url"] = JSON.parse(process.env.URL).ready_bet
    }catch(err){
        console.error(err)
        let errObj = {}
        errObj["resultCode"] = JSON.parse(process.env.EXCEPTION).server
        return res.json(errObj)
    }    
    
    console.log(directives)
    return res.json(responseObj)
}

exports.bet_finished = async function(req, res){     
    const responseObj = JSON.parse(process.env.RESPONSE)
    const directives = responseObj.directives[0]
    let url, ment, maxBetting = 0
    const user = await redis.hgetall(req.cache, req.user.id)      

    
    /* !!!!!!!!!! LOCK block start !!!!!!!!!! */   
    req.redlock.lock("lock:"+user.roomKey, 1000).then(async (lock)=> {
        console.log('redis is lock')   
        const userRoom = flatten.unflatten( await  redis.hgetall(req.cache, user.roomKey) )  
       
        /* If first Betting end */
        if(userRoom.firstBettingEnd=="false"){
            let playingUser = []
            userRoom.firstBettingEnd = true
            for(let i=1; i<5; i++){
                if(userRoom["day"+userRoom.day]["player"+i]){
                    if(userRoom["day"+userRoom.day]["player"+i].life == "true"){
                        // Kill alive but not betting
                        if(userRoom["day"+userRoom.day]["player"+i].bettingState == "false"){
                            userRoom["day"+userRoom.day]["player"+i].life = false
                        }else{
                            // playing user push
                            playingUser.push(i)
                        }
                    }
                }
            }

            // Calculate Max Betting
            for(let i=0; i<playingUser.length; i++){              
                if(maxBetting <= parseInt(userRoom["day"+userRoom.day]["player"+playingUser[i]].betting)){
                    maxBetting = userRoom["day"+userRoom.day]["player"+playingUser[i]].betting
                }
            }
            userRoom["day"+userRoom.day].endOfDay.maxBetting = maxBetting

            // Find max betting user
            let maxBettingPlayer = []
            for(let i=0; i<playingUser.length; i++){              
                if(userRoom["day"+userRoom.day]["player"+playingUser[i]].betting == maxBetting){
                    maxBettingPlayer.push(playingUser[i])                    
                }
            }
            userRoom["day"+userRoom.day].endOfDay.maxBettingPlayer = maxBettingPlayer.toString()

            // If same betting !
            if(maxBettingPlayer.length > 1){
                for(let i=0; i<playingUser.length; i++){              
                    --userRoom["day"+userRoom.day]["player"+playingUser[i]].bread
                }
                ment = maxBettingPlayer.length + "명이 같은 금액을 배팅해, 아무도 빵을 얻지 못했습니다."
            }else{
                // If just one winner
                for(let i=0; i<playingUser.length; i++){
                    if(userRoom["day"+userRoom.day].endOfDay.maxBettingPlayer[0] == playingUser[i]){
                        /* nothing */
                    }else{
                        --userRoom["day"+userRoom.day]["player"+playingUser[i]].bread
                    }                           
                }
                ment = maxBettingPlayer[0]+"번 생존자가 빵을 차지했습니다."            
            }
             // Dead OR Live
            for(let i=0; i<playingUser.length; i++){              
                if(userRoom["day"+userRoom.day]["player"+playingUser[i]].bread == -1){
                    userRoom["day"+userRoom.day]["player"+playingUser[i]].life = false         
                }
            }
            userRoom.firstEntryNextDay = false
            //finally save userStting
            redis.hmset(req.cache, user.roomKey, flatten( userRoom ), req.expire)
            console.log(userRoom)
        }else{
            maxBetting = userRoom["day"+userRoom.day].endOfDay.maxBetting
            const maxBettingPlayer = userRoom["day"+userRoom.day].endOfDay.maxBettingPlayer.split(',')
            if(maxBettingPlayer.length > 1){
                ment = maxBettingPlayer.length + "명이 같은 금액을 배팅해, 아무도 빵을 얻지 못했습니다."
            }else{
                ment = maxBettingPlayer[0]+"번 생존자가 빵을 차지했습니다."    
            }
        }

        /*  Calculate bread */
        // no bread
        if(userRoom["day"+userRoom.day]["player"+user.player].bread == -1){
            url = JSON.parse(process.env.URL).passnight_nobread
        }
        // last bread
        else if(userRoom["day"+userRoom.day]["player"+user.player].bread == 0){
            url = JSON.parse(process.env.URL).passnight_lastbread
        }
        else{
            url = JSON.parse(process.env.URL).passnight_eatbread
        }


        lock.unlock().then(()=>{
            console.log('redis is unlock')
        })
        .catch((err)=> {
            // Failed to release
            console.log(err)
            console.log('unlock err')
            reject("reject")
        })              
    }).then(()=> {
        // Lock has been released
        console.log("lock is finished")
        responseObj.output["maxBet"] = maxBetting
        responseObj.output["ment"] = ment
        directives.audioItem.stream["url"] = url
        directives.audioItem.stream["token"] = JSON.parse(process.env.TOKEN).passnight
        console.log(directives)
        return res.json(responseObj)  
    }).catch((err)=> {
        console.log(err)
        let errObj = {}
        errObj["resultCode"] = JSON.parse(process.env.EXCEPTION).server
        return res.json(errObj)
    });   
}

exports.passNight_finished = async function(req, res){
    const responseObj = JSON.parse(process.env.RESPONSE)
    const directives = responseObj.directives[0]
    let url, token, livePlayerCount = 0, deadPlayer ="",passnight_prompt=""

    const user = await redis.hgetall(req.cache, req.user.id)
    const userRoom = flatten.unflatten( await  redis.hgetall(req.cache, user.roomKey) )  

   // get live player count, dead player
    for(let i=1; i<5; i++){
        if(userRoom["day"+userRoom.day]["player"+i]){            
            if(userRoom["day"+userRoom.day]["player"+i].life == "true"){
                livePlayerCount++
            }else{
                deadPlayer += i+"번,"
            }
        }
    }
    // If user is dead player
    if(userRoom["day"+userRoom.day]["player"+user.player].life == "false" ){
        passnight_prompt = "당신은 4명 중"+(4-livePlayerCount)+"번째로, 사망하셨습니다."
        url = JSON.parse(process.env.URL).dayresult_die
        token = JSON.parse(process.env.TOKEN).gamefinished_token
    }
    // If user is live player
    else{             
        // If live player is last one. WIN !!
        if(livePlayerCount==1){
            // plus score
            db.getUserScore(req.user.id, (err, result)=>{
                if(err){console.log(err)}
                else{
                    let score = result[0].score
                    
                    if(userRoom.day==3){
                        score += 1000
                    }else if(userRoom.day==4){
                        score += 700
                    }else{
                        score += 500
                    }                    
                    db.setUserScore(req.user.id, score,(err, result)=>{
                        if(err){console.log(err)}
                        else{
                            console.log(result)
                        }
                    })
                }
            })            
            url = JSON.parse(process.env.URL).dayresult_win
            token = JSON.parse(process.env.TOKEN).gamefinished_token
        }
        else{
            let dayMent= parseInt(userRoom.day) +1
            let deadMent = ""
            if(dayMent==2){dayMent="둘"}
            if(dayMent==3){dayMent="셋"}
            if(dayMent==4){dayMent="넷"}
            if(dayMent==5){dayMent="다섯"}
            if(dayMent==6){dayMent="여섯"}
            if(dayMent==7){dayMent="일곱"}
            if(dayMent==8){dayMent="여덟"}
            if(dayMent==9){dayMent="아홉"}
            if(dayMent==10){dayMent="열"}
            if(deadPlayer!=""){
                deadMent = "어젯 밤, "+ deadPlayer +" 생존자가 사망했습니다... "
            }
            passnight_prompt = dayMent +"째 날이 되었습니다,, "+ deadMent +
                                "남은 생존자는 "+ livePlayerCount +"명 입니다. 남은 빵은 " + userRoom["day"+userRoom.day]["player"+user.player].bread +"개 입니다. " 
            url = JSON.parse(process.env.URL).dayresult_live
            token = JSON.parse(process.env.TOKEN).nextbet_token
        }        
    }     

    responseObj.output["passnight_prompt"] = passnight_prompt
    directives.audioItem.stream["url"] = url
    directives.audioItem.stream["token"] = token    
    console.log(directives)
    return res.json(responseObj)
}

// next day
exports.nextBet_finished = async function(req, res){
    const responseObj = JSON.parse(process.env.RESPONSE)
    const directives = responseObj.directives[0]
    directives.audioItem.stream["url"] = JSON.parse(process.env.URL).ready_bet
    directives.audioItem.stream["token"] = JSON.parse(process.env.TOKEN).ready_bet

    const user = await redis.hgetall(req.cache, req.user.id)
    let userRoom

    req.redlock.lock("lock:"+user.roomKey, 1000).then(async (lock)=> {
        console.log('redis is lock')     
        userRoom = flatten.unflatten( await  redis.hgetall(req.cache, user.roomKey) )  
        // If first entry next bet ! 
        if(userRoom.firstEntryNextDay=="false"){
            userRoom.firstEntryNextDay = true
            const nextDay = parseInt(userRoom.day) + 1
            const livePlayer = []
            for(let i=1; i<5; i++){
                if(userRoom["day"+userRoom.day]["player"+i]){
                    if(userRoom["day"+userRoom.day]["player"+i].life == "true"){
                        livePlayer.push(i)
                    }
                }            
            }
            userRoom["day"+nextDay] = {}
            // live player copy to next day && userSetting init
            for(let i=0; i<livePlayer.length; i++){
                userRoom["day"+nextDay]["player"+livePlayer[i]] = {}
                userRoom["day"+nextDay]["player"+livePlayer[i]].life = userRoom["day"+userRoom.day]["player"+livePlayer[i]].life
                userRoom["day"+nextDay]["player"+livePlayer[i]].money = userRoom["day"+userRoom.day]["player"+livePlayer[i]].money
                userRoom["day"+nextDay]["player"+livePlayer[i]].bread = userRoom["day"+userRoom.day]["player"+livePlayer[i]].bread
                userRoom["day"+nextDay]["player"+livePlayer[i]].betting = 0
                userRoom["day"+nextDay]["player"+livePlayer[i]].bettingState = false
            }
            userRoom["day"+nextDay].endOfDay = { "maxBettingPlayer":"", "maxBetting":0 }
            userRoom.day = nextDay
            userRoom.firstBettingTime = 0
            userRoom.firstBettingEnd = false

            //finally save roomStting
            redis.hmset(req.cache, user.roomKey, flatten( userRoom ), req.expire)
            console.log(userRoom)            
        }       

        lock.unlock().then(()=>{
            console.log('redis is unlock')
        })
        .catch((err)=> {
            // Failed to release
            console.log(err)
        })              
    }).then(()=> {
        // Lock has been released
        //set user 'bettingAvailabilty' is true
        setTimeout(function() {
            redis.hmset(req.cache, req.user.id, {'bettingAvailabilty':true}, 25)
            console.log(req.user.id,' is bettingAvailabilty is true!');
        }, 15 *1000);
        
        responseObj.output["now_money"] = userRoom["day"+userRoom.day]["player"+user.player].money
        console.log(directives)
        console.log("lock is finished")
        return res.json(responseObj)        
    }).catch((err)=> {
        console.log(err)
        let errObj = {}
        errObj["resultCode"] = JSON.parse(process.env.EXCEPTION).server
        return res.json(errObj)
    });   

}