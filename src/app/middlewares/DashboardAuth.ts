import AppConfig from "@root/config/AppConfig";
import GetAuthUser from "../functions/GetAuthUser";

export default function (req, res, next) {
  let promise = async () => {
    try {
      console.log("req.originalUrl :: ",req.get("host"));
      let sess = req.session;
      if (sess.user == null) {
        res.redirect("/dashboard/login?redirect=" + (AppConfig.APP_PROTOCOL + '://' + req.get('host') + req.originalUrl));
        return;
      }
      let user = await GetAuthUser(req);
      if (user.id == null) return res.redirect("/dashboard/login?redirect=" + (AppConfig.APP_PROTOCOL + '://' + req.get('host') + req.originalUrl));
      next();
    } catch (ex) {
      res.status(400).send(ex);
    }
  }
  promise();
}