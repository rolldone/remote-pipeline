import BoolearParse from "@root/app/functions/base/BoolearParse";
import SafeValue from "@root/app/functions/base/SafeValue";
import GetAuthUser from "@root/app/functions/GetAuthUser";
import QueueRecordService from "@root/app/services/QueueRecordService";
import Sqlbricks from "@root/tool/SqlBricks";
import BaseController from "base/BaseController";

export interface QueueRecordControllerInterface extends BaseControllerInterface {
  addQueueRecord: { (req: any, res: any): void }
  updateQueueRecord: { (req: any, res: any): void }
  deleteQueueRecord: { (req: any, res: any): void }
  getQueueRecords: { (req: any, res: any): void }
  getQueueRecord: { (req: any, res: any): void }
  getQueueIdsstatus: { (req: any, res: any): void }
}

const QueueRecordController = BaseController.extend<QueueRecordControllerInterface>({
  async addQueueRecord(req, res) {
    try {
      let props = req.body;
      props.data = JSON.parse(props.data || '{}');
      let resData = await QueueRecordService.addQueueRecord(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async updateQueueRecord(req, res) {
    try {
      let props = req.body;
      props.data = JSON.parse(props.data || '{}');
      let resData = await QueueRecordService.updateQueueRecord(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async deleteQueueRecord(req, res) {
    try {
      // ids: JSON []
      let ids = req.body.ids;
      ids = JSON.parse(ids || '[]');
      let resData = await QueueRecordService.deleteQueueRecord({
        ids,
        force_deleted: BoolearParse(SafeValue(req.body.force_deleted, "false"))
      });
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
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
  },
  async getQueueIdsstatus(req, res) {
    try {
      let user = GetAuthUser(req);
      let props = req.query;
      props.ids = JSON.parse(props.ids || '[]');
      props.user_id = user.id;
      let resData = await QueueRecordService.getQueueIdsStatus(props);
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