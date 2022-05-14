import { Queue, QueueScheduler } from "bullmq";

export default function (props) {
  const myQueueScheduler = new QueueScheduler(props.queue_name, {
    connection: global.redis_bullmq,
    // prefix: "bullmq_",
  });
  let _queue = new Queue(props.queue_name, {
    connection: global.redis_bullmq,
    // prefix: "bullmq_",
    defaultJobOptions: {
      removeOnComplete: true, removeOnFail: 1000
    }
  })
  return _queue;
}