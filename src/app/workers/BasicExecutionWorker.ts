
import SqlBricks from "@root/tool/SqlBricks";
import { Job, Worker } from "bullmq";
import { Knex } from "knex";
import { QueueRecordStatus } from "../services/QueueRecordService";
import QueueRecordDetail from "../services/QueueRecordDetailService";
import QueueSceduleService from "../services/QueueSceduleService";
import { onActive, onComplete, onFailed } from "../functions/QueueEvent";
import ConnectToHost from "../functions/ConnectOnSShPromise";
import PipelineLoop from "../functions/PipelineLoop";
import GetOsName from "../functions/GetOsName";

declare let db: Knex;

const BasicExecutionWorker = function (props: any) {
  const queueEvents = new Worker(props.queue_name, async (job: Job) => {
    try {
      console.log("job ::: ", job.data);
      let {
        host_data,
        host_id,
        queue_record_id,
        user_id
      } = job.data;
      let job_id = job.id;
      let resPipelineLoop = await PipelineLoop({ queue_record_id, host_id, host_data, user_id, job_id });
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