import BaseController from "base/BaseController";
import GetAuthUser from "../functions/GetAuthUser";
import GithubService from "../services/GithubService";
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
      let oauthUserData = null;
      let resAddData = null;
      switch (resData.from) {
        case 'github':
          oauthUserData = await GithubService.getCurrentUser({
            access_token: resData.access_token,
          })

          resAddData = await OAuthService.addOrUpdateOAuthToken({
            user_id: user.id,
            oauth_id: oauthUserData.id,
            access_token: resData.access_token,
            repo_from: resData.from,
            token_type: resData.token_type,
            scope: resData.scope,
            data: JSON.stringify({})
          })
          
          // Add oauth_user_id to resdata
          resData.oauth_user_id = resAddData.id;
          break;
      }
      res.render("oauth_response/oauth_callback.html", resData);
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
});