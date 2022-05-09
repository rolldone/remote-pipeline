import RedisConfig from "@root/config/RedisConfig";
const redisClient = require('redis');

const appConfig = {
  port: RedisConfig.port,
  host: RedisConfig.host,
  auth: RedisConfig.auth,
  prefix: "data",
  db: 0,
  no_ready_check: true,
};


export default function (next: Function) {
  let redisConnect = redisClient.createClient({
    url: `redis://:${appConfig.auth}@${appConfig.host}:${appConfig.port}`
    // port: appConfig.port,
    // host: appConfig.host,
    // auth: appConfig.auth,
    // no_ready_check: appConfig.no_ready_check,
    // db: appConfig.db,
    // prefix: appConfig.prefix,
    // detect_buffers: true,
    // return_buffers: true
  });
  redisConnect.on('connect', () => {
    // this will throw all errors nohm encounters - not recommended
    global.redis = redisConnect
    // example code goes here!
     
  })
  next(); 
}