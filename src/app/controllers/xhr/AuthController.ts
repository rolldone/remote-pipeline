import StoreValue from "@root/app/functions/base/StoreValue"
import AuthService from "@root/app/services/AuthService"
import OAuthService from "@root/app/services/OAuthService"
import BaseController from "@root/base/BaseController"
import AppConfig from "@root/config/AppConfig"
import OAuth from "@root/config/OAuth"
import { createHash, randomBytes } from "crypto"
import moment from 'moment'

export interface AuthControllerInterface extends BaseControllerInterface {
  oAuthGenerate: { (req: any, res: any): void }
  login: { (req: any, res: any): void }
  register: { (req: any, res: any): void }
  logout: { (req: any, res: any): void }
  forgotPassword: { (req: any, res: any): void }
  getAuth: { (req: any, res: any): void }
  registerExpiredCheck: { (req: any, res: any): void }
}


function base64URLEncode(str) {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest();
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
    let url = null;

    // Like gitlab need code challenge, github still dont need it
    // var verifier = base64URLEncode(randomBytes(36));
    // var challenge = base64URLEncode(sha256(verifier));
    var state = base64URLEncode(randomBytes(5));
    // StoreValue.set(req, "pkce_verifier", verifier);
    // StoreValue.set(req, "pkce_challenge", challenge)
    StoreValue.set(req, "state", state);

    url = OAuthService.generateOAuthUrl({
      call_query,
      from_provider,
      // code_challenge: challenge,
      // code_challenge_method: "S256",
      state: state
    })

    return res.send({
      status: "success",
      status_code: 200,
      return: url
    });
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
    let statusResponse = await AuthService.registerExpiredCheck() as any;
    if (statusResponse == "expired") {
      throw new Error("Form regiser is closed right now.");
    }
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

    req.session.destroy((err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Check again the session :: ", req.session);
      }
      res.end();
    });
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
  },
  async registerExpiredCheck(req, res) {
    let validRegister = await AuthService.registerExpiredCheck();
    return res.send({
      status: "success",
      status_code: 200,
      return: validRegister
    })
  }
});