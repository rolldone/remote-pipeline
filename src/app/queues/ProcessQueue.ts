import { Queue, QueueScheduler } from "bullmq";
import { BasicExecutionWorkerInterface } from "../workers/BasicExecutionWorker";

const processQueStore: {
  [key: string]: {
    queue: Queue,
    schedule: QueueScheduler
  }
} = {};
const ProcessQueue = function (props: BasicExecutionWorkerInterface) {
  let _queue: Queue = null;
  if (processQueStore[props.queue_name] == null) {
    console.log("new ProcessQueue queue")
    const myQueueScheduler = new QueueScheduler(props.queue_name, {
      connection: global.redis_bullmq,
      // prefix: "bullmq_",
    });
    _queue = new Queue(props.queue_name, {
      connection: global.redis_bullmq,
      // prefix: "bullmq_",
      defaultJobOptions: {
        removeOnComplete: true, removeOnFail: true, // 1000
      }
    })
    processQueStore[props.queue_name] = {
      queue: _queue,
      schedule: myQueueScheduler
    };
  } else {
    console.log("exist ProcessQueue queue")
    _queue = processQueStore[props.queue_name].queue;
  }
  return _queue;
}

export const deleteProcessQueue = async (queue_name: string) => {
  if (processQueStore[queue_name] != null) {
    // let queue = processQueStore[queue_name].queue;
    // await queue.clean(0, 'delayed');
    // await queue.clean(0, 'wait');
    // await queue.clean(0, 'active');
    // await queue.clean(0, 'completed');
    // await queue.clean(0, 'failed');
    await processQueStore[queue_name].queue.close();
    await processQueStore[queue_name].schedule.close();
    delete processQueStore[queue_name];
  }
}

export default ProcessQueue;