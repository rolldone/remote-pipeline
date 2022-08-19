import { Queue, QueueScheduler } from "bullmq";

const processQueue: {
  [key: string]: {
    queue: Queue,
    schedule: QueueScheduler
  }
} = {};
export default function (props) {
  let _queue: Queue = null;
  if (processQueue[props.queue_name] == null) {
    console.log("new webhhook queue")
    const myQueueScheduler = new QueueScheduler(props.queue_name, {
      connection: global.redis_bullmq,
      // prefix: "bullmq_",
    });
    _queue = new Queue(props.queue_name, {
      connection: global.redis_bullmq,
      // prefix: "bullmq_",
      defaultJobOptions: {
        removeOnComplete: true, removeOnFail: true,
        timeout: 60000
      }
    })
    processQueue[props.queue_name] = {
      queue: _queue,
      schedule: myQueueScheduler
    };
  } else {
    _queue = processQueue[props.queue_name].queue;
    console.log("exist webhhook queue")
  }
  return _queue;
}