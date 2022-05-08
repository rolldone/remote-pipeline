import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { debounce, DebouncedFunc } from "lodash";
import SSH2Promise from "ssh2-promise";
import ExecutionService from "../services/ExecutionService";
import PipelineItemService from "../services/PipelineItemService";
import PipelineTaskService from "../services/PipelineTaskService";
import QueueRecordService from "../services/QueueRecordService";
import VariableService from "../services/VariableService";
import ConnectToHost from "./ConnectOnSShPromise";
import RecordCommandToFileLog from "./RecordCommandToFileLog";
import task_type, { TaskTypeInterface } from "./task_type";

declare let masterData: MasterDataInterface;

const PipelineLoop = async function (props: {
  queue_record_id: number
  host_id: number
  host_data: any,
  user_id: any
  job_id: any
}) {
  let {
    queue_record_id,
    host_id,
    host_data,
    user_id,
    job_id
  } = props;
  try {
    // First get the queue_record
    let queue_record = await QueueRecordService.getQueueRecord({
      id: queue_record_id
    });

    // Second get the execution
    let execution = await ExecutionService.getExecution({
      id: queue_record.execution_id
    });

    // Get variable
    let variable = await VariableService.getVariable({
      id: execution.variable_id
    })

    // Get var data
    let _var_data = ((datas: any) => {
      let _variable_select = null;
      for (var a = 0; a < datas.length; a++) {
        if (datas[a].name == execution.variable_option) {
          _variable_select = datas[a].datas;
          break;
        }
      }
      return _variable_select;
    })(variable.data || []);

    // Get Schema
    let _var_scheme = variable.schema;

    // Loop the pipeline_item_ids;
    let _pipeline_item_ids = execution.pipeline_item_ids;
    for (var a = 0; a < _pipeline_item_ids.length; a++) {
      let resolveDone = null;
      let resolveReject = null;
      let firstStart = null;
      let lastStartParent = null;
      // Create the recursive function
      let _recursiveTasks = async (props: {
        pipeline_item_id?: number
        parent?: any
        sshPromise?: SSH2Promise
        socket?: any
        resolve?: Function
        rejected?: Function
      }, recursiveFunc?: Function) => {
        let _pipeline_task: Array<any> = await PipelineTaskService.getPipelineTasks({
          pipeline_item_id: props.pipeline_item_id,
          order_by: "pip_task.order_number",
          order_by_value: "ASC",
          parent: props.parent || null
        });
        // console.log("_pipeline_task :::: ", _pipeline_task);
        // console.log("_pipeline_task - " + props.parent + " :: ", _pipeline_task);
        if (_pipeline_task.length == 0) {
          // props.resolve();
          resolveDone = props.resolve;
          resolveReject = props.rejected;
          lastStartParent = props.parent
          masterData.saveData("data_pipeline_" + props.pipeline_item_id, firstStart);
          console.log("firstStart ::", firstStart)
          return;
        }
        for (var a2 = 0; a2 < _pipeline_task.length; a2++) {
          // console.log("_pipeline_task[a2].type :: ", _pipeline_task[a2].type);
          let theTaskTYpeFunc: { (props: TaskTypeInterface) } = task_type[_pipeline_task[a2].type];
          let isnnn = await theTaskTYpeFunc({
            raw_variable: variable,
            sshPromise: props.sshPromise,
            variable: _var_data,
            schema: _var_scheme,
            pipeline_task: _pipeline_task[a2],
            socket: props.socket,
            resolve: props.resolve,
            rejected: props.rejected
          });

          if (props.parent == "NULL") {
            firstStart = isnnn;
          }

          await recursiveFunc({
            pipeline_item_id: props.pipeline_item_id,
            sshPromise: props.sshPromise,
            parent: _pipeline_task[a2].temp_id,
            socket: props.socket,
            resolve: props.resolve,
            rejected: props.rejected
          }, recursiveFunc);
        }
      }
      // Get pipeline item by id
      let _pipeline_item = await PipelineItemService.getPipelineItem({
        id: _pipeline_item_ids[a],
        project_id: execution.project_id,
        pipeline_id: execution.pipeline_id
      });
      // Filter processing by type
      switch (_pipeline_item.type) {
        case PipelineItemService.TYPE.ANSIBLE:
          break;
        case PipelineItemService.TYPE.BASIC:
        default:
          let sshPromise = await ConnectToHost({
            host_data,
            host_id
          })
          let socket = await sshPromise.shell();
          let who_parent = null;
          let pipeline_task_id = null;
          let command_history = "";
          let debounceee: DebouncedFunc<any> = null;
          masterData.setOnListener("data_pipeline_" + _pipeline_item.id + "_error", (props) => {
            pipeline_task_id = props.pipeline_task_id;
            socket.write("echo " + props.message + "\r");
            socket.write("echo error-error\r");
            resolveReject(props.message || "Ups!, You need define a message for error pileine process");
          });
          masterData.setOnListener("data_pipeline_" + _pipeline_item.id, (props) => {
            who_parent = props.parent;
            socket.write(props.command);
            pipeline_task_id = props.pipeline_task_id;
          });
          socket.on("data", async (data) => {
            let _split = data.toString().split(/\n/);
            let _isDone = false;
            let _isError = false;
            for (let aes = 0; aes < _split.length; aes++) {
              _split[aes] = _split[aes].replace(/\r/g, "");
              switch (_split[aes]) {
                case '':
                case '\r':
                case '\u001b[32m\r':
                  break;
                default:
                  if (_split[aes].toString().replace(/ /g, '') == "done-done") {
                    _isDone = true;
                    break;
                  }
                  if (_split[aes].toString().replace(/ /g, '') == "error-error") {
                    _isError = true;
                    break;
                  }
                  break;
              }
              if (_isDone == true) {
                break;
              }
              if (_isError == true) {
                break;
              }
            }
            console.log("Console :: ", data.toString());
            switch (true) {
              case data.toString().includes('done-done') == true:
              case data.toString().includes('echo done-done') == true:
                break;
              default:
                command_history += data.toString();
                // console.log(data.toString());
                if (pipeline_task_id != null) {
                  if (data.toString() != "") {
                    RecordCommandToFileLog({
                      fileName: "job_id_" + job_id + "_pipeline_id_" + _pipeline_item.id,
                      commandString: data.toString()
                    })
                    // masterData.saveData("ws.commit", {
                    //   user_id: user_id,
                    //   pipeline_task_id,
                    //   data: data.toString()
                    // });
                  }
                }
                break;
            }
            if (debounceee != null) {
              debounceee.cancel();
            }
            if(_isError == true){
              await sshPromise.close();
              return;
            }
            if (_isDone == true) {
              debounceee = debounce((_command_history: string, dataString: string) => {
                masterData.saveData("write_pipeline_" + _pipeline_item.id, {
                  parent: who_parent,
                  data: _command_history
                })
                command_history = "";
                if (lastStartParent == who_parent) {
                  console.log("lastStartParent :: ", lastStartParent, " and who_parent :: ", who_parent);
                  resolveDone();
                }
              }, 2000);
              debounceee(command_history, data.toString());
            } else {
              debounceee = debounce((_command_history: string, dataString: string) => {
                socket.write('echo done-done\r');
              }, 4000);
              debounceee(command_history, data.toString());
            }
          });
          let resTask = () => {
            return new Promise(async (resolve: Function, rejected: Function) => {
              await _recursiveTasks({
                parent: "NULL",
                pipeline_item_id: _pipeline_item_ids[a],
                sshPromise,
                socket,
                resolve,
                rejected,
              }, _recursiveTasks);
            })
          }
          await resTask();
          await sshPromise.close();
          break;
      }
    }
  } catch (ex) {
    throw ex;
  }
}

export default PipelineLoop;