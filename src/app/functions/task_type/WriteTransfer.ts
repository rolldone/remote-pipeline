import { TaskTypeInterface } from ".";
import MergeVarScheme from "../MergeVarScheme";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { uniq } from "lodash";
import RecordCommandToFileLog from "../RecordCommandToFileLog";
import MustacheRender from "../MustacheRender";

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
    job_id
  } = props;
  try {
    console.log("WriteTransfer ::::: ", props);
    let mergeVarScheme = MergeVarScheme(variable, schema);
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

    let processWait = async ()=>{
      try {
        console.log("File Write command ::  Called ");
        let _files = [];
        let sftp = await sshPromise.sftp();
        for (var au2 = 0; au2 < _data.asset_datas.length; au2++) {
          let _content_data = mergeVarScheme[_data.asset_datas[au2].name];
          await sftp.writeFile(_data.asset_datas[au2].target_path, _content_data, {});
          RecordCommandToFileLog({
            fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
            commandString: "Write File :: " + _data.asset_datas[au2].target_path
          })
        }
        masterData.saveData("data_pipeline_" + pipeline_task.pipeline_item_id, {
          pipeline_task_id: pipeline_task.id,
          command: command,
          parent: pipeline_task.temp_id
        })
      } catch (ex) {
        console.log("sftp - ex :: ", ex);
        masterData.saveData("data_pipeline_" + pipeline_task.pipeline_item_id + "_error", {
          pipeline_task_id: pipeline_task.id,
          command: command,
          parent: pipeline_task.temp_id
        })
      }
    }
    // console.log("command :::: ", command);
    masterData.setOnListener("write_pipeline_" + pipeline_task.pipeline_item_id, async (props) => {
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