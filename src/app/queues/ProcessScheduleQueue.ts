import { Queue, /* QueueScheduler */ } from "bullmq";

const processQueStore: {
  [key: string]: {
    queue: Queue,
    // schedule: QueueScheduler
  }
} = {};

const ProcessScheduleQueue = function (props) {
  let _queue: Queue = null;
  if (processQueStore[props.queue_name] == null) {
    console.log("new ProcessScheduleQueue queue")
    // const myQueueScheduler = new QueueScheduler(props.queue_name, {
    //   connection: global.redis_bullmq,
    //   // prefix: "bullmq_",
    // });
    _queue = new Queue(props.queue_name, {
      connection: global.redis_bullmq,
      // prefix: "bullmq_",
      defaultJobOptions: {
        // removeOnComplete: true, removeOnFail: 1000
        removeOnComplete: true, removeOnFail: false,
      }
    });
    processQueStore[props.queue_name] = {
      queue: _queue,
      // schedule: myQueueScheduler
    };
  } else {
    console.log("exist ProcessScheduleQueue queue")
    _queue = processQueStore[props.queue_name].queue;
  }

  return _queue;
}

export const deleteProcessScheduleQueue = async (queueName: string) => {
  if (processQueStore[queueName] != null) {
    // let queue = processQueStore[queueName].queue;
    // await queue.clean(0, 'delayed');
    // await queue.clean(0, 'wait');
    // await queue.clean(0, 'active');
    // await queue.clean(0, 'completed');
    // await queue.clean(0, 'failed');
    await processQueStore[queueName].queue.close();
    // await processQueStore[queueName].schedule.close();
    delete processQueStore[queueName];
  }
}

export default ProcessScheduleQueue;