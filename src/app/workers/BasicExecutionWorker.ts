
import { Job, Worker } from "bullmq";
import { onActive, onComplete, onFailed } from "../functions/QueueEvent";
import PipelineLoop from "../functions/PipelineLoop";
import SafeValue from "../functions/base/SafeValue";

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
        job_id,
        extra
      } = job.data;

      let resPipelineLoop = await PipelineLoop({ queue_record_id, host_id, host_data, job_id, extra });
      if (resPipelineLoop == false) {
        console.log(`Job ${job_id} is now canceled; Because some requirement data get null. Maybe some data get deleted?`);
        return 'failed';
      }
    } catch (ex) {
      console.log(`BasicExecutionWorker - ${props.queue_name} - ex :: `, ex);
      return 'failed';
    }
    return 'done';
  }, {
    // autorun: false,
    concurrency: 1,
    connection: global.redis_bullmq,

    // prefix:"bullmq_"
  });

  queueEvents.on('drained', () => {
    // Queue is drained, no more jobs left
    console.log(`Queue ${props.queue_name} is drained, no more jobs left`);
  });

  queueEvents.on('active', (job) => {
    let {
      host_data,
      host_id,
      queue_record_id,
      job_id,
      extra
    } = job.data;

    console.log(`Job ${job_id} alias from ${job.id} is now active; previous status was ${job_id}`);
    onActive({ job });
  });

  queueEvents.on('completed', async (job) => {

    let {
      host_data,
      host_id,
      queue_record_id,
      job_id,
      extra
    } = job.data;

    console.log(`${job_id} alias from ${job.id} has completed and returned ${job.returnvalue}`);
    await job.remove();
    onComplete({ job });
  });

  queueEvents.on('failed', async (job) => {

    let {
      host_data,
      host_id,
      queue_record_id,
      job_id,
      extra
    } = job.data;

    console.log(`${job_id} alias from ${job.id} has failed with reason ${job.failedReason}`);
    onFailed({ job });
  });
  return queueEvents;
}

export default BasicExecutionWorker;