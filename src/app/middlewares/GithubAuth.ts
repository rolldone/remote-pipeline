import GithubService from "../services/GithubService";
import GitlabService from "../services/GitlabService";
import OAuthService from "../services/OAuthService";

export default function (req, res, next) {
  let asyncFunc = async () => {
    try {
      let from_provider = req.body.from_provider || req.query.from_provider;
      let oauth_user_id = req.body.oauth_user_id || req.query.oauth_user_id;
      let user = req.session.user;
      let oAuthData = null;
      let resData = null;
      switch (from_provider) {
        case 'github':
          oAuthData = await OAuthService.getOauthData({
            user_id: user.id,
            id: oauth_user_id
          });
          resData = await GithubService.getCurrentUser({
            access_token: oAuthData.access_token
          })
          req.repo_auth_user = resData;
          req.repo_auth_access_token = oAuthData.access_token;
          break;
        case 'gitlab':
          oAuthData = await OAuthService.getOauthData({
            user_id: user.id,
            id: oauth_user_id
          });
          resData = await GitlabService.getCurrentUser({
            access_token: oAuthData.access_token
          })
          req.repo_auth_user = resData;
          req.repo_auth_access_token = oAuthData.access_token;
          break;
      }
      next();
    } catch (ex) {
      console.log("GithubAuth - err :: ", ex);
      return res.status(400).send(ex);
    }
  }
  asyncFunc();
}