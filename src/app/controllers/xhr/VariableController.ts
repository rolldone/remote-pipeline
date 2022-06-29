import GetAuthUser from "@root/app/functions/GetAuthUser"
import VariableService from "@root/app/services/VariableService"
import BaseController from "@root/base/BaseController"

export interface VariableControllerInterface extends BaseControllerInterface {
  addVariable: { (req: any, res: any): void }
  updateVariable: { (req: any, res: any): void }
  deleteVariable: { (req: any, res: any): void }
  getVariables: { (req: any, res: any): void }
  getVariable: { (req: any, res: any): void }
}

export default BaseController.extend<VariableControllerInterface>({
  async addVariable(req, res) {
    try {
      // project_id: int
      // name: string
      // description: string
      // hosts: JSON [{ host : xxx.xxx.xxx.xxx, private_key : ...xxx, password : xxxxxx }, { ...xxx }]
      let user = await  GetAuthUser(req);
      let props = req.body;
      props.user_id = user.id;
      props.data = JSON.parse(props.data || '[]');
      props.schema = JSON.parse(props.schema || '[]');
      let resData = await VariableService.addVariable(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async updateVariable(req, res) {
    try {
      // id: int
      // project_id: int
      // name: string
      // description: text
      // hosts: JSON [{ host : xxx.xxx.xxx.xxx, private_key : ...xxx, password : xxxxxx }, { ...xxx }]
      let user = await  GetAuthUser(req);
      let props = req.body;
      props.user_id = user.id;
      props.data = JSON.parse(props.data || '[]');
      props.schema = JSON.parse(props.schema || '[]');
      let resData = await VariableService.updateVariable(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async deleteVariable(req, res) {
    // ids: Array []
    try {
      // ids: JSON []
      let ids = req.body.ids;
      ids = JSON.parse(ids || '[]');
      let resData = await VariableService.deleteVariable(ids);
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async getVariables(req, res) {
    try {
      // where_by: string
      // page: int
      // limit: int
      let props = req.query;
      let resData = await VariableService.getVariables({
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
  async getVariable(req, res) {
    try {
      // id: int
      let user = await  GetAuthUser(req);
      let props = req.query;
      let id = req.params.id;
      props.user_id = user.id;
      let resData = await VariableService.getVariable({
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
});