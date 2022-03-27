import BaseController from "@root/base/BaseController"

export interface AuthControllerInterface extends BaseControllerInterface {
  login: { (req: any, res: any): void }
  register: { (req: any, res: any): void }
  logout: { (req: any, res: any): void }
  forgotPassword: { (req: any, res: any): void }
  getAuth: { (req: any, res: any): void }
}

export default BaseController.extend<AuthControllerInterface>({
  login(req, res) {
    // email: string
    // password: string
    res.send("Empty");
  },
  register(req, res) {
    // first_name: string
    // last_name: string
    // email: string
    // password: string
    // is_active: boolean
    res.send("Empty");
  },
  logout(req, res) {
    // Session only
    res.send("Empty");
  },
  forgotPassword(req, res) {
    // email: string
    res.send("Empty");
  },
  getAuth(req, res) {
    // Session only
    res.send("Empty");
  }
});