import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { TaskTypeInterface } from ".";
import MergeVarScheme from "../MergeVarScheme";
import MustacheRender from "../MustacheRender";
import RecordCommandToFileLog from "../RecordCommandToFileLog";
import upath from 'upath';
import path from "path";
import MkdirReqursive from "../sftp/Mkdir";

declare let masterData: MasterDataInterface;

const WriteScriptCode = (props: TaskTypeInterface) => {
  let {
    sshPromise,
    variable,
    schema,
    pipeline_task,
    socket,
    resolve,
    rejected,
    raw_variable,
    job_id,
    extra_var
  } = props;
  try {
    console.log("'WriteScriptCode' ::::: ", props);
    let mergeVarScheme = MergeVarScheme(variable, schema, extra_var);
    let _data = pipeline_task.data;
    _data.command = "\r";
    let _parent_order_temp_ids = pipeline_task.parent_order_temp_ids;

    let command = MustacheRender(_data.command.toString() + "\r", mergeVarScheme);

    // console.log("mergeVarScheme :: ", mergeVarScheme);
    // console.log("schema :: ", schema);
    // console.log("_raw_variable :: ", raw_variable);
    // console.log("_command :: ", command);
    // console.log("_data :: ", _data);
    // console.log("_pipeline_task :: ", pipeline_task);

    let processWait = async () => {
      try {
        console.log("File Write command ::  Called ");
        let _files = [];
        let sftp = await sshPromise.sftp();
        // console.log("WriteScriptCode - script_datas ::: ", _data.script_datas);
        for (var au2 = 0; au2 < _data.script_datas.length; au2++) {
          let _content_data = _data.script_datas[au2].content;
          let _allow_var_environment = _data.script_datas[au2].allow_var_environment || false;
          _content_data = _content_data.join("\r\n");
          if (_allow_var_environment == true) {
            _content_data = MustacheRender(_content_data, mergeVarScheme);
          }
          let _write_to = upath.normalizeSafe(_data.working_dir + "/" + _data.script_datas[au2].file_path);

          // Check if path have variable rendered
          _write_to = MustacheRender(_write_to, mergeVarScheme);
          // console.log("_content_data ::: ", _content_data);
          try {
            console.log("path.dirname(_write_to) :: ", path.dirname(_write_to));
            await MkdirReqursive(sftp, path.dirname(_write_to));
          } catch (ex) {
            console.log("MkdirReqursive :: ", ex);
          }
          console.log("_write_to ::: ", _write_to);
          await sftp.writeFile(_write_to, _content_data, {});
          RecordCommandToFileLog({
            fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
            commandString: "Write File :: " + _write_to + "\n"
          })
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

    masterData.setOnMultiSameListener("write_pipeline_" + job_id, async (props) => {
      for (var a = 0; a < _parent_order_temp_ids.length; a++) {
        console.log("props.parent ", props.parent);
        console.log("_parent_order_temp_ids[a]", _parent_order_temp_ids[a]);
        if (_parent_order_temp_ids[a] == props.parent) {
          processWait();
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
}

export default WriteScriptCode;