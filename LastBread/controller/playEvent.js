const uuidv1 = require('uuid/v1') //timestamp uuid
const redis = require('./redisFunc')
const flatten = require('flat')
const room = process.env.ROOM
const db = require('../lib/dbFunc')
exports.matching_start = async (req, res)=>{
    const responseObj = JSON.parse(process.env.RESPONSE)
    const directives = responseObj.directives[0]    

    try{ 
        saveUser(req)
        /* Check user is Exit and Re-enter during matching */
        const user = await redis.hgetall(req.cache, req.user.id)
        let reEnterUserRoomKey = false 
        if(user){
            reEnterUserRoomKey = user.roomKey
        }

        /*  Create a game room ( 15 second )   */
        /* !!!!!!!!!! LOCK block start !!!!!!!!!! */
        
        const newRoom = await createRoom(req, reEnterUserRoomKey, directives)

        /*  !!!!!!!!!! LOCK block end !!!!!!!!!!  */

        console.log("newRoom :",newRoom)        
        
    }catch(err){
        console.log(err)
        let errObj = {}
        errObj["resultCode"] = JSON.parse(process.env.EXCEPTION).server
        return res.json(errObj)
    }
    
    responseObj.output["matching_ment"] = "매칭을 시작합니다."
    directives.audioItem.stream["url"] = JSON.parse(process.env.URL).matching
    directives.audioItem.stream["token"] = JSON.parse(process.env.TOKEN).matching    
    console.log(directives)
    return res.json(responseObj)
  
}
exports.betting_start = async (req, res)=>{
    const jsonObj = req.body    
    const parameters = jsonObj.action.parameters    
    const responseObj = JSON.parse(process.env.RESPONSE)
    const directives = responseObj.directives[0]    
    let bet = parameters['input_bet'].value
    let feedback = ''



    if(bet==0){/*nothing*/}
    else if(bet==1){bet=10000}
    else if(bet==2){bet=20000}
    else if(bet==3){bet=30000}
    else if(bet==4){bet=40000}
    else if(bet==5){bet=50000}
    else if(bet==6){bet=60000}
    else if(bet==7){bet=70000}
    else if(bet==8){bet=80000}
    else if(bet==9){bet=90000}
    else if(bet==10){bet=100000}
    else{
        let errObj = {}
        errObj["resultCode"] = JSON.parse(process.env.EXCEPTION).server
        return res.json(errObj)
    }

    // Get user roomKey
    const user = await redis.hgetall(req.cache, req.user.id)

    /* Wrong approach */
    // 1. Direct access without matching
    if(!user){
        let errObj = {}
        errObj["resultCode"] = JSON.parse(process.env.EXCEPTION).bet
        console.log(req.user.id," : Direct access without matching")
        return res.json(errObj)        
    }
    // 2. Direct access immediately after matching or intro or betting finished
    if(user.bettingAvailabilty=="false"){
        let errObj = {}
        errObj["resultCode"] = JSON.parse(process.env.EXCEPTION).bet
        console.log(req.user.id," : Direct access immediately after matching or intro or betting finished")
        return res.json(errObj)
    }

    // Set bettingAvailabilty is 'false'
    redis.hmset(req.cache, req.user.id, {'bettingAvailabilty':false}, req.expire)    

    // If first Betting
    /* !!!!!!!!!! LOCK block start !!!!!!!!!! */   
    req.redlock.lock("lock:"+user.roomKey, 1000).then(async (lock)=> {
        console.log('redis is lock')     
        // Find user room
        const userRoom = flatten.unflatten( await redis.hgetall(req.cache, user.roomKey) )
        
        // Get user money
        const money = userRoom["day"+userRoom.day]["player"+user.player].money
        
        // If the bettting is more than the money, Go all-in
        if(money<bet){
            bet = money
            feedback = "남은 금액을 초괴하여, 최대로 배팅합니다. "

        }

        // Calculate ( betting, money, betting state )
        userRoom["day"+userRoom.day]["player"+user.player].betting = bet
        userRoom["day"+userRoom.day]["player"+user.player].money = (money - bet)
        userRoom["day"+userRoom.day]["player"+user.player].bettingState = true

        /* Update room setting */
        const nowTime = new Date().getTime()
        if(userRoom.firstBettingTime == 0){
            // add firstBettingTime 
            userRoom.firstBettingTime = nowTime
            directives.audioItem.stream["offsetInMilliseconds"] = 8000
            // add AI betting
            for(let i=0; i< 4-userRoom.playerCount; i++){
                let player            
                switch(i){
                    case 0: player = "player4"; break
                    case 1: player = "player3"; break
                    case 2: player = "player2"; break
                }
                // random betting
                if(userRoom["day"+userRoom.day][player]){
                    const AI_money = userRoom["day"+userRoom.day][player].money
                    const randomBetting = ( Math.floor( Math.random()*( AI_money/10000+1 ) ) )*10000;
                    userRoom["day"+userRoom.day][player].betting = randomBetting
                    userRoom["day"+userRoom.day][player].money = (AI_money - randomBetting)
                    userRoom["day"+userRoom.day][player].bettingState = true
                }
            }
        }else{
            // offset setting
            directives.audioItem.stream["offsetInMilliseconds"] = 8000 + (nowTime - userRoom.firstBettingTime)  
        }
    
        redis.hmset(req.cache, user.roomKey, flatten(userRoom), req.expire)   
        console.log(userRoom)   

        lock.unlock().then(()=>{
            console.log('redis is unlock')
        })
        .catch((err)=> {
            // Failed to release
            console.log(err)
            console.log('unlock err')
        })              
    }).then(()=> {
        // Lock has been released
        console.log("lock finished")
        responseObj.output["player_bet"] = bet
        responseObj.output["headFeedback"] = feedback
        directives.audioItem.stream["url"] = JSON.parse(process.env.URL).bet
        directives.audioItem.stream["token"] = JSON.parse(process.env.TOKEN).bet         
        console.log(directives)
        return res.json(responseObj)
    }).catch((err)=> {
        console.log(err)
        console.log("lock failed")
        let errObj = {}
        errObj["resultCode"] = JSON.parse(process.env.EXCEPTION).server
        return res.json(errObj)
    });

    /*  !!!!!!!!!! LOCK block end !!!!!!!!!!  */   
}

function createRoom(req, reEnterUserRoomKey, directives){
    return new Promise((resolve,reject)=>{        
        req.redlock.lock("lock:"+room, 1000).then(async (lock)=> {
            console.log('redis is lock')
            const roomManager = await redis.hgetall(req.cache, room)
            // Init : create room
            if(!roomManager){
                const newRoom = {'roomKey':uuidv1(), 'playerCount':1}
                redis.hmset(req.cache, room, newRoom, 20)
                await inviteUser(req, newRoom, directives)
                resolve(newRoom)
            }
            else{
                /* reentrant */
                // If user is Exit and Re-enter during matching
                if(reEnterUserRoomKey==roomManager.roomKey){
                    // Reset user offset
                    const createdRoom = flatten.unflatten( await redis.hgetall(req.cache, reEnterUserRoomKey) )
                    const nowTime = new Date().getTime()
                    directives.audioItem.stream["offsetInMilliseconds"] = nowTime - createdRoom.firstEntryTime
                    resolve(false)
                }
                // If room is full, create the other room 
                else if(parseInt(roomManager.playerCount)==4){
                    const newRoom = {'roomKey':uuidv1(), 'playerCount':1}
                    redis.hmset(req.cache, room, newRoom, 20)
                    await inviteUser(req, newRoom, directives)
                    resolve(newRoom)
                }               
                
                // All other case
                else{
                    const ttl = await redis.getTTL(req.cache, room)
                    roomManager.playerCount = parseInt(roomManager.playerCount)+1
                    redis.hmset(req.cache, room, {'playerCount': roomManager.playerCount }, ttl)
                    await inviteUser(req, roomManager, directives)
                    resolve(roomManager)
                }
            }

            lock.unlock().then(()=>{
                console.log('redis is unlock')
            }).catch((err)=> {
                // Failed to release
                console.log(err)
                reject("reject")
            })              
        }).catch((err)=> {
            console.log(err)
            reject("reject")
        });
    })        
}

function inviteUser(req, newRoom, directives){
    return new Promise(async (resolve,reject)=>{   
        
        const userSetting = JSON.parse(process.env.userSetting)
        /* Give a 'room key' & 'player number' to user */   
        userSetting.roomKey = newRoom.roomKey
        userSetting.player = newRoom.playerCount
        redis.hmset(req.cache, req.user.id.toString(), userSetting, req.expire)   

        // Room & User Setting
        const roomSetting = JSON.parse(process.env.roomSetting)            

        /* Invite users */ 
        if(newRoom.playerCount==1){
            // random choice background intro music
            const randomIntro = Math.floor(Math.random()*(3));
            let url
            switch (randomIntro) {
                case 0:
                    url = JSON.parse(process.env.URL).intro_mise
                    break;
                case 1:
                    url = JSON.parse(process.env.URL).intro_nugu
                    break;
                case 2:
                    url = JSON.parse(process.env.URL).intro_UFO
                    break;    
                default:
                    url = JSON.parse(process.env.URL).intro_mise
                    break;
            }
            roomSetting.player1 = req.user.id + "," + req.user.name
            roomSetting.firstEntryTime = new Date().getTime()
            roomSetting.playerCount = 1
            roomSetting.introMusic = url
            // offset setting for first user
            console.log(roomSetting)
            redis.hmset(req.cache, newRoom.roomKey, flatten(roomSetting), req.expire)
        }else{
            // from the second user
            const createdRoom = flatten.unflatten( await redis.hgetall(req.cache, newRoom.roomKey) )
            const nowTime = new Date().getTime()
            directives.audioItem.stream["offsetInMilliseconds"] = nowTime - createdRoom.firstEntryTime 
            createdRoom['player'+newRoom.playerCount] = req.user.id + "," + req.user.name
            createdRoom.playerCount = newRoom.playerCount
            redis.hmset(req.cache, newRoom.roomKey, flatten(createdRoom), req.expire)
            console.log(createdRoom)
        }
        
        resolve()
    })        
}

function saveUser(req){
    db.saveUser(req.user,(err,result)=>{
        if(err){
            console.log("err : ",req.user.id)
        }else{
            if(result){
                console.log("saved user :",req.user.id)
            }
        }
    })   
}