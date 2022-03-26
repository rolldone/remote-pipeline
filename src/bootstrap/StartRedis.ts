const appConfig = {
  port : "",
  host : "",
  prefix : "",
  db: "",
  no_ready_check: "",
  
};
const redisClient = require('redis');

export default function (next: Function) {
  let redisConnect = redisClient.createClient({
    port: appConfig.port,
    host: appConfig.host,
    // auth: Env.REDIS_AUTH,
    no_ready_check: true,
    db : 0,
    prefix:'imgc_',
    // detect_buffers: true,
    // return_buffers: true
  });
  redisConnect.on('connect', () => {
    // this will throw all errors nohm encounters - not recommended
    global.redis = redisConnect;
    // example code goes here!
  })
  next();
}