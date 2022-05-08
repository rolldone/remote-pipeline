import QueueRecordService from "@root/app/services/QueueRecordService";
import Sqlbricks from "@root/tool/SqlBricks";
import BaseController from "base/BaseController";

export interface QueueRecordControllerInterface extends BaseControllerInterface {
  getQueueRecords: { (req: any, res: any): void }
  getQueueRecord: { (req: any, res: any): void }
}

const QueueRecordController = BaseController.extend<QueueRecordControllerInterface>({
  async getQueueRecords(req, res) {
    try {
      let props = req.query;
      let resData = await QueueRecordService.getQueueRecords(props);
      return res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async getQueueRecord(req, res) {
    try {
      let id = req.params.id;
      let props = req.query;
      let resData = await QueueRecordService.getQueueRecord({
        id,
        ...props
      });
      return res.send({
        status: 'success',
        status_code: 200,
        return: resData
      });
    } catch (ex) {
      return res.status(400).send(ex);
    }
  }
});

export default QueueRecordController;