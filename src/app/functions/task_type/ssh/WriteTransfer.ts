import MergeVarScheme from "../../MergeVarScheme";
import RecordCommandToFileLog from "../../RecordCommandToFileLog";
import MustacheRender from "../../MustacheRender";
import MkdirReqursive from "../../sftp/Mkdir";
import path from "path";
import { TaskTypeInterface } from "..";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";

declare let masterData: MasterDataInterface;

const WriteTransfer = function (props: TaskTypeInterface) {
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
    console.log("WriteTransfer ::::: ", props);
    let mergeVarScheme = MergeVarScheme(variable, schema, extra_var);
    console.log("variable :: ", variable);
    console.log("schema :: ", schema);
    console.log("mergeVarScheme :: ", mergeVarScheme);
    let _data = pipeline_task.data;
    _data.command = "\r";
    let _parent_order_temp_ids = pipeline_task.parent_order_temp_ids;

    // NOTE YOU MUST ADD  \r for get trigger next task
    let command = MustacheRender(_data.command.toString() + "\r", mergeVarScheme);

    // console.log("mergeVarScheme :: ", mergeVarScheme);
    // console.log("schema :: ", schema);
    // console.log("_raw_variable :: ", raw_variable);
    // console.log("_command :: ", command);
    // console.log("_data :: ", _data);
    // console.log("_pipeline_task :: ", pipeline_task);

    let processWait = async () => {
      try {
        console.log("File Write command ::  Called  ");
        let _files = [];
        let sftp = await sshPromise.sftp();
        for (var au2 = 0; au2 < _data.asset_datas.length; au2++) {
          let _content_data = mergeVarScheme[_data.asset_datas[au2].name];
          console.log("_content_data :: ", _content_data);

          // Check if path have variable rendered
          _data.asset_datas[au2].target_path = MustacheRender(_data.asset_datas[au2].target_path, mergeVarScheme);

          await MkdirReqursive(sftp, path.dirname(_data.asset_datas[au2].target_path));

          await sftp.writeFile(_data.asset_datas[au2].target_path, _content_data, {});
          RecordCommandToFileLog({
            fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
            commandString: "Write File :: " + _data.asset_datas[au2].target_path + "\n"
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
    }
    // console.log("command :::: ", command);
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

export default WriteTransfer;