import ProcessQueue from "@root/app/queues/ProcessQueue";
import ProcessScheduleQueue from "@root/app/queues/ProcessScheduleQueue";
import ExecutionService, { ExecutionServiceInterface } from "@root/app/services/ExecutionService";
import HostService from "@root/app/services/HostService";
import QueueRecordDetailService from "@root/app/services/QueueRecordDetailService";
import QueueRecordService, { QueueRecordInterface } from "@root/app/services/QueueRecordService";
import QueueSceduleService from "@root/app/services/QueueSceduleService";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import AppConfig from "@root/config/AppConfig";
import { QueueRequestInterface } from "@root/routes/v1/cli";
import { Moment } from "@root/tool";
import { FlowProducer, Job, Queue, Worker } from "bullmq";
import { existsSync, readFileSync } from "fs";
import UserService, { UserServiceInterface } from "../services/UserService";
import VariableService, { variableInterface } from "../services/VariableService";
import upath from 'upath';
import filendir from 'filendir';
import GroupQueue from "../queues/GroupQueue";

declare let masterData: MasterDataInterface

const CreateQueueGroup = function (props: {
  id: number
  process_mode: string
  process_limit: number
  queue_name: string
  delay: number
  variable?: variableInterface
  variable_extra?: any
  execution?: ExecutionServiceInterface
}) {
  let {
    id,
    process_mode,
    process_limit,
    queue_name,
    delay,
    variable,
    execution,
    variable_extra
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

          if (execution == null) {
            // Second get the execution
            execution = await ExecutionService.getExecution({
              id: resQueueRecord.execution_id
            });
          }

          if (variable == null) {
            // Get variable
            variable = await VariableService.getVariable({
              id: execution.variable_id,
              variable_item_name: execution.variable_option
            })
          }

          switch (true) {
            case execution == null:
            case resQueueRecord == null:
              // case variable == null:
              return reject("The queue record or execution is not required");
          }

          // Get var data
          if (variable == null) {
            variable = {
              data: [],
              schema: {}
            };
          }

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

          let _processQueue: Queue = null;
          let indexHostItem = 0;
          let idJOb = null;
          let theJOb : Job<any, any, string> = null;
          switch (resQueueRecord.type) {
            case QueueRecordService.TYPE.INSTANT:
              _processQueue = ProcessQueue({
                queue_name: queue_name
              })
              idJOb = (Math.random() + 1).toString(36).substring(7);


              // copyAssetToJobAsset(idJOb, variable);

              theJOb = await _processQueue.add("host_" + idJOb + "_group", {
                queue_record_id: id,
                job_id: idJOb,
                index: indexHostItem,
                extra: variable_extra
              }, {
                jobId: idJOb,//id + "-" + resQueueRecords.exe_host_ids[a],
                // timeout: 5000,
                delay: delay
              })

              
              
              // Insert to queue record detail 
              // let resDataInsert = await QueueRecordDetailService.addQueueRecordDetail({
              //   queue_record_id: id,
              //   queue_name: theJOb.queueName,
              //   job_id: idJOb,
              //   job_data: theJOb.data,
              //   status: QueueRecordDetailService.STATUS.RUNNING,
              //   // planning also record
              //   variable,
              //   execution,
              //   variable_extra
              // });

              // indexHostItem += 1;
              // copyAssetToJobAsset(idJOb, variable);

              // let originalTree = await _processQueue.add({
              //   name: '',
              //   queue_record_id: id,
              //   host_id: _hosts_datas[a].id,
              //   job_id: idJOb,
              //   index: indexHostItem,
              //   total: _total_host_item,
              //   host_data: hostDataItem,
              //   extra: variable_extra
              // }, {
              //   jobId: idJOb,//id + "-" + resQueueRecords.exe_host_ids[a],
              //   // timeout: 5000,
              //   delay: delay
              // });

              // Insert to queue record detail 
              let resDataInsert = await QueueRecordDetailService.addQueueRecordDetail({
                queue_record_id: id,
                queue_name: theJOb.queueName,
                job_id: idJOb,
                job_data: theJOb.data,
                status: QueueRecordDetailService.STATUS.RUNNING,
                // planning also record
                variable,
                execution,
                variable_extra
              });

              indexHostItem += 1;
              break;
            case QueueRecordService.TYPE.SCHEDULE:
              // let qrec_sch_data = resQueueRecord.qrec_sch_data;
              // let _repeat = null;
              // let _delay = 3000;
              // switch (qrec_sch_data.schedule_type) {
              //   case QueueSceduleService.schedule_type.REPEATABLE:
              //     _processQueue = ProcessScheduleQueue({
              //       queue_name: queue_name,
              //       process_limit: 1 // process_limit
              //     });
              //     /**
              //      * For this queue delete first and create new one
              //      */
              //     let _existJObs = await _processQueue.getRepeatableJobs();
              //     for (var a234 = 0; a234 < _existJObs.length; a234++) {
              //       const job = _existJObs[a234];
              //       await _processQueue.removeRepeatableByKey(job.key);
              //     }
              //     await _processQueue.drain();
              //     let user: UserServiceInterface = await UserService.getUser({
              //       id: resQueueRecord.exe_user_id
              //     })
              //     _repeat = {
              //       cron: `${qrec_sch_data.minute} ${qrec_sch_data.hour} ${qrec_sch_data.day} ${qrec_sch_data.month} ${qrec_sch_data.weekday}`,
              //       tz: user.timezone || AppConfig.TIMEZONE
              //     };
              //     break;
              //   case QueueSceduleService.schedule_type.ONE_TIME_SCHEDULE:
              //     _processQueue = ProcessQueue({
              //       queue_name: queue_name
              //     });
              //     let _startDate = Moment();
              //     let _endDate = Moment(qrec_sch_data.date + " " + qrec_sch_data.time, "YYYY-MM-DD HH:mm:ss");
              //     _delay = _endDate.diff(_startDate, "milliseconds");
              //     console.log("_timeout :: ", _delay);
              //     break;
              // }
              // for (let a = 0; a < _hosts_datas.length; a++) {
              //   for (let b = 0; b < _hosts_datas[a].data.length; b++) {
              //     let hostDataItem = _hosts_datas[a].data[b];
              //     idJOb = (Math.random() + 1).toString(36).substring(7);

              //     // copyAssetToJobAsset(idJOb, variable);

              //     // Repeatable is different, you cannot keep fixed the jobId it still create new every loop
              //     theJOb = await _processQueue.add("host_" + hostDataItem.ip_address, {
              //       queue_record_id: id,
              //       host_id: _hosts_datas[a].id,
              //       index: indexHostItem,
              //       job_id: idJOb,
              //       total: _total_host_item,
              //       host_data: hostDataItem,
              //       schedule_type: qrec_sch_data.schedule_type,
              //       extra: variable_extra
              //     }, {
              //       // jobId: id + "-" + resQueueRecords.exe_host_ids[a],
              //       jobId: idJOb,
              //       delay: _delay,
              //       repeat: _repeat,

              //     });
              //     // console.log("theJOB ::: ", theJOb.);
              //     // Insert to queue record detail 
              //     let resDataInsert = await QueueRecordDetailService.addQueueRecordDetail({
              //       queue_record_id: id,
              //       queue_name: theJOb.queueName,
              //       job_id: idJOb,
              //       job_data: theJOb.data,
              //       status: QueueRecordDetailService.STATUS.RUNNING,
              //       // planning also record
              //       variable,
              //       execution,
              //       variable_extra
              //     });

              //     indexHostItem += 1;
              //   }
              // }
              break;
          }
        }
      })
    } catch (ex) {
      reject(ex);
    }
  })
}

export default CreateQueueGroup;