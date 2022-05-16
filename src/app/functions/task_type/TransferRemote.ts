import SSH2Promise from "ssh2-promise";
import MergeVarScheme from "../MergeVarScheme";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { TaskTypeInterface } from ".";
import InitPtyProcess from "../InitPtyProcess";
import Rsync from "@root/tool/rsync";
import WritePrivateKeyToVariable from "../WritePrivateKeyToVariable";
import RecordCommandToFileLog from "../RecordCommandToFileLog";

declare let masterData: MasterDataInterface;

const TransferRemote = function (props: TaskTypeInterface) {
  let {
    sshPromise,
    variable,
    schema,
    pipeline_task,
    socket,
    execution,
    resolve,
    rejected,
    raw_variable,
    job_id
  } = props;

  

}

export default TransferRemote;