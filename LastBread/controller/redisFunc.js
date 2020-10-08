

/* redis object set */
const hmset = (cache, key, obj, expire)=>{
    cache.hmset(key,obj,(err,data)=>{
        if(err){ 
            return err 
        }
        else{
            cache.expire(key,expire)         
        }  
    })       
}
/* redis all object get */
const hgetall = (cache, key)=>{
    return new Promise((resolve, reject)=>{        
        cache.hgetall(key,(err,data)=>{
            if(err){
                reject(err)
            }else{
                resolve(data)
            }
            
        })          
    }) 
}
/* redis specific field get */
const hmget = (cache, key, field)=>{
    return new Promise((resolve, reject)=>{
        cache.hmget(key,field,(err,data)=>{
            if(err){
                reject(err)
            }else{
                resolve(data[0])
            }            
        })
    }) 
}
/*중복x 배열*/
const sadd = (cache, key, arr, expire)=>{
    cache.sadd(key,arr,(err,data)=>{
        if(err){
            console.log(err)
            return err
        }else{
            console.log("sadd complete")
            cache.expire(key,expire)  
        }                 
    })       
}
const smembers = (cache, key)=>{
    return new Promise((resolve, reject)=>{
        cache.smembers(key,(err,data)=>{
            if(err){
                reject(err)
            }else{
                resolve(data)
            }
        })
    }) 
}

/*ttl*/
const getTTL = (cache, key) =>{
    return new Promise((resolve, reject)=>{
        cache.ttl(key,(err,data)=>{
            if(err){
                reject(err)
            }else{
                resolve(data)
            }            
        })
    }) 
}
module.exports = { hmset, hgetall ,hmget, sadd, smembers, getTTL }