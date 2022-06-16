import sqlbricks from "@root/tool/SqlBricks";
import { Job } from "bullmq";
import QueueRecordDetailService, { QueueRecordDetailInterface } from "../services/QueueRecordDetailService";
import QueueRecordService, { QueueRecordStatus } from "../services/QueueRecordService";
import QueueSceduleService from "../services/QueueSceduleService";
import { Knex } from "knex";
import DeleteQueueItem from "./DeleteQueueItem";

declare let db: Knex;

export const onComplete = async (props: {
  job: Job
}) => {
  let {
    job
  } = props;

  console.log("Job onComplete :: ", job)

  let {
    job_id
  } = job.data;
  let qurateUpdateData: Array<QueueRecordDetailInterface> = await QueueRecordDetailService.updateQueueRecordDetailWhere({
    status: job.returnvalue == "failed" ? QueueRecordDetailService.STATUS.FAILED : QueueRecordDetailService.STATUS.COMPLETED
  }, {
    job_id: job_id
  });
  // If last process
  if ((job.data.total - 1) == job.data.index) {
    let _schedule_type = job.data.schedule_type;
    switch (_schedule_type) {
      case QueueSceduleService.schedule_type.REPEATABLE:

        // qurateUpdateData = await QueueRecordService.updateQueueRecord({
        //   status: QueueRecordStatus.READY,
        //   id: job.data.queue_record_id
        // });
        
        break;
      case QueueSceduleService.schedule_type.ONE_TIME_SCHEDULE:
      default:
        await DeleteQueueItem({
          index: 0,
          length: 1,
          queue_record_id: qurateUpdateData[0].qrec_id,
          queue_record_detail_id: qurateUpdateData[0].id,
          queue_record_status: QueueRecordService.STATUS.COMPLETED,
          queue_record_detail_status: qurateUpdateData[0].status
        });
        break;
    }
  }
}

export const onActive = async (props: {
  job: Job
}) => {
  let {
    job
  } = props;

  console.log("Job onActive :: ", job)

  setTimeout(async () => {
    let {
      job_id,
      queue_record_id
    } = job.data;
    let res_data_record_detail: QueueRecordDetailInterface = await QueueRecordDetailService.getQueueRecordDetailByJobId(job_id, queue_record_id)
    // Use set timeout for waiting complete on conCOmplete event on repeatable queue
    switch (res_data_record_detail.status) {
      case QueueRecordDetailService.STATUS.FAILED:
      case QueueRecordDetailService.STATUS.COMPLETED:
      case QueueRecordDetailService.STATUS.STOPPED:
      case QueueRecordDetailService.STATUS.DELAYED:
        return;
    }
    console.log("aaaaaaaaaaaaaaaaaaaaaa ::", res_data_record_detail);
    let queryUpdate = sqlbricks.update("queue_record_details", {
      status: QueueRecordDetailService.STATUS.RUNNING
    }).where({
      job_id: job_id
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
  let queryUpdate = null;

  let {
    job_id
  } = job.data;

  let qurateUpdateData: Array<QueueRecordDetailInterface> = await QueueRecordDetailService.updateQueueRecordDetailWhere({
    status: QueueRecordDetailService.STATUS.FAILED
  }, {
    job_id: job_id
  });

  await DeleteQueueItem({
    index: 0,
    length: 1,
    queue_record_id: qurateUpdateData[0].qrec_id,
    queue_record_detail_id: qurateUpdateData[0].id,
    queue_record_status: null,
    queue_record_detail_status: QueueRecordDetailService.STATUS.FAILED
  });

  // If last process
  if ((job.data.total - 1) == job.data.index) {
    let _schedule_type = job.data.schedule_type;
    switch (_schedule_type) {
      case QueueSceduleService.schedule_type.REPEATABLE:
      case QueueSceduleService.schedule_type.ONE_TIME_SCHEDULE:
      default:

        // qurateUpdateData = await QueueRecordService.updateQueueRecord({
        //   status: QueueRecordStatus.FAILED,
        //   id: job.data.queue_record_id
        // });
        break;
    }
  }
}