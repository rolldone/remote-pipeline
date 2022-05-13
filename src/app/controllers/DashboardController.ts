import BaseController from "base/BaseController";
import GetAuthUser from "../functions/GetAuthUser";
import OAuthService from "../services/OAuthService";

export interface DashboardControllerInterface extends BaseControllerInterface {
  displayView: { (req: any, res: any): void }
  oauthRedirect: { (req: any, res: any): void }
}

export default BaseController.extend<DashboardControllerInterface>({
  displayView(req, res) {
    res.render("dashboard.html", {});
  },
  async oauthRedirect(req, res) {
    try {
      let user = GetAuthUser(req);
      let props = req.query;
      let resData = await OAuthService.getOAuthToken(props);
      if (resData.error != null) {
        return res.render("oauth_response/oauth_callback_error.html", resData);
      }
      let resAddData = await OAuthService.addOAuthToken({
        user_id: user.id,
        access_token: resData.access_token,
        repo_from: resData.from,
        token_type: resData.token_type,
        scope: resData.scope,
        data: JSON.stringify({})
      })
      res.render("oauth_response/oauth_callback.html", resData);
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
});