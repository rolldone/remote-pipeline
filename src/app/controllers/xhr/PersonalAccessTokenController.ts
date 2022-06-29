import GetAuthUser from "@root/app/functions/GetAuthUser"
import PersonalAccessTokenService from "@root/app/services/PersonalAccessTokenService"
import BaseController from "@root/base/BaseController"

export interface PersonalAccessTokenControllerInterface extends BaseControllerInterface {
  addPersonalAccessToken: { (req: any, res: any): void }
  updatePersonalAccessToken: { (req: any, res: any): void }
  deletePersonalAccessToken: { (req: any, res: any): void }
  getPersonalAccessTokens: { (req: any, res: any): void }
  getPersonalAccessToken: { (req: any, res: any): void }
}

export default BaseController.extend<PersonalAccessTokenControllerInterface>({
  async addPersonalAccessToken(req, res) {
    try {
      // project_id: int
      // name: string
      // description: string
      // hosts: JSON [{ host : xxx.xxx.xxx.xxx, private_key : ...xxx, password : xxxxxx }, { ...xxx }]
      let user = await  GetAuthUser(req);
      let props = req.body;
      props.user_id = user.id;
      let resData = await PersonalAccessTokenService.addPersonalAccessToken(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async updatePersonalAccessToken(req, res) {
    try {
      // id: int
      // project_id: int
      // name: string
      // description: text
      // hosts: JSON [{ host : xxx.xxx.xxx.xxx, private_key : ...xxx, password : xxxxxx }, { ...xxx }]
      let user = await  GetAuthUser(req);
      let props = req.body;
      props.user_id = user.id;
      let resData = await PersonalAccessTokenService.updatePersonalAccessToken(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async deletePersonalAccessToken(req, res) {
    // ids: Array []
    try {
      // ids: JSON []
      let ids = req.body.ids;
      ids = JSON.parse(ids || '[]');
      let resData = await PersonalAccessTokenService.deletePersonalAccessToken(ids);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async getPersonalAccessTokens(req, res) {
    try {
      // where_by: string
      // page: int
      // limit: int
      let user = await  GetAuthUser(req);
      let props = req.query;
      props.user_id = user.id;
      let resData = await PersonalAccessTokenService.getPersonalAccessTokens({
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
  async getPersonalAccessToken(req, res) {
    try {
      // id: int
      let user = await  GetAuthUser(req);
      let props = req.query;
      let id = req.params.id;
      props.user_id = user.id;
      let resData = await PersonalAccessTokenService.getPersonalAccessToken({
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
  }
});