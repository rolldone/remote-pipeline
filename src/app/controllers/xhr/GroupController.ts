import BaseController from "base/BaseController";

export interface GroupControllerInterface extends BaseControllerInterface {
  addGroup: { (req: any, res: any): void }
  updateGroup: { (req: any, res: any): void }
  deleteGroup: { (req: any, res: any): void }
  getGroups: { (req: any, res: any): void }
  getGroup: { (req: any, res: any): void }
}

export default BaseController.extend<GroupControllerInterface>({
  addGroup(req, res) {
    // name: string
    // group_items: JSON {}
    // is_active: boolean
  },
  updateGroup(req, res) {
    // id: int
    // name: string
    // group_items: JSON {}
    // is_active: boolean
  },
  deleteGroup(req, res) {
    // ids: JSON []
  },
  getGroups(req, res) {
    // where_by: string
    // page: int
    // limit: int
  },
  getGroup(req, res) {
    // id: int
  },
});