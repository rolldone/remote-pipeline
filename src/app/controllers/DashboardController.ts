import BaseController from "base/BaseController";

export interface DashboardControllerInterface extends BaseControllerInterface {
  displayView: { (req: any, res: any): void }
}

export default BaseController.extend<DashboardControllerInterface>({
  displayView(req, res) {
    res.render("dashboard.html", {});
  }
});