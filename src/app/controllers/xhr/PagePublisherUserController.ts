import SafeValue from "@root/app/functions/base/SafeValue";
import GetAuthUser from "@root/app/functions/GetAuthUser";
import PagePublisherUserService from "@root/app/services/PagePublisherUserService";
import UserService from "@root/app/services/UserService";
import BaseController from "base/BaseController";

export interface PagePublisherUserControllerInterface extends BaseControllerInterface {
  add?: { (req: any, res: any): void }
  update?: { (req: any, res: any): void }
  get?: { (req: any, res: any): void }
  gets?: { (req: any, res: any): void }
  deletes?: { (req: any, res: any): void }
  getUser?: { (req: any, res: any): void }
}

const PagePublisherUserController = BaseController.extend<PagePublisherUserControllerInterface>({
  async add(req, res) {
    try {
      let props = req.body;
      let user = await GetAuthUser(req);
      props.user_id = user.id;
      let resData = await PagePublisherUserService.addPagePublisherUser(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async update(req, res) {
    try {
      let props = req.body;
      let user = await GetAuthUser(req);
      props.user_id = user.id;
      let resData = await PagePublisherUserService.updatePagePublisherUser(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async get(req, res) {
    try {
      let id = req.params.id;
      let user = await GetAuthUser(req);
      let resData = await PagePublisherUserService.getPagePublisherUserById_UserId(id, user.id);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async gets(req, res) {
    try {
      let props = req.query;
      let user = await GetAuthUser(req);
      props.user_id = user.id;
      let resData = await PagePublisherUserService.getPagePublisherUsersByPagePublisherId(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async deletes(req, res) {
    try {
      let ids = JSON.parse(SafeValue(req.body.ids, '[]'));
      let user = await GetAuthUser(req);
      let resData = await PagePublisherUserService.deletesPagePublisherUserById_UserId(ids, user.id);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async getUser(req, res) {
    try {
      let email = req.params.email;
    } catch (ex) {
      return res.status(400).send(ex);
    }
  }
})

export default PagePublisherUserController;