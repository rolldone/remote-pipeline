import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import BaseRouteCli from "@root/base/BaseRouteCli";

declare var masterData: MasterDataInterface;

const Cli = BaseRouteCli.extend<BaseRouteInterface>({
  baseRoute: '',
  onready() {
    let self = this;
  }
});

export default Cli;
