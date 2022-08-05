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
    socket,
    extra_var,
    job_id
  } = props;

  try {
    let mergeVarScheme = MergeVarScheme(variable, schema, extra_var);
    let _data = pipeline_task.data;
    let _parent_order_temp_ids = pipeline_task.parent_order_temp_ids;
    let _condition_values = _data.condition_values;
    let _parent_condition_type = _data.parent_condition_type;
    let isPassed = [];
    let evalString = "";

    // Check if working dir and command string have variable rendered
    let working_dir = MustacheRender(_data.working_dir, mergeVarScheme);
    // NOTE YOU MUST ADD  \r for get trigger next task
    let command = MustacheRender(_data.command.toString() + "\r", mergeVarScheme);

    if (working_dir != null) {
      command = `cd ${working_dir} && ${command}`;
    }

    let processWait = async () => {
      
    }

    masterData.setOnMultiSameListener("write_pipeline_" + job_id, (props) => {
      for (var a = 0; a < _parent_order_temp_ids.length; a++) {
        if (_parent_order_temp_ids[a] == props.parent) {
          // console.log("Conditional command :: Called ");
          try {
            for (var key in _condition_values) {

              // Check if condition string have variable rendered
              _condition_values[key].condition_input_value = MustacheRender(_condition_values[key].condition_input_value, mergeVarScheme);

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
              switch (_parent_condition_type) {
                case 'failed':
                  masterData.saveData("data_pipeline_" + job_id + "_error", {
                    pipeline_task_id: pipeline_task.id,
                    command: "",
                    parent: pipeline_task.temp_id,
                    message: "Catch the condition : " + _condition_values[key].condition_input_value
                  })
                  return;
                case 'next':
                  masterData.saveData("data_pipeline_" + job_id, {
                    pipeline_task_id: pipeline_task.id,
                    command: "",
                    parent: pipeline_task.temp_id,
                    message: "Catch the condition : " + _condition_values[key].condition_input_value
                  })
                  return;
              }
              masterData.saveData("data_pipeline_" + job_id, {
                pipeline_task_id: pipeline_task.id,
                command: command,
                parent: pipeline_task.temp_id,
                message: "Catch the condition : " + _condition_values[key].condition_input_value
              })
            } else {
              // ignore it
              console.log("IGNORE IT!!");
              masterData.saveData("data_pipeline_" + job_id + "_ignore", {
                pipeline_task_id: pipeline_task.id,
                command: command,
                parent: pipeline_task.temp_id,
                message: "On Pipeline Task " + pipeline_task.name + " :: There is no match the result with your conditions \n"
              })
            }
          } catch (ex) {
            console.log("Conditional Command - JOB ID ::", job_id);
            console.log("Conditional Command ::: ", ex);
            masterData.saveData("data_pipeline_" + job_id + "_error", {
              pipeline_task_id: pipeline_task.id,
              command: command,
              parent: pipeline_task.temp_id,
              message: "On Pipeline Task Key :: " + pipeline_task.temp_id + " - " + pipeline_task.name + " :: There is no match the result with your conditions"
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