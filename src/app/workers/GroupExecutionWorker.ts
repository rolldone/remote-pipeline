
import SqlBricks from "@root/tool/SqlBricks";
import { Job, Worker } from "bullmq";
import { Knex } from "knex";
import { QueueRecordStatus } from "../services/QueueRecordService";
declare let db: Knex;

const GroupExecutionWorker = function (props) {
  const queueEvents = new Worker(props.queue_name, async (job: Job) => {
    try {
      console.log("job ::: ", job);
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
    let query = sqlbricks.update("queue_records", {
      status: QueueRecordStatus.COMPLETED
    }).where({
      id: job.id
    })
    console.log("query :: ", query.toString());
    await db.raw(query.toString());
  });

  queueEvents.on('failed', (job) => {
    console.log(`${job.id} has failed with reason ${job.failedReason}`);
    let sqlbricks = SqlBricks;
    let query = sqlbricks.update("queue_records", {
      status: QueueRecordStatus.FAILED
    }).where({
      id: job.id
    })
    db.raw(query.toString());
  });
  return queueEvents;
}

export default GroupExecutionWorker;