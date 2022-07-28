import AppConfig from "@root/config/AppConfig";

export default function (req, res, next) {
  let sess = req.session;
  if (sess.user == null) {
    console.log("")
    res.redirect("/dashboard/login?redirect=" + (AppConfig.APP_PROTOCOL + '://' + req.get('host') + req.originalUrl));
    return;
  }
  console.log("sess :: ", sess.user);
  next();
}