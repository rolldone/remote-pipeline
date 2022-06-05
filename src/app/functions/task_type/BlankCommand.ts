import SSH2Promise from "ssh2-promise";
import MergeVarScheme from "../MergeVarScheme";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { TaskTypeInterface } from ".";
import MustacheRender from "../MustacheRender";

declare let masterData: MasterDataInterface;

export default function (props: TaskTypeInterface) {
  let {
    sshPromise,
    variable,
    schema,
    pipeline_task,
    socket,
    resolve,
    rejected,
    extra_var,
    job_id
  } = props;
  try {
    let mergeVarScheme = MergeVarScheme(variable, schema, extra_var);
    let _data = pipeline_task.data;
    let _parent_order_temp_ids = pipeline_task.parent_order_temp_ids;

    let command = MustacheRender(_data.command.toString() + "\r", mergeVarScheme);

    masterData.setOnListener("write_pipeline_" + job_id, (props) => {
      for (var a = 0; a < _parent_order_temp_ids.length; a++) {
        if (_parent_order_temp_ids[a] == props.parent) {
          console.log("Basic command ::  Called ");
          masterData.saveData("data_pipeline_" + job_id, {
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