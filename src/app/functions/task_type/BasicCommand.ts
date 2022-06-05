import SSH2Promise from "ssh2-promise";
import MergeVarScheme from "../MergeVarScheme";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { TaskTypeInterface } from ".";
import MustacheRender from "../MustacheRender";
import upath from 'upath';
import path from "path";
import MkdirReqursive from "../sftp/Mkdir";
import RecordCommandToFileLog from "../RecordCommandToFileLog";

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

    let working_dir = MustacheRender(_data.working_dir, mergeVarScheme);
    let command = MustacheRender(_data.command.toString() + "\r", mergeVarScheme);

    let processWait = async () => {
      try {
        let sftp = await sshPromise.sftp();
        console.log("Basic command ::  Called ");
        let _script_data = null;
        if (_data.use_script == true) {
          _script_data = _data.script_data;
          _script_data.content = MustacheRender(_script_data.content || "", mergeVarScheme);
          let _write_to = upath.normalizeSafe(working_dir + "/" + _script_data.file_name);
          try {
            console.log("path.dirname(_write_to) :: ", path.dirname(_write_to));
            await MkdirReqursive(sftp, path.dirname(_write_to));
          } catch (ex) {
            console.log("MkdirReqursive :: ", ex);
          }
          await sftp.writeFile(_write_to, _script_data.content, {});

          RecordCommandToFileLog({
            fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
            commandString: "Write File :: " + _write_to + "\n"
          })
        }

        if (working_dir != null) {
          command = `cd ${working_dir} && ${command}`;
        }

        masterData.saveData("data_pipeline_" + job_id, {
          pipeline_task_id: pipeline_task.id,
          command: command,
          parent: pipeline_task.temp_id
        })

      } catch (ex) {
        console.log("sftp - ex :: ", ex);
        masterData.saveData("data_pipeline_" + job_id + "_error", {
          pipeline_task_id: pipeline_task.id,
          command: command,
          parent: pipeline_task.temp_id
        })
      }
    };

    // console.log("command :::: ", command);
    masterData.setOnListener("write_pipeline_" + job_id, (props) => {
      for (var a = 0; a < _parent_order_temp_ids.length; a++) {
        if (_parent_order_temp_ids[a] == props.parent) {
          processWait();
          break;
        }
      }
    })

    return {
      parent: pipeline_task.temp_id,
      pipeline_task_id: pipeline_task.id,
      command: processWait
    }
  } catch (ex) {
    throw ex;
  }
  // console.log("props basic-command ::: ", props);
}