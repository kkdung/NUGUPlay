require("json-dotenv")(".config.json");
require("json-dotenv")("./controller/redisConfig.json");
require("dotenv").config({ path: "credential.env" });
const express = require("express");
const request = require("request");
const router = require("./router");
const redis = require("redis");
const client = redis.createClient();
client.auth(process.env.redisOAuth);
const Redlock = require("redlock");
const redlock = new Redlock([client], {
  driftFactor: 0.01, // the expected clock drift
  retryCount: 3, // the max number of times Redlock will attempt
  retryDelay: 200, // the time in ms between attempts
  retryJitter: 200 // the max time in ms randomly added to retries (to improve performance)
});
const app = express();
app.use(express.json());

app.use("/lastbread/health", (req, res) => {
  console.log("health request : ", req.headers);
  res.status(200);
  return res.send("OK");
});
app.use("/lastbread", async (req, res, next) => {
  const jsonObj = req.body;
  // Nugu request
  if (jsonObj.context) {
    console.log(jsonObj);
    console.log(jsonObj.context.supportedInterfaces);
    const authorization = req.headers.authorization.split(" ")[1];
    console.log(authorization);
    if (authorization != process.env.APIKEY) {
      console.log("authorization failed");
      res.status(401);
      return res.send("authorization failed");
    }
    console.log(jsonObj.action["actionName"]);
    // If accessToken is undefined
    if (!jsonObj.context.session["accessToken"]) {
      console.log("OAuth is not linked");
      const responseObj = JSON.parse(process.env.RESPONSE);
      responseObj.resultCode = JSON.parse(process.env.EXCEPTION).OAuth;
      return res.json(responseObj);
    } else {
      req.user = await getGoogleUserInfo(
        jsonObj.context.session["accessToken"]
      );
      if(!req.user){
        const responseObj = JSON.parse(process.env.RESPONSE);
        responseObj.resultCode = JSON.parse(process.env.EXCEPTION).OAuth_refresh;
        return res.json(responseObj);  
      }

      console.log("ID : ", req.user.id, ", NAME : " + req.user.name);
      req.cache = client;
      req.redlock = redlock;
      //req.expire =(60*60)*24*7
      req.expire = 60 * 60;
      next();
    }
  } else {
    console.log("bad request");
    res.status(404);
    return res.send("bad request");
  }
});

app.use("/lastbread", router);

app.listen(process.env.PORT, () => {
  console.log("port is " + process.env.PORT);
});

function getGoogleUserInfo(accessToken) {
  return new Promise((resolve, reject) => {
    const url = JSON.parse(process.env.URL).googleAPI;
    const options = { url: url + accessToken };
    request(options, async (error, response, body) => {
      if (error) throw error;
      console.log("get Google UserInfo complete! ");
      resolve(JSON.parse(body));
    });
  });
}
