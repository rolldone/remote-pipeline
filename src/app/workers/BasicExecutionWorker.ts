
import SqlBricks from "@root/tool/SqlBricks";
import { Job, Worker } from "bullmq";
import { Knex } from "knex";
import { QueueRecordStatus } from "../services/QueueRecordService";
import QueueRecordDetail from "../services/QueueRecordDetailService";
import QueueSceduleService from "../services/QueueSceduleService";
import { onActive, onComplete, onFailed } from "../functions/QueueEvent";
import ConnectToHost from "../functions/ConnectToHost";

declare let db: Knex;

export default function (props: any) {
  const queueEvents = new Worker(props.queue_name, async (job: Job) => {
    try {
      console.log("job ::: ", job.data);
      let {
        host_data,
        host_id
      } = job.data;
      let resConnectData = await ConnectToHost({ host_data, host_id });
      console.log("resConnectData :: ", resConnectData);
      var test = () => {
        return new Promise((resolve: Function) => {
          setTimeout(() => {
            resolve();
          }, 2000 * parseInt(job.id));
        })
      }
      await test();
    } catch (ex) {
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