import BaseController from "@root/base/BaseController"
import { Knex } from "knex"
import { Queue, Worker } from 'bullmq'
import { MasterDataInterface } from "@root/bootstrap/StartMasterData"
import QueueRecordDetailService, { QueueRecordDetailInterface } from "@root/app/services/QueueRecordDetailService"
import CreateQueue from "@root/app/functions/CreateQueue"
import DeleteQueueItem from "@root/app/functions/DeleteQueueItem"
import SafeValue from "@root/app/functions/base/SafeValue"
import QueueRecordService from "@root/app/services/QueueRecordService"

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
      let res_data_record_detail = await DeleteQueueItem({
        queue_record_detail_id,
        queue_record_status: QueueRecordService.STATUS.STAND_BY,
        queue_record_detail_status: QueueRecordDetailService.STATUS.STOPPED
      });
      res.send(res_data_record_detail.queue_name + " with Job id : " + res_data_record_detail.job_id + " :: deleted!")
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async createQueueItem(req, res) {
    try {
      let queue_record_detail_id = req.body.id;

      let res_data_record_detail: QueueRecordDetailInterface = await QueueRecordDetailService.getQueueRecordDetail({
        id: queue_record_detail_id
      })
      console.log('res_data_record_detail :: ', res_data_record_detail);
      let queue_name = "queue_" + res_data_record_detail.exe_process_mode + "_" + res_data_record_detail.qrec_id;
      // let resData = await CreateQueueItem({ queue_name, res_data_record_detail });
      let resData = await CreateQueue({
        data: res_data_record_detail.data,
        delay: res_data_record_detail.exe_delay,
        id: res_data_record_detail.queue_record_id,
        process_mode: res_data_record_detail.exe_process_mode,
        process_limit: res_data_record_detail.exe_process_limit,
        queue_name: res_data_record_detail.queue_name
      })
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
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
      let process_limit = parseInt(SafeValue(req.body.process_limit, 1));
      let queue_name = "queue_" + process_mode + "_" + id;
      let delay = parseInt(SafeValue(req.body.delay, 3000));
      let resQueueRecord = await CreateQueue({ id, data, process_mode, process_limit, queue_name, delay });
      res.send({
        status: 'success',
        status_code: 200,
        return: resQueueRecord
      })
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
      let _data_queue_record_details = await QueueRecordDetailService.getQueueRecordDetails({
        queue_record_id: id,
        status: QueueRecordDetailService.STATUS.RUNNING
      })
      _data_queue_record_details.forEach(async (res_data_record_detail, index) => {
        await DeleteQueueItem({
          index,
          length: _data_queue_record_details.length,
          queue_record_id: id,
          queue_record_detail_id: res_data_record_detail.id,
          queue_record_status: QueueRecordService.STATUS.STAND_BY,
          queue_record_detail_status: QueueRecordDetailService.STATUS.STOPPED
        });
      });
      if (_data_queue_record_details.length == 0) {
        await DeleteQueueItem({
          index: 0,
          length: 1,
          queue_record_id: id,
          queue_record_detail_id: null,
          queue_record_status: QueueRecordService.STATUS.STAND_BY,
          queue_record_detail_status: QueueRecordDetailService.STATUS.STOPPED
        });
      }
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