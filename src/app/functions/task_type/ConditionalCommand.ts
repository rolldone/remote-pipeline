import SSH2Promise from "ssh2-promise";
import MergeVarScheme from "../MergeVarScheme";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { TaskTypeInterface } from ".";
import MustacheRender from "../MustacheRender";

declare let masterData: MasterDataInterface

export default async function (props: TaskTypeInterface) {
  let {
    sshPromise,
    variable,
    schema,
    pipeline_task,
    socket
  } = props;

  try {
    let mergeVarScheme = MergeVarScheme(variable, schema);
    let _data = pipeline_task.data;
    let _parent_order_temp_ids = pipeline_task.parent_order_temp_ids;
    let _condition_values = _data.condition_values;
    let isPassed = [];
    let evalString = "";
    let command = MustacheRender(_data.command.toString() + "\r", mergeVarScheme);

    masterData.setOnListener("write_pipeline_" + pipeline_task.pipeline_item_id, (props) => {
      for (var a = 0; a < _parent_order_temp_ids.length; a++) {
        if (_parent_order_temp_ids[a] == props.parent) {
          // console.log("Conditional command :: Called ");
          for (var key in _condition_values) {
            if (_condition_values[key].condition_logic == 'NONE') {
              if (props.data.toString().includes(_condition_values[key].condition_input_value)) {
                isPassed.push(true);
                evalString += "true";
              } else {
                isPassed.push(false);
                evalString += "false";
              }
            }

            if (_condition_values[key].condition_logic == 'AND') {
              if (props.data.toString().includes(_condition_values[key].condition_input_value)) {
                isPassed.push(true);
                evalString += " && true";
              } else {
                isPassed.push(false);
                evalString += " && false";
              }
            }

            if (_condition_values[key].condition_logic == 'OR') {
              if (props.data.toString().includes(_condition_values[key].condition_input_value)) {
                isPassed.push(true);
                evalString += " || true";
              } else {
                isPassed.push(false);
                evalString += " || false";
              }
            }
          }
          if (eval(evalString) == true) {
            masterData.saveData("data_pipeline_" + pipeline_task.pipeline_item_id, {
              pipeline_task_id: pipeline_task.id,
              command: command,
              parent: pipeline_task.temp_id
            })
          } else {
            // throw it
            masterData.saveData("data_pipeline_" + pipeline_task.pipeline_item_id + "_error", {
              pipeline_task_id: pipeline_task.id,
              command: command,
              parent: pipeline_task.temp_id,
              message: "On Pipeline Task " + pipeline_task.name + " :: There is no match the result with your conditions"
            })
          }
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
}