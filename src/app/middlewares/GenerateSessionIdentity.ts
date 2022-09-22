import CreateUUID from "../functions/base/CreateUUID";

export default function (req, res, next) {
  let sess = req.session;
  if (sess.user == null) {
    req.session.user = {
      code: CreateUUID(),
      email: null,
      data: {}
    }
  }
  console.log("sess :: ", sess.user);
  next();
}