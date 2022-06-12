
import OAuthUserService from "@root/app/services/OAuthUserService";
import PipelineItemService from "@root/app/services/PipelineItemService"
import PipelineTaskService from "@root/app/services/PipelineTaskService";
import BaseController from "@root/base/BaseController"

export interface OAuthUserControllerInterface extends BaseControllerInterface {
  getOAuthUser: { (req: any, res: any): void }
  getOAuthUsers: { (req: any, res: any): void }
  updateOAuthUser: { (req: any, res: any): void }
  addOAuthUser: { (req: any, res: any): void }
  deleteOAuthUsers: { (req: any, res: any): void }
}

export default BaseController.extend<OAuthUserControllerInterface>({
  async getOAuthUsers(req, res) {
    try {
      let props = req.query;
      let user = req.session.user;
      props.user_id = user.id;
      let resData = await OAuthUserService.getOAuthUsers({
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
  async getOAuthUser(req, res) {
    // id: int
    try {
      let props = req.query;
      let id = req.params.id;
      let resData = await OAuthUserService.getOAuthUser({
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
  async addOAuthUser(req, res) {
    try {
      let user = req.session.user;
      let props = req.body;
      props.user_id = user.id;
      props.data = JSON.parse(props.data || '{}');
      let resData = await OAuthUserService.addOAuthUser(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async updateOAuthUser(req, res) {
    try {
      let user = req.session.user;
      let props = req.body;
      props.user_id = user.id;
      props.data = JSON.parse(props.data || '[]');
      let resData = await OAuthUserService.updateOAuthUser(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async deleteOAuthUsers(req, res) {
    try {
      // ids: JSON []
      let ids = req.body.ids;
      ids = JSON.parse(ids || '[]');
      let resData = await OAuthUserService.deleteOAuthUser({
        ids,
        force_deleted: req.body.force_deleted || false
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