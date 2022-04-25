import RedisConfig from "@root/config/RedisConfig";

const appConfig = {
  port: RedisConfig.port,
  host: RedisConfig.host,
  auth: RedisConfig.auth,
  prefix: "data",
  db: 0,
  no_ready_check: true,
};

const redisClient = require('redis');

export default function (next: Function) {
  let redisConnect = redisClient.createClient({
    port: appConfig.port,
    host: appConfig.host,
    auth: appConfig.auth,
    no_ready_check: appConfig.no_ready_check,
    db: appConfig.db,
    prefix: appConfig.prefix,
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