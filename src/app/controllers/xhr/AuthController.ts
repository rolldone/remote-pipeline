import AuthService from "@root/app/services/AuthService"
import OAuthService from "@root/app/services/OAuthService"
import BaseController from "@root/base/BaseController"
import OAuth from "@root/config/OAuth"

export interface AuthControllerInterface extends BaseControllerInterface {
  oAuthGenerate: { (req: any, res: any): void }
  login: { (req: any, res: any): void }
  register: { (req: any, res: any): void }
  logout: { (req: any, res: any): void }
  forgotPassword: { (req: any, res: any): void }
  getAuth: { (req: any, res: any): void }
}

export default BaseController.extend<AuthControllerInterface>({
  oAuthGenerate(req, res) {
    let from_provider = req.body.from_provider || null;
    let call_query: any = {
      forward_to: encodeURI(req.body.forward_to),
      from_provider: from_provider
    }
    call_query = new URLSearchParams(call_query);
    if (from_provider == null) {
      return res.send("There is no provider page here");
    }
    switch (from_provider) {
      case 'github':
        let url = OAuthService.generateOAuthUrl({
          call_query,
        })
        return res.send({
          status: "success",
          status_code: 200,
          return: url
        });
        break;
    }
    return res.send("There is no process");
  },
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