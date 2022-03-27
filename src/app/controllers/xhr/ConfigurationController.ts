import BaseController from "@root/base/BaseController"

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
  },
});