import BaseController from "base/BaseController";

export interface UserControllerInterface extends BaseControllerInterface {
  addUser: { (req: any, res: any): void }
  updateUser: { (req: any, res: any): void }
  updateCurrentUser: { (req: any, res: any): void }
  deleteUser: { (req: any, res: any): void }
  getUser: { (req: any, res: any): void }
  getUsers: { (req: any, res: any): void }
}

export default BaseController.extend<UserControllerInterface>({
  addUser(req, res) {
    // first_name: string
    // last_name: string
    // email: string
    // is_active: string
    // password: string
  },
  updateUser(req, res) {
    // id: int
    // first_name: string
    // last_name: string
    // email: string
    // is_active: string
    // password: string
  },
  updateCurrentUser(req, res) {
    // id: int => Session only
    // first_name: string
    // last_name: string
    // email: string
    // is_active: string
    // password: string
  },
  deleteUser(req, res) {
    // ids: JSON []
  },
  getUser(req, res) {
    // id: int
  },
  getUsers(req, res) {
    // where_by string
    // page: int
    // limit: int
  },
});