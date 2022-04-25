import BaseController from "@root/base/BaseController"
import { Knex } from "knex"
import { Queue, QueueScheduler, Worker } from 'bullmq'
import { MasterDataInterface } from "@root/bootstrap/StartMasterData"
import GroupQueue from "@root/app/queues/GroupQueue"
import sqlbricks from "@root/tool/SqlBricks"
import ProcessQueue from "@root/app/queues/ProcessQueue"
import SqlBricks from "@root/tool/SqlBricks/sql-bricks"
import QueueRecordDetail from "@root/app/services/QueueRecordDetailService"
import QueueRecordDetailService from "@root/app/services/QueueRecordDetailService"
import QueueRecordService from "@root/app/services/QueueRecordService"
import HostService from "@root/app/services/HostService"

export interface QueueControllerInterface extends BaseControllerInterface {
  deleteQueueItem?: { (req: any, res: any): void }
  createQueueItem?: { (req: any, res: any): void }
  createQueue?: { (req: any, res: any): void }
  createQueueGroup?: { (req: any, res: any): void }
  deleteQueue?: { (req: any, res: any): void }
  updateQueue?: { (req: any, res: any): void }
  getQueues?: { (req: any, res: any): void }
  getQueue?: { (req: any, res: any): void }
}

declare let masterData: MasterDataInterface
declare let db: Knex;

const oberserverPath = "queue.request.";
const oberserverPathGroup = "queue.request.flow.";

export default BaseController.extend<QueueControllerInterface>({
  async deleteQueueItem(req, res) {
    try {
      let queue_record_detail_id = req.body.id;
      let res_data_record_detail = await QueueRecordDetailService.getQueueRecordDetail({
        id: queue_record_detail_id
      })
      let _processQueue = ProcessQueue({
        queue_name: res_data_record_detail.queue_name
      })
      _processQueue.remove(res_data_record_detail.job_id);
      let resDataInsert = await QueueRecordDetailService.updateQueueRecordDetail({
        id: queue_record_detail_id,
        queue_record_id: res_data_record_detail.qrec_id,
        queue_name: res_data_record_detail.queue_name,
        job_id: res_data_record_detail.job_id,
        job_data: res_data_record_detail.data,
        status: QueueRecordDetailService.STATUS.STOPPED
      });
      res.send(res_data_record_detail.queue_name + " with Job id : " + res_data_record_detail.job_id + " :: deleted!")
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async createQueueItem(req, res) {
    try {
      let queue_record_detail_id = req.body.id;

      let res_data_record_detail = await QueueRecordDetailService.getQueueRecordDetail({
        id: queue_record_detail_id
      })
      console.log('res_data_record_detail :: ', res_data_record_detail);
      let queue_name = "queue_" + res_data_record_detail.exe_process_mode + "_" + res_data_record_detail.qrec_id;

      masterData.saveData(oberserverPath + res_data_record_detail.exe_process_mode, {
        queue_name,
        data: res_data_record_detail.qrec_data,
        concurrency: res_data_record_detail.exe_process_limit,
        callback: async (worker: Worker) => {
          if (worker.isRunning() == false) {
            worker.resume();
          }

          res.send(worker.name + " :: start running!")
          let _processQueue = ProcessQueue({
            queue_name: queue_name
          })

          let theJOb = await _processQueue.add("host_" + res_data_record_detail.data.ip_address, {
            queue_record_id: res_data_record_detail.qrec_id,
            host_id: res_data_record_detail.data.host_id,
            index: 0,
            total: 1,
            host_data: res_data_record_detail.data.host_data
          }, {
            // jobId: id + "-" + resQueueRecords.exe_host_ids[a],
            timeout: 5000
          });

          let resDataInsert = await QueueRecordDetailService.addQueueRecordDetail({
            queue_record_id: res_data_record_detail.qrec_id,
            queue_name: theJOb.queueName,
            job_id: theJOb.id,
            job_data: theJOb.data,
            status: QueueRecordDetailService.STATUS.RUNNING
          });
        }
      });
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  /**
   * Call when create the execution
   * @param req 
   * @param res 
   * @returns 
   */
  async createQueue(req, res) {
    try {
      let id = req.body.id;
      let data = JSON.parse(req.body.data || "{}");
      let process_mode = req.body.process_mode;
      let process_limit = req.body.process_limit || 1;
      let queue_name = "queue_" + process_mode + "_" + id;
      masterData.saveData(oberserverPath + process_mode, {
        queue_name, data,
        concurrency: process_limit,
        callback: async (worker: Worker) => {
          if (worker.isRunning() == false) {
            worker.resume();
          }
          console.log("worker.isRunning() :: ", worker.isRunning());
          res.send(worker.name + " :: start running!")

          let resQueueRecord = await QueueRecordService.getQueueRecord({
            id: id
          });

          // Get the host datas
          let _hosts_datas: Array<any> = await HostService.getHosts({
            ids: resQueueRecord.exe_host_ids
          })

          let _total_host_item = 0;
          _hosts_datas.filter((el) => {
            _total_host_item += el.data.length;
            return el;
          })

          let _processQueue = ProcessQueue({
            queue_name: queue_name
          })

          let indexHostItem = 0;
          for (let a = 0; a < _hosts_datas.length; a++) {
            for (let b = 0; b < _hosts_datas[a].data.length; b++) {
              let hostDataItem = _hosts_datas[a].data[b];
              let theJOb = await _processQueue.add("host_" + hostDataItem.ip_address, {
                queue_record_id: id,
                host_id: _hosts_datas[a].id,
                index: indexHostItem,
                total: _total_host_item,
                host_data: hostDataItem
              }, {
                // jobId: id + "-" + resQueueRecords.exe_host_ids[a],
                timeout: 5000
              });

              // Insert to queue record detail 
              let resDataInsert = await QueueRecordDetailService.addQueueRecordDetail({
                queue_record_id: id,
                queue_name: theJOb.queueName,
                job_id: theJOb.id,
                job_data: theJOb.data,
                status: QueueRecordDetail.STATUS.RUNNING
              });

              indexHostItem += 1;
            }
          }
        }
      });
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  createQueueGroup(req, res) {
    try {
      let id = req.body.id;
      let data = JSON.parse(req.body.data || "{}");
      let process_mode = req.body.process_mode;
      let queue_name = "queue_" + process_mode;
      masterData.saveData(oberserverPath + process_mode, {
        queue_name, data,
        callback: async (worker: Worker) => {
          if (worker.isRunning() == false) {
            worker.resume();
          }
          console.log("worker.isRunning() :: ", worker.isRunning());
          let _queue = new Queue(queue_name, {
            connection: global.redis_bullmq,
            // prefix: "bullmq_",
            defaultJobOptions: {
              removeOnComplete: true, removeOnFail: 1000
            }
          })
          await _queue.add("basic", data, {
            jobId: id,
            timeout: 5000
          });
          res.send(worker.name + " :: start running!")
        }
      });
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  /**
   * Call when delete the execution
   * @param req 
   * @param res 
   * @returns 
   */
  async deleteQueue(req, res) {
    try {
      let id = req.body.id;
      let _data_queue_record = await QueueRecordDetailService.getQueueRecordDetails({
        queue_record_id: id
      })
      _data_queue_record.forEach(async (res_data_record_detail) => {
        let _processQueue = ProcessQueue({
          queue_name: res_data_record_detail.queue_name
        })
        _processQueue.remove(res_data_record_detail.job_id);
        let resDataInsert = await QueueRecordDetailService.updateQueueRecordDetail({
          id: res_data_record_detail.id,
          queue_record_id: res_data_record_detail.qrec_id,
          queue_name: res_data_record_detail.queue_name,
          job_id: res_data_record_detail.job_id,
          job_data: res_data_record_detail.data,
          status: QueueRecordDetailService.STATUS.STOPPED
        });
      });
      res.send("Deleted!");
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  /**
   * Call when change job status of the execution
   * @param req 
   * @param res 
   * @returns 
   */
  updateQueue(req, res) {
    try {
      let id = req.body.id;
      let data = req.body.data;
      let status = req.body.status;
      let action = req.body.queue_action;
      masterData.saveData(action, {
        id, data,
        callback: (worker: Worker) => {
          switch (status) {
            case 'pause':
              worker.pause();
              res.send("Paused!");
              break;
            case 'resume':
              worker.resume();
              res.send("Resumed!");
              break;
          }
        }
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  getQueues(req, res) {
    try {
      let id = req.body.id;
      let data = req.body.data;
      masterData.saveData("queue.request.queues", {
        id, data,
        callback: function (props) {
          res.send(props);
        }
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  getQueue(req, res) {
    try {
      let id = req.body.id;
      let data = req.body.data;
      masterData.saveData("queue.request.queue", {
        id, data,
        callback: function (props) {
          res.send(props);
        }
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  }
});