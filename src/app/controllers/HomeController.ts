import BaseController from "@root/base/BaseController";

export interface HomeControllerInterface extends BaseControllerInterface {
  displayIndex: { (req: any, res: any) }
}

export default BaseController.extend<HomeControllerInterface>({
  displayIndex(req, res) {
    res.send("Hello world");
  }
});