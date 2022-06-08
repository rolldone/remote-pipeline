import UserPartnerService from "@root/app/services/UserPartnerService"
import UserService from "@root/app/services/UserService"
import BaseController from "@root/base/BaseController"

export interface UserControllerInterface extends BaseControllerInterface {
  addUser: { (req: any, res: any): void }
  updateUser: { (req: any, res: any): void }
  updateCurrentUser: { (req: any, res: any): void }
  deleteUser: { (req: any, res: any): void }
  getUser: { (req: any, res: any): void }
  getUsers: { (req: any, res: any): void }
  getSelfUser: { (req: any, res: any): void }
}

export default BaseController.extend<UserControllerInterface>({
  async addUser(req, res) {
    try {
      // first_name: string
      // last_name: string
      // email: string
      // is_active: string
      // password: string
      let user = req.session.user;
      let props = req.body;
      props.data = JSON.parse(props.data || '{}');
      let resData = await UserService.addUser(props);
      let resDataPartner = await UserPartnerService.addUserPartner({
        data: {},
        partner_user_id: resData.id,
        user_id: user.id
      })
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async updateUser(req, res) {
    try {
      // id: int
      // first_name: string
      // last_name: string
      // email: string
      // is_active: string
      // password: string
      let props = req.body;
      props.data = JSON.parse(props.data || '{}');
      let resData = await UserService.updateUser(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async updateCurrentUser(req, res) {
    try {
      let sess = req.session;
      // id: int => Session only
      // first_name: string
      // last_name: string
      // email: string
      // is_active: string
      // password: string
      let props = req.body;
      let id = sess.user.id
      let resData = await UserService.updateSelf({
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
  async deleteUser(req, res) {
    try {
      // ids: JSON []
      let ids = req.body.ids;
      ids = JSON.parse(ids || '[]');
      let resData = await UserService.deleteUser(ids);
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async getUser(req, res) {
    try {
      // id: int
      let props = req.query;
      let id = req.params.id;
      let resData = await UserService.getUser({
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
  async getUsers(req, res) {
    try {
      // where_by string
      // page: int
      // limit: int
      let user = req.session.user;
      let props = req.query;
      let resData = await UserPartnerService.getUserPartners({
        ...props,
        user_id: user.id
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
  async getSelfUser(req, res) {
    try {
      let user = req.session.user;
      let resData = await UserService.getUser({
        id: user.id
      });
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