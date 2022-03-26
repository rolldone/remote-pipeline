import BaseRoute from "../../base/BaseRoute";

export default BaseRoute.extend<BaseRouteInterface>({
  baseRoute: '',
  onready() {
    let self = this;
    self.use('/', [], function (route: BaseRouteInterface) {
      route.get('', 'front.index', [], function (req, res) {
        res.send("vmdkfvmfdkvm");
      });
    });
    
  }
});