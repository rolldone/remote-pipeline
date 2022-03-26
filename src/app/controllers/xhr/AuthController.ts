import BaseController from "base/BaseController";


export interface AuthControllerInterface extends BaseControllerInterface {
  loginController: { (req: any, res: any): void }
  registerController: { (req: any, res: any): void }
  logoutController: { (req: any, res: any): void }
  forgotPasswordController: { (req: any, res: any): void }
  getAuth: { (req: any, res: any): void }
}

export default BaseController.extend<AuthControllerInterface>({
  loginController(req, res) {
    // email: string
    // password: string
  },
  registerController(req, res) {
    // first_name: string
    // last_name: string
    // email: string
    // password: string
    // is_active: boolean
  },
  logoutController(req, res) {
    // Session only
  },
  forgotPasswordController(req, res) {
    // email: string
  },
  getAuth(req, res) {
    // Session only
  }
});