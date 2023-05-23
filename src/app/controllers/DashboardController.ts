import BaseController from "base/BaseController";
import SafeValue from "../functions/base/SafeValue";
import StoreValue from "../functions/base/StoreValue";
import GetAuthUser from "../functions/GetAuthUser";
import GithubService from "../services/GithubService";
import GitlabService from "../services/GitlabService";
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
      let user = await  GetAuthUser(req);
      let props = req.query;

      let pkce_verifier = null;
      let pkce_challenge = null;

      if (SafeValue(props.state, null) != null) {
        pkce_verifier = StoreValue.get(req, "pkce_verifier", null);
        pkce_challenge = StoreValue.get(req, "pkce_challenge", null);
      }

      let call_query = JSON.parse(StoreValue.get(req, props.state, '{}'));
      props = {
        ...props,
        ...call_query
      }
      let resData = await OAuthService.getOAuthToken({
        code: props.code,
        forward_to: props.forward_to,
        from_provider: props.from_provider,
        // code_challenge: pkce_challenge,
        // code_verifier: pkce_verifier
      });

      if (resData.error != null) {
        return res.render("oauth_response/oauth_callback_error.html", resData);
      }
      let oauthUserData = null;
      let resAddData = null;

      switch (resData.from_provider) {
        case 'bitbucket':
          // STILL TESTING GET TOKEN FIRST
          res.send(resData);
          return;
          oauthUserData = await GithubService.getCurrentUser({
            access_token: resData.access_token,
          })

          resAddData = await OAuthService.addOrUpdateOAuthToken({
            user_id: user.id,
            oauth_id: oauthUserData.id,
            access_token: resData.access_token,
            repo_from: resData.from_provider,
            token_type: resData.token_type,
            scope: resData.scope,
            data: JSON.stringify({})
          })

          // Add oauth_user_id to resdata
          resData.oauth_user_id = resAddData.id;
          resData.query_string_callback = "from_provider=" + resData.from_provider + "&oauth_user_id=" + resData.oauth_user_id;
          break;
        case 'github':
          oauthUserData = await GithubService.getCurrentUser({
            access_token: resData.access_token,
          })

          resAddData = await OAuthService.addOrUpdateOAuthToken({
            user_id: user.id,
            oauth_id: oauthUserData.id,
            access_token: resData.access_token,
            repo_from: resData.from_provider,
            token_type: resData.token_type,
            scope: resData.scope,
            data: JSON.stringify({})
          })

          // Add oauth_user_id to resdata
          resData.oauth_user_id = resAddData.id;
          resData.query_string_callback = "from_provider=" + resData.from_provider + "&oauth_user_id=" + resData.oauth_user_id;
          break;
        case 'gitlab':
          // STILL TESTING GET TOKEN FIRST
          // res.send(resData);
          // return;
          // return res.send(resData);
          // console.log("resData :: ",resData);
          oauthUserData = await GitlabService.getCurrentUser({
            access_token: resData.access_token,
          })

          resAddData = await OAuthService.addOrUpdateOAuthToken({
            user_id: user.id,
            oauth_id: oauthUserData.id,
            access_token: resData.access_token,
            repo_from: resData.from_provider,
            token_type: resData.token_type,
            refresh_token: resData.refresh_token,
            scope: resData.scope,
            data: JSON.stringify({}),
          })

          // Add oauth_user_id to resdata
          resData.oauth_user_id = resAddData.id;
          resData.query_string_callback = "from_provider=" + resData.from_provider + "&oauth_user_id=" + resData.oauth_user_id;
          break;
      }
      res.render("oauth_response/oauth_callback.html", resData);
    } catch (ex) {
      console.log("oauthRedirect - err :: ", ex);
      return res.status(400).send(ex);
    }
  },
});