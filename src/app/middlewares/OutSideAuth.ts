import GetAuthUser from "../functions/GetAuthUser";
import PersonalAccessTokenService from "../services/PersonalAccessTokenService";

export default function (req, res, next) {
  let asyncFUn = async () => {
    try {
      if (!req.headers.authorization) {
        // If there is no header it mean use session so destroy it
        req.session.destroy();
        return res.status(403).json({
          return: 'No credentials sent!',
          status: "error"
        });
      }
      let user = await GetAuthUser(req);
      if (user == null) {
        return res.status(403).json({
          status: "error",
          return: 'Authentication failed!'
        });
      }
      next();
    } catch (ex) {
      return res.status(400).send(ex);
    }
  }
  asyncFUn();
}