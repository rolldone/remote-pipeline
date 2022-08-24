import GetAuthUser from "@root/app/functions/GetAuthUser";
import HostService from "@root/app/services/HostService";
import PipelineItemService from "@root/app/services/PipelineItemService"
import PipelineTaskService from "@root/app/services/PipelineTaskService";
import BaseController from "@root/base/BaseController"
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";

export interface HostControllerInterface extends BaseControllerInterface {
  getHost: { (req: any, res: any): void }
  getHosts: { (req: any, res: any): void }
  updateHost: { (req: any, res: any): void }
  addHost: { (req: any, res: any): void }
  deleteHosts: { (req: any, res: any): void }
}

declare let masterData: MasterDataInterface;

export default BaseController.extend<HostControllerInterface>({
  async getHosts(req, res) {
    try {
      let user = await  GetAuthUser(req);
      let props = req.query;
      props.user_id = user.id;
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
      let user = await  GetAuthUser(req);
      let props = req.query;
      let id = req.params.id;
      props.user_id = user.id;
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
      let user = await  GetAuthUser(req);
      let props = req.body;
      props.user_id = user.id;
      props.data = JSON.parse(props.data || '[]');
      let resData = await HostService.addHost(props);
      masterData.saveData("host.clear",{});
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
      let user = await  GetAuthUser(req);
      let props = req.body;
      props.user_id = user.id;
      props.data = JSON.parse(props.data || '[]');
      let resData = await HostService.updateHost(props);
      masterData.saveData("host.clear",{});
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
    try {
      // ids: JSON []
      let ids = req.body.ids;
      ids = JSON.parse(ids || '[]');
      let resData = await HostService.deleteHost({
        ids,
        force_deleted: req.body.force_deleted || false
      });
      masterData.saveData("host.clear",{});
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