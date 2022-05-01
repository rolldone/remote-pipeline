import BaseController from "@root/base/BaseController"
import { Knex } from "knex"
import { JobInformation3, Queue, QueueScheduler, Worker } from 'bullmq'
import { MasterDataInterface } from "@root/bootstrap/StartMasterData"
import GroupQueue from "@root/app/queues/GroupQueue"
import sqlbricks from "@root/tool/SqlBricks"
import ProcessQueue from "@root/app/queues/ProcessQueue"
import SqlBricks from "@root/tool/SqlBricks/sql-bricks"
import QueueRecordDetailService from "@root/app/services/QueueRecordDetailService"
import QueueRecordService from "@root/app/services/QueueRecordService"
import HostService from "@root/app/services/HostService"
import ProcessScheduleQueue from "@root/app/queues/ProcessScheduleQueue"
import QueueSceduleService from "@root/app/services/QueueSceduleService"
import { Moment } from "@root/tool"
import CreateQueue from "@root/app/functions/CreateQueue"
import CreateQueueItem from "@root/app/functions/CreateQueueItem"
import DeleteQueueItem from "@root/app/functions/DeleteQueueItem"

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
        queue_record_detail_id
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
      let resData = await CreateQueueItem({ queue_name, res_data_record_detail });
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
      let process_limit = req.body.process_limit || 1;
      let queue_name = "queue_" + process_mode + "_" + id;
      let resQueueRecord = await CreateQueue({ id, data, process_mode, process_limit, queue_name });
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
      let resDaa
      let _data_queue_record_details = await QueueRecordDetailService.getQueueRecordDetails({
        queue_record_id: id,
        status: QueueRecordDetailService.STATUS.RUNNING
      })
      _data_queue_record_details.forEach(async (res_data_record_detail) => {
        await DeleteQueueItem({
          queue_record_detail_id: res_data_record_detail.id
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