import AuthService from "@root/app/services/AuthService"
import BaseController from "@root/base/BaseController"

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
    let oauth = req.body.oauth || null;
    let call_query : any = {
      forward_to: encodeURI(req.body.forward_to),
      from: oauth
    }
    call_query = new URLSearchParams(call_query);
    let redirect_uri = 'http://192.168.50.4:3000/dashboard/login/oauth2/code?' + call_query
    if (oauth == null) {
      return res.send("There is no oauth page here");
    }
    let url = null;
    let props = {};
    switch (oauth) {
      case 'github':
        props = {
          client_id: '4839904b1862296f97bc',
          redirect_uri: redirect_uri,
          scope: 'user,email,repo',
        }
        let queryUrl = new URLSearchParams(props);
        url = 'https://github.com/login/oauth/authorize?' + queryUrl;
        return res.send({
          status: "success",
          status_code: 200,
          return: url
        });
        break;
    }
    res.send("vmdkfvmfdkvmkdfvmfkv");
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