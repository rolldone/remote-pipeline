import { Job, Worker } from "bullmq";
import { onActive, onComplete, onFailed } from "../functions/QueueEvent";
import PipelineLoop from "../functions/PipelineLoop";
import { BasicExecutionWorkerInterface } from "./BasicExecutionWorker";
import SafeValue from "../functions/base/SafeValue";

export interface ParallelExecutionWorkerInterface extends BasicExecutionWorkerInterface {
  process_limit?: number
}

const ParallelExecutionWorker = function (props: ParallelExecutionWorkerInterface) {
  let queueEvents = new Worker(props.queue_name, async (job: Job) => {
    try {
      console.log("job ::: ", job.data);
      let {
        host_data,
        host_id,
        queue_record_id,
        extra,
        job_id
      } = job.data;

      let resPipelineLoop = await PipelineLoop({ queue_record_id, host_id, host_data, job_id: job_id, extra });
      if (resPipelineLoop == false) {
        console.log(`Job ${job_id} alias from ${job.id} is now canceled; Because some requirement data get null. Maybe some data get deleted?`);
      }
    } catch (ex) {
      console.log(`ParallelExecutionWorker - ${props.queue_name} - ex :: `, ex);
      return 'failed';
    }
    return 'done';
  }, {
    // autorun: false,
    concurrency: SafeValue(props.process_limit, 1),
    connection: global.redis_bullmq
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
    job.remove();
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

export default ParallelExecutionWorker;