import BoolearParse from "@root/app/functions/base/BoolearParse";
import SafeValue from "@root/app/functions/base/SafeValue";
import CredentialService from "@root/app/services/CredentialService";
import BaseController from "base/BaseController";

export interface CredentialControllerInterface extends BaseControllerInterface {
  addCredential: { (req: any, res: any): void }
  updateCredential: { (req: any, res: any): void }
  deleteCredential: { (req: any, res: any): void }
  getCredentials: { (req: any, res: any): void }
  getCredential: { (req: any, res: any): void }
}

const CredentialController = BaseController.extend<CredentialControllerInterface>({
  async addCredential(req, res) {
    try {
      let user = req.session.user;
      let props = req.body;
      props.user_id = user.id;
      props.data = JSON.parse(props.data || '[]');
      let resData = await CredentialService.addCredential(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async updateCredential(req, res) {
    try {
      let user = req.session.user;
      let props = req.body;
      props.user_id = user.id;
      props.data = JSON.parse(props.data || '[]');
      let resData = await CredentialService.updateCredential(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async deleteCredential(req, res) {
    // ids: JSON []
    try {
      // ids: JSON []
      let ids = req.body.ids;
      ids = JSON.parse(ids || '[]');
      let resData = await CredentialService.deleteCredentials({
        ids,
        force_deleted: BoolearParse(SafeValue(req.body.force_deleted, "false"))
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
  async getCredentials(req, res) {
    try {
      let user = req.session.user;
      let props = req.query;
      props.user_id = user.id;
      props.types = JSON.parse(props.types || '[]');
      let resData = await CredentialService.getCredentials({
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
  async getCredential(req, res) {
    // id: int
    try {
      let user = req.session.user;
      let props = req.query;
      let id = req.params.id;
      props.user_id = user.id;
      let resData = await CredentialService.getCredential({
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

export default CredentialController;