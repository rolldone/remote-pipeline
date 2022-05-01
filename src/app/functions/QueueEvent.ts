import sqlbricks from "@root/tool/SqlBricks";
import { Job } from "bullmq";
import QueueRecordDetailService from "../services/QueueRecordDetailService";
import { QueueRecordStatus } from "../services/QueueRecordService";
import QueueSceduleService from "../services/QueueSceduleService";
import { Knex } from "knex";

declare let db: Knex;

export const onComplete = async (props: {
  job: Job
}) => {
  let {
    job
  } = props;
  let queryUpdate = sqlbricks.update("queue_record_details", {
    status: QueueRecordDetailService.STATUS.COMPLETED
  }).where({
    job_id: job.id
  }).toString();
  await db.raw(queryUpdate.toString());
  // If last process
  if ((job.data.total - 1) == job.data.index) {
    let _schedule_type = job.data.schedule_type;
    switch (_schedule_type) {
      case QueueSceduleService.schedule_type.REPEATABLE:
        queryUpdate = sqlbricks.update("queue_records", {
          status: QueueRecordStatus.READY
        }).where({
          id: job.data.queue_record_id
        }).toString();
        break;
      case QueueSceduleService.schedule_type.ONE_TIME_SCHEDULE:
      default:
        queryUpdate = sqlbricks.update("queue_records", {
          status: QueueRecordStatus.COMPLETED
        }).where({
          id: job.data.queue_record_id
        }).toString();
        break;
    }
    console.log("queryUpdate :: ", queryUpdate.toString());
    await db.raw(queryUpdate.toString());
  }
}

export const onActive = (props: {
  job: Job
}) => {
  let {
    job
  } = props;
  // Use set timeout for waiting complete on conCOmplete event on repeatable queue
  setTimeout(async () => {
    let queryUpdate = sqlbricks.update("queue_record_details", {
      status: QueueRecordDetailService.STATUS.RUNNING
    }).where({
      job_id: job.id
    }).toString();
    await db.raw(queryUpdate.toString());
  }, 3000);

}

export const onFailed = async (props: {
  job: Job
}) => {
  let {
    job
  } = props;
  let queryUpdate = sqlbricks.update("queue_record_details", {
    status: QueueRecordDetailService.STATUS.FAILED
  }).where({
    job_id: job.id
  }).toString();
  await db.raw(queryUpdate.toString());
  // If last process
  if ((job.data.total - 1) == job.data.index) {
    let _schedule_type = job.data.schedule_type;
    switch (_schedule_type) {
      case QueueSceduleService.schedule_type.REPEATABLE:
        queryUpdate = sqlbricks.update("queue_records", {
          status: QueueRecordStatus.FAILED
        }).where({
          id: job.data.queue_record_id
        }).toString();
        break;
      case QueueSceduleService.schedule_type.ONE_TIME_SCHEDULE:
      default:
        queryUpdate = sqlbricks.update("queue_records", {
          status: QueueRecordStatus.FAILED
        }).where({
          id: job.data.queue_record_id
        }).toString();
        break;
    }
    await db.raw(queryUpdate.toString());
  }
}