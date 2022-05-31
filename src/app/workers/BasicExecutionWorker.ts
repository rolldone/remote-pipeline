
import { Job, Worker } from "bullmq";
import { onActive, onComplete, onFailed } from "../functions/QueueEvent";
import PipelineLoop from "../functions/PipelineLoop";

export interface BasicExecutionWorkerInterface {
  queue_name?: string
}

const BasicExecutionWorker = function (props: BasicExecutionWorkerInterface) {
  const queueEvents = new Worker(props.queue_name, async (job: Job) => {
    try {
      console.log("job ::: ", job.data);
      let {
        host_data,
        host_id,
        queue_record_id,
      } = job.data;
      let job_id = job.id;
      let resPipelineLoop = await PipelineLoop({ queue_record_id, host_id, host_data, job_id });
      if (resPipelineLoop == false) {
        console.log(`Job ${job_id} is now canceled; Because some requirement data get null. Maybe some data get deleted?`);
      }
    } catch (ex) {
      console.log(`${props.queue_name} - ex :: `, ex);
      return 'failed';
    }
    return 'done';
  }, {
    // autorun: false,
    concurrency: 1,
    connection: global.redis_bullmq,
    // prefix:"bullmq_"
  });

  queueEvents.on('active', (job) => {
    console.log(`Job ${job.id} is now active; previous status was ${job.id}`);
    onActive({ job });
  });

  queueEvents.on('completed', async (job) => {
    console.log(`${job.id} has completed and returned ${job.returnvalue}`);
    job.remove();
    onComplete({ job });
  });

  queueEvents.on('failed', async (job) => {
    console.log(`${job.id} has failed with reason ${job.failedReason}`);
    onFailed({ job });
  });
  return queueEvents;
}

export default BasicExecutionWorker;