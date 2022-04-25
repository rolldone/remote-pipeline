
import SqlBricks from "@root/tool/SqlBricks";
import { Job, Worker } from "bullmq";
import { Knex } from "knex";
import { QueueRecordStatus } from "../services/QueueRecordService";
import QueueRecordDetail from "../services/QueueRecordDetailService";

declare let db: Knex;

export default function (props: any) {
  const queueEvents = new Worker(props.queue_name, async (job: Job) => {
    try {
      console.log("job ::: ", job.data);
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
  });

  queueEvents.on('completed', async (job) => {
    console.log(`${job.id} has completed and returned ${job.returnvalue}`);
    job.remove();
    let sqlbricks = SqlBricks;
    let queryUpdate = sqlbricks.update("queue_record_details", {
      status: QueueRecordDetail.STATUS.COMPLETED
    }).where({
      job_id: job.id
    }).toString();
    await db.raw(queryUpdate.toString());
    // If last process
    if ((job.data.total - 1) == job.data.index) {
      queryUpdate = sqlbricks.update("queue_records", {
        status: QueueRecordStatus.COMPLETED
      }).where({
        id: job.data.queue_record_id
      }).toString();
      console.log("queryUpdate :: ", queryUpdate.toString());
      await db.raw(queryUpdate.toString());
    }
  });

  queueEvents.on('failed', async (job) => {
    console.log(`${job.id} has failed with reason ${job.failedReason}`);
    let sqlbricks = SqlBricks;
    let queryUpdate = sqlbricks.update("queue_record_details", {
      status: QueueRecordDetail.STATUS.FAILED
    }).where({
      job_id: job.id
    }).toString();
    await db.raw(queryUpdate.toString());
    // If last process
    if ((job.data.total - 1) == job.data.index) {
      queryUpdate = sqlbricks.update("queue_records", {
        status: QueueRecordStatus.FAILED
      }).where({
        id: job.data.queue_record_id
      }).toString();
      console.log("queryUpdate :: ", queryUpdate.toString());
      await db.raw(queryUpdate.toString());
    }
  });
  return queueEvents;
}