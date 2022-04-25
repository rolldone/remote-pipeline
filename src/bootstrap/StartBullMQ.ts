
import { QueueEvents } from 'bullmq';
import RedisConfig from "@root/config/RedisConfig";
import IORedis from 'ioredis';

export const redisConfig = {
  port: RedisConfig.port,
  host: RedisConfig.host,
  auth: RedisConfig.auth,
  prefix: "",
  db: 1,
  no_ready_check: true,
};

export default function (next: Function) {
  let redisConnect = new IORedis({
    password: redisConfig.auth,
    port: redisConfig.port,
    host: redisConfig.host,
    // no_ready_check: redisConfig.no_ready_check,
    db: redisConfig.db,
    // keyPrefix: redisConfig.prefix
  });

  redisConnect.on('connect', () => {
    // this will throw all errors nohm encounters - not recommended
    // global.redis_bullmq = redisConnect;
    // example code goes here!
  })
  global.redis_bullmq = redisConnect;
  const queueEvents = new QueueEvents("*", {
    connection: redisConnect
  });

  queueEvents.on('waiting', ({ jobId }) => {
    console.log(`A job with ID ${jobId} is waiting`);
  });

  queueEvents.on('active', ({ jobId, prev }) => {
    console.log(`Job ${jobId} is now active; previous status was ${prev}`);
  });

  queueEvents.on('completed', ({ jobId, returnvalue }) => {
    console.log(`${jobId} has completed and returned ${returnvalue}`);
  });

  queueEvents.on('failed', ({ jobId, failedReason }) => {
    console.log(`${jobId} has failed with reason ${failedReason}`);
  });

  queueEvents.on('progress', ({ jobId, data }, timestamp) => {
    console.log(`${jobId} reported progress ${data} at ${timestamp}`);
  });

  next();
}