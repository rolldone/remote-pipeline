import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { QueueRequestInterface } from "@root/routes/v1/cli";
import { Job, Queue, Worker } from "bullmq";
import ProcessQueue from "../queues/ProcessQueue";
import ProcessScheduleQueue from "../queues/ProcessScheduleQueue";
import QueueRecordDetailService, { QueueRecordDetailInterface } from "../services/QueueRecordDetailService";
import QueueRecordService, { QueueRecordInterface } from "../services/QueueRecordService";
import QueueSceduleService from "../services/QueueSceduleService";
import SafeValue from "./base/SafeValue";

declare let masterData: MasterDataInterface

const DeleteQueueItem = async function (props: {
  queue_record_id?: number
  queue_record_detail_id?: number
  index?: number
  length?: number,
  queue_record_status: number,
  queue_record_detail_status: number
}) {
  try {
    let {
      queue_record_id,
      queue_record_detail_id,
      index,
      length,
      queue_record_status,
      queue_record_detail_status
    } = props;

    let res_data_record_detail: QueueRecordDetailInterface = await QueueRecordDetailService.getQueueRecordDetail({
      id: queue_record_detail_id
    })


    if (index == length - 1) {
      let queueRecordData: QueueRecordInterface = await QueueRecordService.updateQueueRecord({
        id: queue_record_id,
        status: SafeValue(queue_record_status, null)
      })
    }

    if (res_data_record_detail == null) {
      return;
    }

    if (res_data_record_detail.status != QueueRecordDetailService.STATUS.RUNNING) {
      return;
    }

    let _processQueue: Queue = null;
    let resDataUpdate = null;
    console.log("DeleteQueueItem - queue_record_details data :: ", res_data_record_detail.qrec_type)

    switch (res_data_record_detail.qrec_type) {
      case QueueRecordService.TYPE.INSTANT:
        _processQueue = ProcessQueue({
          queue_name: res_data_record_detail.queue_name
        })
        // _processQueue.remove(res_data_record_detail.job_id);
        let jobs: Array<Job> = await _processQueue.getJobs();

        for (let i = 0; i < jobs.length; i++) {
          const job = jobs[i];
          if (res_data_record_detail.job_id == job.id) {
            console.log("DeleteQueueItem - found get job id to deleted :: ", job.id);
            try {
              _processQueue.remove(job.id);
              // await job.remove();
            } catch (ex) {
              console.log("Job removed not succesfully :: ", ex);
            }
            break;
          }
        }

        resDataUpdate = await QueueRecordDetailService.updateQueueRecordDetail({
          id: queue_record_detail_id,
          queue_record_id: res_data_record_detail.qrec_id,
          queue_name: res_data_record_detail.queue_name,
          job_id: res_data_record_detail.job_id,
          job_data: res_data_record_detail.data,
          status: SafeValue(queue_record_detail_status, QueueRecordDetailService.STATUS.STOPPED)
        });

        break;
      case QueueRecordService.TYPE.SCHEDULE:
        switch (res_data_record_detail.qrec_sch_schedule_type) {
          case QueueSceduleService.schedule_type.ONE_TIME_SCHEDULE:
            _processQueue = ProcessQueue({
              queue_name: res_data_record_detail.queue_name
            })
            // _processQueue.remove(res_data_record_detail.job_id);
            let re_jobs = await _processQueue.getRepeatableJobs();
            for (let i = 0; i < re_jobs.length; i++) {
              const job = re_jobs[i];
              if (res_data_record_detail.job_id == job.id) {
                console.log("DeleteQueueItem ::: found one time schedule job to deleted :: ", job);
                await _processQueue.removeRepeatableByKey(job.key);
                break;
              }
            }
            resDataUpdate = await QueueRecordDetailService.updateQueueRecordDetail({
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
            let re_jobs_re = await _processQueue.getRepeatableJobs();
            for (let i = 0; i < re_jobs_re.length; i++) {
              const job = re_jobs_re[i];
              await _processQueue.removeRepeatableByKey(job.key);
            }

            re_jobs_re = await _processQueue.getRepeatableJobs();
            for (let i = 0; i < re_jobs_re.length; i++) {
              const job = re_jobs_re[i];
              await _processQueue.removeRepeatable(job.name, job, job.id);
            }

            await _processQueue.drain(true);

            resDataUpdate = await QueueRecordDetailService.updateQueueRecordDetail({
              id: queue_record_detail_id,
              queue_record_id: res_data_record_detail.qrec_id,
              queue_name: res_data_record_detail.queue_name,
              job_id: res_data_record_detail.job_id,
              job_data: res_data_record_detail.data,
              status: SafeValue(queue_record_detail_status, QueueRecordDetailService.STATUS.STOPPED)
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

export default DeleteQueueItem;