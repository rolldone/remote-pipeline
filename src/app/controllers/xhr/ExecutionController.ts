import ExecutionService from "@root/app/services/ExecutionService"
import BaseController from "@root/base/BaseController"

export interface ExecutionControllerInterface extends BaseControllerInterface {
  addExecution: { (req: any, res: any): void }
  updateExecution: { (req: any, res: any): void }
  deleteExecution: { (req: any, res: any): void }
  getExecutions: { (req: any, res: any): void }
  getExecution: { (req: any, res: any): void }
  runExecution: { (req: any, res: any): void }
}

export default BaseController.extend<ExecutionControllerInterface>({
  async addExecution(req, res) {
    // project_id: int
    // configuration_id: int
    // type: string INSTANCE|PERIODE
    // is_active: boolean
    // running_type: string manually|datetime|time|countdown
    // running_value: string null|01:02:2022 00:00:00|01:00:00|9000
    // running_mode: string recursive|onetime
    try {
      let user = req.session.user;
      let props = req.body;
      props.user_id = user.id;
      props.pipeline_item_ids = JSON.parse(props.pipeline_item_ids || '[]');
      props.host_ids = JSON.parse(props.host_ids || '[]');
      let resData = await ExecutionService.addExecution(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async updateExecution(req, res) {
    // id: int
    // project_id: int
    // configuration_id: int
    // type: string INSTANCE|PERIODE
    // is_active: boolean
    // running_type: string manually|datetime|time|countdown
    // running_value: string null|01:02:2022 00:00:00|01:00:00|9000
    // running_mode: string recursive|onetime
    try {
      let user = req.session.user;
      let props = req.body;
      props.user_id = user.id;
      props.pipeline_item_ids = JSON.parse(props.pipeline_item_ids || '[]');
      props.host_ids = JSON.parse(props.host_ids || '[]');
      let resData = await ExecutionService.updateExecution(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async deleteExecution(req, res) {
    // ids: JSON []
    try {
      // ids: JSON []
      let ids = req.body.ids;
      ids = JSON.parse(ids || '[]');
      let resData = await ExecutionService.deleteExecutions(ids);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async getExecutions(req, res) {
    // where_by: string
    // page: int
    // limit: int
    try {
      let props = req.query;
      let resData = await ExecutionService.getExecutions({
        ...props,
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
  async getExecution(req, res) {
    // id: int
    try {
      let props = req.query;
      let id = req.params.id;
      let resData = await ExecutionService.getExecution({
        ...props,
        id
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
  runExecution(req, res) {

  }
});