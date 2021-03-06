import WebHookService from "../services/WebHookService";

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

      let _key = req.headers.authorization.replace("Bearer ", "");

      if (_key == null) {
        throw new Error("Key is not found!");
      }

      let webhookData = await WebHookService.getWebHookByKey(_key)

      if (webhookData == null) {
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