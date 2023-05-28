import AppConfig from "@root/config/AppConfig";
import GetAuthUser from "../functions/GetAuthUser";

export default function (req, res, next) {
  let promise = async () => {
    try {
      console.log("req.originalUrl :: ", req.get("host"));
      let sess = req.session;
      if (sess.user == null) {
        let encodeRedirect = encodeURIComponent((AppConfig.APP_PROTOCOL + '://' + req.get('host') + req.originalUrl));
        res.redirect("/dashboard/login?redirect=" + encodeRedirect);
        return;
      }
      let user = await GetAuthUser(req);
      let encodeRedirect = encodeURIComponent(AppConfig.APP_PROTOCOL + '://' + req.get('host') + req.originalUrl);
      if (user.id == null) return res.redirect("/dashboard/login?redirect=" + encodeRedirect);
      next();
    } catch (ex) {
      res.status(400).send(ex);
    }
  }
  promise();
}