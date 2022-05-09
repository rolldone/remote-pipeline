export default function (req, res, next) {
  let sess = req.session;
  if (sess.user == null) {
    res.redirect("/dashboard/login");
    return;
  }
  console.log("sess :: ", sess.user);
  next();
}