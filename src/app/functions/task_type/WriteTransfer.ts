import { TaskTypeInterface } from ".";
import MergeVarScheme from "../MergeVarScheme";
import mustache from 'mustache';
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { uniq } from "lodash";

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
    raw_variable
  } = props;
  try {
    let mergeVarScheme = MergeVarScheme(variable, schema);
    let _data = pipeline_task.data;
    _data.command = "\r";
    let _parent_order_temp_ids = pipeline_task.parent_order_temp_ids;

    let command = mustache.render(_data.command.toString() + "\r", mergeVarScheme);

    // console.log("mergeVarScheme :: ", mergeVarScheme);
    // console.log("schema :: ", schema);
    // console.log("_raw_variable :: ", raw_variable);
    // console.log("_command :: ", command);
    // console.log("_data :: ", _data);
    // console.log("_pipeline_task :: ", pipeline_task);

    // console.log("command :::: ", command);
    masterData.setOnListener("write_pipeline_" + pipeline_task.pipeline_item_id, async (props) => {
      for (var a = 0; a < _parent_order_temp_ids.length; a++) {
        if (_parent_order_temp_ids[a] == props.parent) {
          try {
            console.log("File Write command ::  Called ");
            let _files = [];
            let sftp = await sshPromise.sftp();
            for (var au2 = 0; au2 < _data.asset_datas.length; au2++) {
              let _content_data = mergeVarScheme[_data.asset_datas[au2].name];
              await sftp.writeFile(_data.asset_datas[au2].target_path, _content_data, {});
            }
            masterData.saveData("data_pipeline_" + pipeline_task.pipeline_item_id, {
              command: command,
              parent: pipeline_task.temp_id
            })
          } catch (ex) {
            console.log("sftp - ex :: ", ex);
            masterData.saveData("data_pipeline_" + pipeline_task.pipeline_item_id + "_error", {
              command: command,
              parent: pipeline_task.temp_id
            })
          }
        }
      }
    })
    return {
      parent: pipeline_task.temp_id,
      command: command
    }
  } catch (ex) {
    throw ex;
  }
}

export default WriteTransfer;