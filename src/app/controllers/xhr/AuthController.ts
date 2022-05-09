import AuthService from "@root/app/services/AuthService"
import BaseController from "@root/base/BaseController"

export interface AuthControllerInterface extends BaseControllerInterface {
  login: { (req: any, res: any): void }
  register: { (req: any, res: any): void }
  logout: { (req: any, res: any): void }
  forgotPassword: { (req: any, res: any): void }
  getAuth: { (req: any, res: any): void }
}

export default BaseController.extend<AuthControllerInterface>({
  async login(req, res) {
    try {
      // email: string
      // password: string
      let props = req.body;
      let resData = await AuthService.loginService(props);
      let sess = req.session;
      sess.user = resData;
      res.send({
        status: "success",
        status_code: 200,
        return: resData
      });
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async register(req, res) {
    // first_name: string
    // last_name: string
    // email: string
    // password: string
    // is_active: boolean
    // term_police: string
    let props = req.body;
    let resData = await AuthService.registerService(props);

    res.send({
      status: "success",
      status_code: 200,
      return: resData
    });
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
    let sess = req.session;
    res.send({
      status: "success",
      status_code: 200,
      return: sess.user
    });
  }
});