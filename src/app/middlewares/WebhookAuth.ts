import WebHookService from "../services/WebHookService";

export default function (req, res, next) {
  let asyncFUn = async () => {
    try {
      let props = req.body;
      let _key = props.key;
      if (_key == null) {
        throw new Error("Key is not found!");
      }
      let webhookData = await WebHookService.getWebHookByKey({
        key: _key
      })
      if (webhookData == null) {
        throw new Error("Key is not authorized!");
      }
      next();
    } catch (ex) {
      return res.status(400).send(ex);
    }
  }
  asyncFUn();
}