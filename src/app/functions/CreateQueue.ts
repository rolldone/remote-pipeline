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
import { Queue, Worker } from "bullmq";
import { existsSync, readFileSync } from "fs";
import UserService, { UserServiceInterface } from "../services/UserService";
import VariableService, { variableInterface } from "../services/VariableService";
import upath from 'upath';
import filendir from 'filendir';
import CreateUUID from "./base/CreateUUID";
import PipelineService from "../services/PipelineService";
import TokenDataService, { TOPIC } from "../services/TokenDataService";

declare let masterData: MasterDataInterface

const CreateQueue = function (props: {
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

          const copyAssetToJobAsset = (job_id: string, variable: variableInterface) => {
            let readFile = null;
            let _path = null;
            // Move asset to job_id if any
            for (let a = 0; a < variable.data.length; a++) {
              for (let a2 = 0; a2 < variable.data[a].datas.length; a2++) {
                if (variable.data[a].datas[a2].type == "input-asset") {
                  for (let a3 = 0; a3 < variable.data[a].datas[a2].attachment_datas.length; a3++) {
                    let _file = variable.data[a].datas[a2].attachment_datas[a3];

                    if (typeof _file === 'string' || _file instanceof String) {
                      // If String
                    } else {
                      // If array
                      _file = _file.file[0];
                      _path = upath.normalize(process.cwd() + "/storage/app/variables/" + variable.id + '/' + _file.originalname);
                      if (existsSync(_path) == true) {
                        readFile = readFileSync(_path);
                        filendir.writeFileSync(upath.normalize(process.cwd() + "/storage/app/jobs/" + job_id + "/" + _file.originalname), readFile);
                      }
                    }
                  }
                }
              }
            }
            for (let a = 0; a < variable.schema.length; a++) {
              if (variable.schema[a].type == "input-asset") {
                for (let a3 = 0; a3 < variable.schema[a].attachment_datas.length; a3++) {
                  let _file = variable.schema[a].attachment_datas[a3];

                  if (typeof _file === 'string' || _file instanceof String) {
                    // If String

                  } else {
                    // If array
                    _file = _file.file[0];
                    _path = upath.normalize(process.cwd() + "/storage/app/variables/" + variable.id + '/' + _file.originalname);
                    if (existsSync(_path) == true) {
                      readFile = readFileSync(_path);
                      filendir.writeFileSync(upath.normalize(process.cwd() + "/storage/app/jobs/" + job_id + "/" + _file.originalname), readFile);
                    }
                  }
                }
              }
            }
          }

          if (resQueueRecord == null) {
            resolve({
              queue_record: resQueueRecord
            });
            return
          }

          await QueueRecordService.updateQueueRecord({
            id: resQueueRecord.id,
            status: QueueRecordService.STATUS.READY
          });

          // Get the host datas
          let _hosts_datas: Array<any> = await HostService.getHosts({
            ids: resQueueRecord.exe_host_ids
          })

          let host_info = masterData.getData("host.info", {});
          for (let _hostI = 0; _hostI < _hosts_datas.length; _hostI++) {
            for (let _hostI2 = 0; _hostI2 < _hosts_datas[_hostI].data.length; _hostI2++) {
              let _hostDataItem = _hosts_datas[_hostI].data[_hostI2];
              switch (host_info[_hostDataItem.host + ":" + _hostDataItem.port]) {
                case 'up':
                  break;
                case 'down':
                  _hosts_datas[_hostI].data.splice(_hostI2, 1);
                  _hostI2--;
                  break;
                default:
                  break;
              }
            }
          }

          /**
           * Delete if status false
           */
          for (let _hostI = 0; _hostI < _hosts_datas.length; _hostI++) {
            for (let _hostI2 = 0; _hostI2 < _hosts_datas[_hostI].data.length; _hostI2++) {
              let _hostDataItem = _hosts_datas[_hostI].data[_hostI2];
              if (_hostDataItem.status == false) {
                _hosts_datas[_hostI].data.splice(_hostI2, 1);
                _hostI2--;
              }
            }
          }

          switch (resQueueRecord.exe_access_host_type) {
            case 'one_to_one':
              _hosts_datas = [_hosts_datas[Math.floor(Math.random() * _hosts_datas.length)]]
              break;
            case 'one_to_many':
            default:
              break;
          }

          switch (resQueueRecord.exe_access_host_type) {
            case 'one_to_one':
              if (_hosts_datas[0].data.length > 0) {
                _hosts_datas[0].data = [_hosts_datas[0].data[Math.floor(Math.random() * _hosts_datas[0].data.length)]]
              }
              break;
            case 'one_to_many':
            default:
              break;
          }

          let _total_host_item = 0;
          _hosts_datas.filter((el) => {
            _total_host_item += el.data.length;
            return el;
          })

          let queue_record_detail_datas = [];
          let _processQueue: Queue = null;
          let indexHostItem = 0;
          let idJOb = null;
          let theJOb = null;
          switch (resQueueRecord.type) {
            case QueueRecordService.TYPE.INSTANT:
              _processQueue = ProcessQueue({
                queue_name: queue_name
              })
              switch (execution.pip_connection_type) {
                case PipelineService.CONNECTION_TYPE.SSH:
                  for (let a = 0; a < _hosts_datas.length; a++) {
                    for (let b = 0; b < _hosts_datas[a].data.length; b++) {
                      let hostDataItem = _hosts_datas[a].data[b];
                      idJOb = CreateUUID();// (Math.random() + 1).toString(36).substring(7);

                      // copyAssetToJobAsset(idJOb, variable);

                      theJOb = await _processQueue.add("host_" + idJOb + "_" + hostDataItem.ip_address, {
                        queue_record_id: id,
                        host_id: _hosts_datas[a].id,
                        job_id: idJOb,
                        index: indexHostItem,
                        total: _total_host_item,
                        host_data: hostDataItem,
                        extra: variable_extra
                      }, {
                        jobId: idJOb,//id + "-" + resQueueRecords.exe_host_ids[a],
                        // timeout: 5000,
                        delay: delay
                      });

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

                      queue_record_detail_datas.push(resDataInsert);

                      indexHostItem += 1;
                    }
                  }
                  break;
                case PipelineService.CONNECTION_TYPE.BASIC:
                  idJOb = CreateUUID();// (Math.random() + 1).toString(36).substring(7);

                  // copyAssetToJobAsset(idJOb, variable);

                  theJOb = await _processQueue.add("host_" + idJOb + "_basic", {
                    queue_record_id: id,
                    host_id: null,
                    job_id: idJOb,
                    index: indexHostItem,
                    total: 1,
                    host_data: null,
                    extra: variable_extra
                  }, {
                    jobId: idJOb,//id + "-" + resQueueRecords.exe_host_ids[a],
                    // timeout: 5000,
                    delay: delay
                  });

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

                  queue_record_detail_datas.push(resDataInsert);

                  break;
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
                  /**
                   * For this queue delete first and create new one
                   */
                  let _existJObs = await _processQueue.getRepeatableJobs();
                  for (var a234 = 0; a234 < _existJObs.length; a234++) {
                    const job = _existJObs[a234];
                    await _processQueue.removeRepeatableByKey(job.key);
                  }
                  await _processQueue.drain();
                  let user: UserServiceInterface = await UserService.getUser({
                    id: resQueueRecord.exe_user_id
                  })
                  _repeat = {
                    cron: `${qrec_sch_data.minute} ${qrec_sch_data.hour} ${qrec_sch_data.day} ${qrec_sch_data.month} ${qrec_sch_data.weekday}`,
                    tz: user.timezone || AppConfig.TIMEZONE
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

              switch (execution.pip_connection_type) {
                case PipelineService.CONNECTION_TYPE.SSH:
                  for (let a = 0; a < _hosts_datas.length; a++) {
                    for (let b = 0; b < _hosts_datas[a].data.length; b++) {
                      let hostDataItem = _hosts_datas[a].data[b];
                      idJOb = CreateUUID(); // (Math.random() + 1).toString(36).substring(7);

                      // copyAssetToJobAsset(idJOb, variable);

                      // Repeatable is different, you cannot keep fixed the jobId it still create new every loop
                      theJOb = await _processQueue.add("host_" + hostDataItem.ip_address, {
                        queue_record_id: id,
                        host_id: _hosts_datas[a].id,
                        index: indexHostItem,
                        job_id: idJOb,
                        total: _total_host_item,
                        host_data: hostDataItem,
                        schedule_type: qrec_sch_data.schedule_type,
                        extra: variable_extra
                      }, {
                        // jobId: id + "-" + resQueueRecords.exe_host_ids[a],
                        jobId: idJOb,
                        delay: _delay,
                        repeat: _repeat,

                      });
                      // console.log("theJOB ::: ", theJOb.);
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


                      queue_record_detail_datas.push(resDataInsert);

                      indexHostItem += 1;
                    }
                  }
                  break;
                case PipelineService.CONNECTION_TYPE.BASIC:
                  idJOb = CreateUUID(); // (Math.random() + 1).toString(36).substring(7);
                  theJOb = await _processQueue.add("host_basic", {
                    queue_record_id: id,
                    host_id: null,
                    index: indexHostItem,
                    job_id: idJOb,
                    total: 1,
                    host_data: null,
                    schedule_type: qrec_sch_data.schedule_type,
                    extra: variable_extra
                  }, {
                    // jobId: id + "-" + resQueueRecords.exe_host_ids[a],
                    jobId: idJOb,
                    delay: _delay,
                    repeat: _repeat,

                  });
                  // console.log("theJOB ::: ", theJOb.);
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

                  queue_record_detail_datas.push(resDataInsert);

                  break;
              }
              break;
          }

          masterData.saveData("create-bull-board",{
            action : "add",
            queue: _processQueue
          });

          // Give callback for caller
          for (let oko = 0; oko < queue_record_detail_datas.length; oko++) {

            // Inser to token datas
            let resTokenData = await TokenDataService.addOrUpdate({
              // token: idJOb,
              topic: TOPIC.QUEUE_ITEM_PROCESS,
              data: {
                // Mandatory data
                identity_value: null,
                page_name: "queue_record_details",
                table_id: queue_record_detail_datas[oko].id,
                user_id: resQueueRecord.exe_user_id,
                auth_required: false,
                // Your business data
                id: queue_record_detail_datas[oko].id,
                pipeline_id: queue_record_detail_datas[oko].exe_pipeline_id,
                pipeline_item_ids: queue_record_detail_datas[oko].exe_pipeline_item_ids
              }
            });

            // This is for guest permission access
            queue_record_detail_datas[oko].token_guest = resTokenData.token;
            // queue_record_detail_datas[oko] = await QueueRecordDetailService.updateQueueRecordDetail(queue_record_detail_datas[oko]);
          }
          resolve({
            queue_record: resQueueRecord,
            queue_record_details: queue_record_detail_datas,
          });
        }
      })
    } catch (ex) {
      reject(ex);
    }
  })
}

export default CreateQueue;