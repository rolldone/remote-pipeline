import BaseController from "base/BaseController";

export interface GroupUserControllerInterface extends BaseControllerInterface {
  addGroupUser: { (req: any, res: any): void }
  updateGroupUser: { (req: any, res: any): void }
  deleteGroupUser: { (req: any, res: any): void }
  getGroupUsers: { (req: any, res: any): void }
  getGroupUser: { (req: any, res: any): void }
}

export default BaseController.extend<GroupUserControllerInterface>({
  addGroupUser(req, res) {
    // user_id: int
    // group_id: int
    // group_items: JSON {} => Override permission
  },
  updateGroupUser(req, res) {
    // id: int
    // user_id: int
    // group_items: JSON {} => Override permission
  },
  deleteGroupUser(req, res) {
    // ids: JSON []
  },
  getGroupUsers(req, res) {
    // where_by: string
    // page: int
    // limit: int
  },
  getGroupUser(req, res) {
    // id: int
  },
});