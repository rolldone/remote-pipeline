import SafeValue from "@root/app/functions/base/SafeValue";
import GetAuthUser from "@root/app/functions/GetAuthUser";
import PagePublisherService from "@root/app/services/PagePublisherService";
import PagePublisherUserService from "@root/app/services/PagePublisherUserService";
import UserService from "@root/app/services/UserService";
import BaseController from "base/BaseController";

export interface PagePublisherControllerInterface extends BaseControllerInterface {
  add?: { (req: any, res: any): void }
  update?: { (req: any, res: any): void }
  get?: { (req: any, res: any): void }
  gets?: { (req: any, res: any): void }
  deletes?: { (req: any, res: any): void }
  getByPageNameTableId?: { (req: any, res: any): void }
}

const PagePublisherController = BaseController.extend<PagePublisherControllerInterface>({
  async add(req, res) {
    try {
      let user = await GetAuthUser(req);
      let props = req.body;
      props.user_id = user.id;
      props.users = JSON.parse(props.users || '[]');
      let resData = await PagePublisherService.addPagePublisher(props);
      switch (props.share_mode) {
        case 'specific':
          for (var a = 0; a < props.users.length; a++) {
            let resUserData = await UserService.getUserByEmail(props.users[a]);
            if (resUserData != null) {
              await PagePublisherUserService.addPagePublisherUser({
                page_publisher_id: resData.id,
                user_id: resUserData.id,
                email: resUserData.email
              });
            } else {
              await PagePublisherUserService.addPagePublisherUser({
                page_publisher_id: resData.id,
                email: props.users[a]
              });
            }
          }
          break;
      }
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
      let user = await GetAuthUser(req);
      let props = req.body;
      props.user_id = user.id;
      props.users = JSON.parse(props.users || '[]');
      let resData = await PagePublisherService.updatePagePublisher(props);
      switch (props.share_mode) {
        case 'specific':
          // Clear First
          await PagePublisherUserService.clearPagePublisherUserByPublisherId(resData.id);
          for (var a = 0; a < props.users.length; a++) {
            let resUserData = await UserService.getUserByEmail(props.users[a]);
            if (resUserData != null) {
              await PagePublisherUserService.addPagePublisherUser({
                page_publisher_id: resData.id,
                user_id: resUserData.id,
                email: resUserData.email
              });
            } else {
              await PagePublisherUserService.addPagePublisherUser({
                page_publisher_id: resData.id,
                email: props.users[a]
              });
            }
          }
          break;
      }
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async getByPageNameTableId(req, res) {
    try {
      let props = req.params;
      let resData = await PagePublisherService.getPagePublisherByPageNameTableID(props.page_name, props.table_id);
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
      let resData = await PagePublisherService.getPagePublisherById_UserId(id, user.id);
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
      let resData = await PagePublisherService.getPagePublishers(props);
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
      let props = req.body;
      let user = await GetAuthUser(req);
      let ids = JSON.parse(SafeValue(props.ids, '[]'));
      let resData = await PagePublisherService.deletesPagePublishersByIds_UserId(ids, user.id);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  }
})

export default PagePublisherController;