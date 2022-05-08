import SSH2Promise from "ssh2-promise";
import MergeVarScheme from "../MergeVarScheme";
import mustache from 'mustache';
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { TaskTypeInterface } from ".";

declare let masterData: MasterDataInterface;

export default function (props: TaskTypeInterface) {
  let {
    sshPromise,
    variable,
    schema,
    pipeline_task,
    socket,
    resolve,
    rejected
  } = props;
  try {
    let mergeVarScheme = MergeVarScheme(variable, schema);
    let _data = pipeline_task.data;
    let _parent_order_temp_ids = pipeline_task.parent_order_temp_ids;

    let command = mustache.render(_data.command.toString() + "\r", mergeVarScheme);
    // console.log("command :::: ", command);
    masterData.setOnListener("write_pipeline_" + pipeline_task.pipeline_item_id, (props) => {
      for (var a = 0; a < _parent_order_temp_ids.length; a++) {
        if (_parent_order_temp_ids[a] == props.parent) {
          console.log("Basic command ::  Called ");
          masterData.saveData("data_pipeline_" + pipeline_task.pipeline_item_id, {
            pipeline_task_id: pipeline_task.id,
            command: command,
            parent: pipeline_task.temp_id
          })
          break;
        }
      }
    })

    return {
      parent: pipeline_task.temp_id,
      pipeline_task_id: pipeline_task.id,
      command: command
    }
  } catch (ex) {
    throw ex;
  }
  // console.log("props basic-command ::: ", props);
}