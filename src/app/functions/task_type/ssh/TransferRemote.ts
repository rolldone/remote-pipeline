import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { TaskTypeInterface } from "..";

declare let masterData: MasterDataInterface;

const TransferRemote = function (props: TaskTypeInterface) {
  let {
    sshPromise,
    variable,
    schema,
    pipeline_task,
    execution,
    resolve,
    rejected,
    raw_variable,
    job_id
  } = props;

  

}

export default TransferRemote;