import BaseController from "@root/base/BaseController"
import AppConfig from "@root/config/AppConfig"

export interface ConfigurationControllerInterface extends BaseControllerInterface {
  addConfiguration: { (req: any, res: any): void }
  updateConfiguration: { (req: any, res: any): void }
  deleteConfiguration: { (req: any, res: any): void }
  getConfigurations: { (req: any, res: any): void }
  getConfiguration: { (req: any, res: any): void }
}

export default BaseController.extend<ConfigurationControllerInterface>({
  addConfiguration(req, res) {
    // project_id: int
    // name: string
    // description: text
    // config_datas: JSON{xxx,xxx,xxx}
    // is_active: boolean

  },
  updateConfiguration(req, res) {
    // id
    // project_id: int
    // name: string
    // description: text
    // config_datas : JSON{xxx,xxx,xxx}
    // is_active: boolean
  },
  deleteConfiguration(req, res) {
    // ids
  },
  getConfigurations(req, res) {
    // where_by
    // page
    // limit
  },
  getConfiguration(req, res) {
    // id 
    let resData = {} as any;
    resData.APP_DOMAIN = AppConfig.APP_DOMAIN;
    resData.TIMEZONE = AppConfig.TIMEZONE;
    resData.BASE_TIMEZONE = AppConfig.TIMEZONE;
    let sess = req.session;
    if (sess.user != null) {
      resData.TIMEZONE = sess.user.timezone;
    }

    res.send({
      status: 'success',
      status_code: 200,
      return: resData
    })

    console.log("sess :: ", sess.user);
  },
});