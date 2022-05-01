import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { Moment } from "@root/tool";
import { Worker } from "bullmq";
import ProcessQueue from "../queues/ProcessQueue";
import ProcessScheduleQueue from "../queues/ProcessScheduleQueue";
import QueueRecordDetailService from "../services/QueueRecordDetailService";
import QueueRecordService from "../services/QueueRecordService";
import QueueSceduleService from "../services/QueueSceduleService";

declare let masterData: MasterDataInterface

const oberserverPath = "queue.request.";
const oberserverPathGroup = "queue.request.flow.";

export default function (props: any) {

  let {
    queue_name,
    res_data_record_detail
  } = props;

  return new Promise((resolve: Function, reject: Function) => {
    try {
      masterData.saveData(oberserverPath + res_data_record_detail.exe_process_mode, {
        queue_name,
        data: res_data_record_detail.qrec_data,
        concurrency: res_data_record_detail.exe_process_limit,
        callback: async (worker: Worker) => {
          if (worker.isRunning() == false) {
            worker.resume();
          }

          let _processQueue = null;
          let theJOb = null;
          let resDataInsert = null;

          switch (res_data_record_detail.qrec_type) {
            case QueueRecordService.TYPE.INSTANT:

              _processQueue = ProcessQueue({
                queue_name: queue_name
              });

              theJOb = await _processQueue.add("host_" + res_data_record_detail.data.ip_address, {
                queue_record_id: res_data_record_detail.qrec_id,
                host_id: res_data_record_detail.data.host_id,
                index: 0,
                total: 1,
                host_data: res_data_record_detail.data.host_data
              }, {
                // jobId: id + "-" + resQueueRecords.exe_host_ids[a],
                timeout: 5000
              });

              resDataInsert = await QueueRecordDetailService.addQueueRecordDetail({
                queue_record_id: res_data_record_detail.qrec_id,
                queue_name: theJOb.queueName,
                job_id: theJOb.id,
                job_data: theJOb.data,
                status: QueueRecordDetailService.STATUS.RUNNING
              });

              break;
            case QueueRecordService.TYPE.SCHEDULE:
              _processQueue = ProcessScheduleQueue({
                queue_name: queue_name
              });

              let resQueueRecord = res_data_record_detail.qrec;

              let qrec_sch_data = resQueueRecord.qrec_sch_data;
              let _repeat = null;
              let _timeout = 5000;
              switch (qrec_sch_data.schedule_type) {
                case QueueSceduleService.schedule_type.REPEATABLE:
                  _repeat = {
                    cron: `${qrec_sch_data.minute} ${qrec_sch_data.hour} ${qrec_sch_data.day} ${qrec_sch_data.month} ${qrec_sch_data.weekday}`
                  };
                  break;
                case QueueSceduleService.schedule_type.ONE_TIME_SCHEDULE:
                  let _startDate = Moment();
                  let _endDate = Moment(qrec_sch_data.date + " " + qrec_sch_data.time, "YYYY-MM-DD HH:mm:ss");
                  _timeout = _endDate.diff(_startDate, "milliseconds");
                  break;
              }

              theJOb = await _processQueue.add("host_" + res_data_record_detail.data.ip_address, {
                queue_record_id: res_data_record_detail.qrec_id,
                host_id: res_data_record_detail.data.host_id,
                index: 0,
                total: 1,
                host_data: res_data_record_detail.data.host_data
              }, {
                // jobId: id + "-" + resQueueRecords.exe_host_ids[a],
                timeout: _timeout,
                repeat: _repeat
              });

              resDataInsert = await QueueRecordDetailService.addQueueRecordDetail({
                queue_record_id: res_data_record_detail.qrec_id,
                queue_name: theJOb.queueName,
                job_id: theJOb.id,
                job_data: theJOb.data,
                status: QueueRecordDetailService.STATUS.RUNNING
              });

              break;
          }

          // res.send(worker.name + " :: start running!")
          resolve(res_data_record_detail);
        }
      });
    } catch (ex) {
      reject(ex);
    }
  })
}