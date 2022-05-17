import GetAuthUser from "@root/app/functions/GetAuthUser"
import WebHookService from "@root/app/services/WebHookService"
import BaseController from "@root/base/BaseController"

export interface WebHookControllerInterface extends BaseControllerInterface {
  addWebHook: { (req: any, res: any): void }
  updateWebHook: { (req: any, res: any): void }
  deleteWebHook: { (req: any, res: any): void }
  getWebHooks: { (req: any, res: any): void }
  getWebHook: { (req: any, res: any): void }
  execute: { (req: any, res: any): void }
}

export default BaseController.extend<WebHookControllerInterface>({
  async addWebHook(req, res) {
    try {
      // project_id: int
      // name: string
      // description: string
      // hosts: JSON [{ host : xxx.xxx.xxx.xxx, private_key : ...xxx, password : xxxxxx }, { ...xxx }]
      let user = GetAuthUser(req);
      let props = req.body;
      props.user_id = user.id;
      props.data = JSON.parse(props.data || '{}');
      props.webhook_datas = JSON.parse(props.webhook_datas || '[]');
      let resData = await WebHookService.addWebHook(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async updateWebHook(req, res) {
    try {
      // id: int
      // project_id: int
      // name: string
      // description: text
      // hosts: JSON [{ host : xxx.xxx.xxx.xxx, private_key : ...xxx, password : xxxxxx }, { ...xxx }]
      let user = GetAuthUser(req);
      let props = req.body;
      props.user_id = user.id;
      props.data = JSON.parse(props.data || '{}');
      props.webhook_datas = JSON.parse(props.webhook_datas || '[]');
      let resData = await WebHookService.updateWebHook(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async deleteWebHook(req, res) {
    // ids: Array []
    try {
      // ids: JSON []
      let ids = req.body.ids;
      ids = JSON.parse(ids || '[]');
      let resData = await WebHookService.deleteWebHook(ids);
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async getWebHooks(req, res) {
    try {
      // where_by: string
      // page: int
      // limit: int
      let user = GetAuthUser(req);
      let props = req.query;
      props.user_id = user.id;
      let resData = await WebHookService.getWebHooks({
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
  async getWebHook(req, res) {
    try {
      // id: int
      let user = GetAuthUser(req);
      let props = req.query;
      let id = req.params.id;
      props.user_id = user.id;
      let resData = await WebHookService.getWebHook({
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
  async execute(req, res) {
    try {
      let props = req.body;
      let resData = await WebHookService.execute({});
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  }
});