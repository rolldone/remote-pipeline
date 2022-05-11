
import QueueSceduleService from "@root/app/services/QueueSceduleService";
import Sqlbricks from "@root/tool/SqlBricks";
import BaseController from "base/BaseController";

export interface QueueRecordScheduleScheduleControllerInterface extends BaseControllerInterface {
  addQueueRecordSchedule: { (req: any, res: any): void }
  updateQueueRecordSchedule: { (req: any, res: any): void }
  deleteQueueRecordSchedule: { (req: any, res: any): void }
  getQueueRecordSchedules: { (req: any, res: any): void }
  getQueueRecordSchedule: { (req: any, res: any): void }
}

const QueueRecordScheduleController = BaseController.extend<QueueRecordScheduleScheduleControllerInterface>({
  async addQueueRecordSchedule(req, res) {
    try {
      let props = req.body;
      props.data = JSON.parse(props.data || '{}');
      let resData = await QueueSceduleService.addQueueSchedule(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async updateQueueRecordSchedule(req, res) {
    try {
      let props = req.body;
      props.data = JSON.parse(props.data || '{}');
      let resData = await QueueSceduleService.updateQueueSchedule(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async deleteQueueRecordSchedule(req, res) {
    try {
      // ids: JSON []
      let ids = req.body.ids;
      ids = JSON.parse(ids || '[]');
      let resData = await QueueSceduleService.deleteQueueSchedule(ids);
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async getQueueRecordSchedules(req, res) {
    try {
      let props = req.query;
      let resData = await QueueSceduleService.getQueueSchedules(props);
      return res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async getQueueRecordSchedule(req, res) {
    try {
      let id = req.params.id;
      let props = req.query;
      let resData = await QueueSceduleService.getQueueSchedule({
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

export default QueueRecordScheduleController;