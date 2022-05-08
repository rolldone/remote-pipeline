import BaseController from "@root/base/BaseController";

export interface WSocketControllerInterface extends BaseControllerInterface {
  connect: { (req: any, res: any) }
}

export default BaseController.extend<WSocketControllerInterface>({
  connect(req, res) {
    // let ws = req.ws

    // ws.once('connection', function connection(wss) {
    //   wss.on('message', function incoming(message) {
    //     console.log('received: %s', message);
    //   });

    //   wss.send(JSON.stringify('it works! Yeeee! :))'));
    // });
    res.send("vmkfv");
  }
});