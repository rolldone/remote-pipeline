import SafeValue from "@root/app/functions/base/SafeValue";
import CreateQueue from "@root/app/functions/CreateQueue";
import QueueRecordService, { QueueRecordInterface } from "@root/app/services/QueueRecordService";
import BaseController from "@root/base/BaseController"

export interface HostControllerInterface extends BaseControllerInterface {
  createQueue: { (req: any, res: any): void }
  queueDisplayProcess: { (req: any, res: any): void }
}

export default BaseController.extend<HostControllerInterface>({
  async createQueue(req, res) {
    try {
      let props = req.body;
      let queue_key = req.params.queue_key;
      let queueData: QueueRecordInterface = await QueueRecordService.getQueueRecordByKey(queue_key);
      let data = JSON.parse(props.data || "{}");
      let process_mode = SafeValue(props.process_mode, queueData.exe_process_mode);
      let process_limit = parseInt(SafeValue(props.process_limit, queueData.exe_process_limit));
      let delay = parseInt(SafeValue(props.delay, queueData.exe_delay));
      let queue_name = "queue_" + process_mode + "_" + queueData.id;
      let resQueueRecord = await CreateQueue({ id: queueData.id, data, process_mode, process_limit, queue_name, delay });

      res.send({
        status: 'success',
        status_code: 200,
        return: resQueueRecord
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async queueDisplayProcess(req, res) {

  }
});