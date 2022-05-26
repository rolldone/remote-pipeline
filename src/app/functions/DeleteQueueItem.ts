import { Job, Queue } from "bullmq";
import ProcessQueue from "../queues/ProcessQueue";
import ProcessScheduleQueue from "../queues/ProcessScheduleQueue";
import QueueRecordDetailService from "../services/QueueRecordDetailService";
import QueueRecordService from "../services/QueueRecordService";
import QueueSceduleService from "../services/QueueSceduleService";

export default async function (props: {
  queue_record_detail_id: any
}) {
  try {
    let {
      queue_record_detail_id
    } = props;
    let res_data_record_detail = await QueueRecordDetailService.getQueueRecordDetail({
      id: queue_record_detail_id
    })
    let _processQueue: Queue = null;
    let resDataInsert = null;
    console.log("res_data_record_detail.qrec_data :: ", res_data_record_detail.qrec_type)
    let jobs = null;
    switch (res_data_record_detail.qrec_type) {
      case QueueRecordService.TYPE.INSTANT:
        _processQueue = ProcessQueue({
          queue_name: res_data_record_detail.queue_name
        })
        _processQueue.remove(res_data_record_detail.job_id);
        // jobs = await _processQueue.getRepeatableJobs();
        // for (let i = 0; i < jobs.length; i++) {
        //   const job = jobs[i];
        //   if (res_data_record_detail.job_id == job.id) {
        //     await _processQueue.removeRepeatableByKey(job.key);
        //     break;
        //   }
        // }
        resDataInsert = await QueueRecordDetailService.updateQueueRecordDetail({
          id: queue_record_detail_id,
          queue_record_id: res_data_record_detail.qrec_id,
          queue_name: res_data_record_detail.queue_name,
          job_id: res_data_record_detail.job_id,
          job_data: res_data_record_detail.data,
          status: QueueRecordDetailService.STATUS.STOPPED
        });
        break;
      case QueueRecordService.TYPE.SCHEDULE:
        switch (res_data_record_detail.qrec_sch_schedule_type) {
          case QueueSceduleService.schedule_type.ONE_TIME_SCHEDULE:
            _processQueue = ProcessQueue({
              queue_name: res_data_record_detail.queue_name
            })
            _processQueue.remove(res_data_record_detail.job_id);
            // jobs = await _processQueue.getRepeatableJobs();
            // for (let i = 0; i < jobs.length; i++) {
            //   const job = jobs[i];
            //   if (res_data_record_detail.job_id == job.id) {
            //     await _processQueue.removeRepeatableByKey(job.key);
            //     break;
            //   }
            // }
            resDataInsert = await QueueRecordDetailService.updateQueueRecordDetail({
              id: queue_record_detail_id,
              queue_record_id: res_data_record_detail.qrec_id,
              queue_name: res_data_record_detail.queue_name,
              job_id: res_data_record_detail.job_id,
              job_data: res_data_record_detail.data,
              status: QueueRecordDetailService.STATUS.STOPPED
            });
            break;
          case QueueSceduleService.schedule_type.REPEATABLE:
            _processQueue = ProcessScheduleQueue({
              queue_name: res_data_record_detail.queue_name
            })
            let _resRepeatable = await _processQueue.getRepeatableJobs();
            jobs = await _processQueue.getRepeatableJobs();
            for (let i = 0; i < jobs.length; i++) {
              const job = jobs[i];
              if (res_data_record_detail.job_id == job.id) {
                await _processQueue.removeRepeatableByKey(job.key);
                break;
              }
            }
            resDataInsert = await QueueRecordDetailService.updateQueueRecordDetail({
              id: queue_record_detail_id,
              queue_record_id: res_data_record_detail.qrec_id,
              queue_name: res_data_record_detail.queue_name,
              job_id: res_data_record_detail.job_id,
              job_data: res_data_record_detail.data,
              status: QueueRecordDetailService.STATUS.STOPPED
            });
            break;
        }
        break;
    }
    // res.send(res_data_record_detail.queue_name + " with Job id : " + res_data_record_detail.job_id + " :: deleted!")
    return res_data_record_detail;
  } catch (ex) {
    throw ex;
  }

}