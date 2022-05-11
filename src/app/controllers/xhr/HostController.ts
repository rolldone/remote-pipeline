import HostService from "@root/app/services/HostService";
import PipelineItemService from "@root/app/services/PipelineItemService"
import PipelineTaskService from "@root/app/services/PipelineTaskService";
import BaseController from "@root/base/BaseController"

export interface HostControllerInterface extends BaseControllerInterface {
  getHost: { (req: any, res: any): void }
  getHosts: { (req: any, res: any): void }
  updateHost: { (req: any, res: any): void }
  addHost: { (req: any, res: any): void }
  deleteHosts: { (req: any, res: any): void }
}

export default BaseController.extend<HostControllerInterface>({
  async getHosts(req, res) {
    try {
      let props = req.query;
      let resData = await HostService.getHosts({
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
  async getHost(req, res) {
    // id: int
    try {
      let props = req.query;
      let id = req.params.id;
      let resData = await HostService.getHost({
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
  async addHost(req, res) {
    try {
      let user = req.session.user;
      let props = req.body;
      props.user_id = user.id;
      props.data = JSON.parse(props.data || '[]');
      let resData = await HostService.addHost(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async updateHost(req, res) {
    try {
      let user = req.session.user;
      let props = req.body;
      props.user_id = user.id;
      props.data = JSON.parse(props.data || '[]');
      let resData = await HostService.updateHost(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async deleteHosts(req, res) {
    try { } catch (ex) { }
  },
});