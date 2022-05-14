import GithubService from "../services/GithubService";
import OAuthService from "../services/OAuthService";

export default function (req, res, next) {
  let asyncFunc = async () => {
    try {
      let from = req.body.from || req.query.from;
      let oauth_user_id = req.body.oauth_user_id || req.query.oauth_user_id;
      let user = req.session.user;
      switch (from) {
        case 'github':
          let oAuthData = await OAuthService.getOauthData({
            user_id: user.id,
            id: oauth_user_id
          });
          let resData = await GithubService.getCurrentUser({
            access_token: oAuthData.access_token
          })
          req.github_user = resData;
          req.github_access_token = oAuthData.access_token;
          break;
      }
    } catch (ex) {
      throw ex;
    }
  }
  asyncFunc().then(() => {
    next();
  }).catch((err) => {
    console.log("GithubAuth - err :: ", err);
  })
}