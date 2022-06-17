import ProcessQueue from "@root/app/queues/ProcessQueue";
import ProcessScheduleQueue from "@root/app/queues/ProcessScheduleQueue";
import ExecutionService from "@root/app/services/ExecutionService";
import HostService from "@root/app/services/HostService";
import QueueRecordDetailService from "@root/app/services/QueueRecordDetailService";
import QueueRecordService, { QueueRecordInterface } from "@root/app/services/QueueRecordService";
import QueueSceduleService from "@root/app/services/QueueSceduleService";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { QueueRequestInterface } from "@root/routes/v1/cli";
import { Moment } from "@root/tool";
import { Queue, Worker } from "bullmq";

declare let masterData: MasterDataInterface

const CreateQueue = function (props: {
  id: number
  data: any
  process_mode: string
  process_limit: number
  queue_name: string
  delay: number
}) {

  let {
    id,
    data,
    process_mode,
    process_limit,
    queue_name,
    delay
  } = props;
  console.log("props :: ", props);
  return new Promise((resolve: Function, reject: Function) => {
    try {

      masterData.saveData("queue.request." + process_mode, <QueueRequestInterface>{
        queue_name,
        process_limit: process_limit,
        callback: async (worker: Worker) => {
          if (worker.isRunning() == false) {
            worker.resume();
          }
          console.log("worker.isRunning() ::: ", worker.isRunning());

          // Get queue record by id
          let resQueueRecord: QueueRecordInterface = await QueueRecordService.getQueueRecord({
            id: id
          });

          console.log("resQueueRecord ::: ", resQueueRecord);
          if (resQueueRecord == null) {
            resolve(resQueueRecord);
            return
          }

          await QueueRecordService.updateQueueRecord({
            id: resQueueRecord.id,
            status: QueueRecordService.STATUS.READY
          });

          // Give callback for caller
          resolve(resQueueRecord);

          // Get the host datas
          let _hosts_datas: Array<any> = await HostService.getHosts({
            ids: resQueueRecord.exe_host_ids
          })

          let _total_host_item = 0;
          _hosts_datas.filter((el) => {
            _total_host_item += el.data.length;
            return el;
          })

          let _processQueue: Queue = null;
          let indexHostItem = 0;
          switch (resQueueRecord.type) {
            case QueueRecordService.TYPE.INSTANT:
              _processQueue = ProcessQueue({
                queue_name: queue_name
              })
              for (let a = 0; a < _hosts_datas.length; a++) {
                for (let b = 0; b < _hosts_datas[a].data.length; b++) {
                  let hostDataItem = _hosts_datas[a].data[b];
                  let idJObInstant = (Math.random() + 1).toString(36).substring(7);
                  let theJOb = await _processQueue.add("host_" + idJObInstant + "_" + hostDataItem.ip_address, {
                    queue_record_id: id,
                    host_id: _hosts_datas[a].id,
                    job_id: idJObInstant,
                    index: indexHostItem,
                    total: _total_host_item,
                    host_data: hostDataItem,
                    extra: data
                  }, {
                    jobId: idJObInstant,//id + "-" + resQueueRecords.exe_host_ids[a],
                    // timeout: 5000,
                    delay: delay
                  });

                  // Insert to queue record detail 
                  let resDataInsert = await QueueRecordDetailService.addQueueRecordDetail({
                    queue_record_id: id,
                    queue_name: theJOb.queueName,
                    job_id: idJObInstant,
                    job_data: theJOb.data,
                    status: QueueRecordDetailService.STATUS.RUNNING,
                  });

                  indexHostItem += 1;
                }
              }
              break;
            case QueueRecordService.TYPE.SCHEDULE:
              let qrec_sch_data = resQueueRecord.qrec_sch_data;
              let _repeat = null;
              let _delay = 3000;
              switch (qrec_sch_data.schedule_type) {
                case QueueSceduleService.schedule_type.REPEATABLE:
                  _processQueue = ProcessScheduleQueue({
                    queue_name: queue_name,
                    process_limit: 1 // process_limit
                  });
                  _repeat = {
                    cron: `${qrec_sch_data.minute} ${qrec_sch_data.hour} ${qrec_sch_data.day} ${qrec_sch_data.month} ${qrec_sch_data.weekday}`
                  };
                  break;
                case QueueSceduleService.schedule_type.ONE_TIME_SCHEDULE:
                  _processQueue = ProcessQueue({
                    queue_name: queue_name
                  });
                  let _startDate = Moment();
                  let _endDate = Moment(qrec_sch_data.date + " " + qrec_sch_data.time, "YYYY-MM-DD HH:mm:ss");
                  _delay = _endDate.diff(_startDate, "milliseconds");
                  console.log("_timeout :: ", _delay);
                  break;
              }
              console.log("resQueueRecord :: ", resQueueRecord);
              for (let a = 0; a < _hosts_datas.length; a++) {
                for (let b = 0; b < _hosts_datas[a].data.length; b++) {
                  let hostDataItem = _hosts_datas[a].data[b];
                  let idJobSchedule = (Math.random() + 1).toString(36).substring(7);
                  // Repeatable is different, you cannot keep fixed the jobId it still create new every loop
                  let theJOb = await _processQueue.add("host_" + hostDataItem.ip_address, {
                    queue_record_id: id,
                    host_id: _hosts_datas[a].id,
                    index: indexHostItem,
                    job_id: idJobSchedule,
                    total: _total_host_item,
                    host_data: hostDataItem,
                    schedule_type: qrec_sch_data.schedule_type,
                    extra: data
                  }, {
                    // jobId: id + "-" + resQueueRecords.exe_host_ids[a],
                    jobId: idJobSchedule,
                    delay: _delay,
                    repeat: _repeat
                  });
                  // console.log("theJOB ::: ", theJOb.);
                  // Insert to queue record detail 
                  let resDataInsert = await QueueRecordDetailService.addQueueRecordDetail({
                    queue_record_id: id,
                    queue_name: theJOb.queueName,
                    job_id: idJobSchedule,
                    job_data: theJOb.data,
                    status: QueueRecordDetailService.STATUS.RUNNING,
                  });

                  indexHostItem += 1;
                }
              }
              break;
          }
        }
      })
    } catch (ex) {
      reject(ex);
    }
  })
}

export default CreateQueue;