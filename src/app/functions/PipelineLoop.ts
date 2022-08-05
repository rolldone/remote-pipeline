import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import AppConfig from "@root/config/AppConfig";
import { debounce, DebouncedFunc } from "lodash";
import SSH2Promise from "ssh2-promise";
import ExecutionService from "../services/ExecutionService";
import PipelineItemService from "../services/PipelineItemService";
import PipelineTaskService from "../services/PipelineTaskService";
import QueueRecordDetailService, { QueueRecordDetailInterface } from "../services/QueueRecordDetailService";
import QueueRecordService, { QueueRecordInterface, QueueRecordType } from "../services/QueueRecordService";
import VariableService from "../services/VariableService";
import ConnectToHost from "./ConnectOnSShPromise";
import DownloadRepo from "./DownloadRepo";
import RecordCommandToFileLog, { ResetCommandToFileLog } from "./RecordCommandToFileLog";
import task_type, { TaskTypeInterface } from "./task_type";

declare let masterData: MasterDataInterface;


type FunctionREcur = {
  pipeline_item_id?: number
  parent?: any
  sshPromise?: SSH2Promise
  socket?: any
  resolve?: Function
  rejected?: Function
}

const PipelineLoop = async function (props: {
  queue_record_id: number
  host_id: number
  host_data: any,
  job_id: string,
  extra: any
}) {
  let {
    queue_record_id,
    host_id,
    host_data,
    job_id,
    extra
  } = props;


  let lastFileNameForClose = null;

  try {

    // First get the queue_record
    let queue_record: QueueRecordInterface = await QueueRecordService.getQueueRecord({
      id: queue_record_id
    });

    if (queue_record.status == QueueRecordService.STATUS.STAND_BY) {
      return false;
    }

    let queue_record_detail: QueueRecordDetailInterface = await QueueRecordDetailService.getQueueRecordDetailByJobId(job_id, queue_record.id);

    console.log("job_id :: ", job_id);
    console.log("queue_record_id :: ", queue_record.id);
    console.log("queue_record_detail :: ", queue_record_detail);

    if (queue_record_detail.status == QueueRecordDetailService.STATUS.STOPPED) {
      return false;
    }

    if (queue_record.type == QueueRecordType.INSTANT) {
      if (queue_record_detail.status == QueueRecordDetailService.STATUS.COMPLETED) {
        return true;
      }
    }

    // Second get the execution
    let execution = await ExecutionService.getExecution({
      id: queue_record.execution_id
    });

    // Get variable
    let variable = await VariableService.getVariable({
      id: execution.variable_id
    })

    switch (true) {
      case execution == null:
      case queue_record == null:
        // case variable == null:
        return false;
    }

    // Get var data
    if (variable == null) {
      variable = {
        data: [],
        schema: {}
      };
    }
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
    let pendingCallCommand: DebouncedFunc<any> = null;
    // Loop the pipeline_item_ids;
    let _pipeline_item_ids = execution.pipeline_item_ids;
    for (var a = 0; a < _pipeline_item_ids.length; a++) {
      let sshPromise = null;
      let resolveDone = null;
      let resolveReject = null;
      let firstStart = null;
      let lastStartParent = null;
      // Create the recursive function

      let _recursiveTasks = async (props: FunctionREcur, recursiveFunc?: { (props: FunctionREcur, Function): void }) => {

        let _pipeline_task: Array<any> = await PipelineTaskService.getPipelineTasks({
          pipeline_item_id: props.pipeline_item_id,
          order_by: "pip_task.order_number ASC",
          parent: props.parent || null
        });

        // console.log("_pipeline_task :::::: ", _pipeline_task);
        // console.log("_pipeline_task :::: ", _pipeline_task);
        // console.log("_pipeline_task - " + props.parent + " :: ", _pipeline_task);

        /**
         * This is call after initialze all pipeline first time
         */
        if (_pipeline_task.length == 0) {
          // props.resolve();
          if (pendingCallCommand != null) {
            pendingCallCommand.cancel();
          }
          pendingCallCommand = debounce(() => {
            try {
              resolveDone = props.resolve;
              resolveReject = props.rejected;
              lastStartParent = props.parent
              if (typeof firstStart.command !== 'function') {
                masterData.saveData("data_pipeline_" + props.pipeline_item_id, firstStart);
                return;
              }
              firstStart.command();
            } catch (ex) {
              resolveReject("You get problem first start task queue - ex :: ", ex);
            }
          }, 3000);
          pendingCallCommand();
          return;
        }

        for (var a2 = 0; a2 < _pipeline_task.length; a2++) {

          // Reset or create empty file log first
          ResetCommandToFileLog("job_id_" + job_id + "_pipeline_id_" + _pipeline_item.id + "_task_id_" + _pipeline_task[a2].id)

          // console.log("_pipeline_task[a2].type :: ", _pipeline_task[a2].type);
          let theTaskTYpeFunc: { (props: TaskTypeInterface) } = task_type[_pipeline_task[a2].type];
          if (theTaskTYpeFunc == null) {
            throw new Error("I think your forgot define the task_type, check your file on app/functions/task_type/index.ts");
          }
          let extraVar = {
            link: AppConfig.ROOT_DOMAIN + "/dashboard/queue-record/job/" + job_id,
            link_add_data: AppConfig.ROOT_DOMAIN + "/xhr/outside/queue-detail/result/add",
            link_display_data: AppConfig.ROOT_DOMAIN + "/xhr/queue-record-detail/display-data/" + job_id + "/file",
            ...extra,
            job_id,
          }

          let isnnn = await theTaskTYpeFunc({
            raw_variable: variable,
            sshPromise: props.sshPromise,
            variable: _var_data,
            schema: _var_scheme,
            pipeline_task: _pipeline_task[a2],
            socket: props.socket,
            execution: execution,
            resolve: props.resolve,
            rejected: props.rejected,
            job_id,
            extra_var: extraVar
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
            rejected: props.rejected,
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

          // Try create connection ssh
          sshPromise = await ConnectToHost({
            host_data,
            host_id
          })

          // Download repository from pipeline and branch on execution
          // If there is no repo on pipeline return null
          try {
            let downloadInfo = await DownloadRepo({
              pipeline_id: execution.pipeline_id,
              execution_id: execution.id
            })
          } catch (ex) {
            console.log("DownloadRepo - ex :: ", ex);
            throw ex;
          }

          let socket = await sshPromise.shell();
          let who_parent = null;
          let pipeline_task_id = null;
          let command_history = "";
          let debounceee: DebouncedFunc<any> = null;

          masterData.setOnListener("data_pipeline_" + job_id + "_error", (props) => {
            pipeline_task_id = props.pipeline_task_id;
            socket.write("echo " + props.message + "\r");
            socket.write("echo error-error\r");

            // Remove the listener
            masterData.removeListener("write_pipeline_" + job_id);
            masterData.removeListener("data_pipeline_" + job_id);
            masterData.removeListener("data_pipeline_" + job_id + "_error");

            resolveReject(props.message || "Ups!, You need define a message for error pileine process");
          });
          masterData.setOnListener("data_pipeline_" + job_id + "_ignore", (props) => {
            lastFileNameForClose = "job_id_" + job_id + "_pipeline_id_" + _pipeline_item.id + "_task_id_" + props.pipeline_task_id;
            RecordCommandToFileLog({
              fileName: lastFileNameForClose,
              commandString: props.message
            })
            who_parent = props.parent;
            socket.write("\n");
            pipeline_task_id = props.pipeline_task_id;
            // Because event ignore nothing to do if this is last task return resolveDOne();
            if (lastStartParent == who_parent) {
              masterData.removeListener("write_pipeline_" + job_id);
              masterData.removeListener("data_pipeline_" + job_id);
              masterData.removeListener("data_pipeline_" + job_id + "_error");
              resolveDone();
            }
          });
          masterData.setOnListener("data_pipeline_" + job_id, (props) => {
            if (props.message != null) {
              lastFileNameForClose = "job_id_" + job_id + "_pipeline_id_" + _pipeline_item.id + "_task_id_" + props.pipeline_task_id;
              RecordCommandToFileLog({
                fileName: lastFileNameForClose,
                commandString: props.message + "\n"
              })
            }
            who_parent = props.parent;
            socket.write(props.command);
            pipeline_task_id = props.pipeline_task_id;
          });
          socket.on("exit", async () => {
            console.log("Get call exit from command");
            resolveDone();
          })
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
                    lastFileNameForClose = "job_id_" + job_id + "_pipeline_id_" + _pipeline_item.id + "_task_id_" + pipeline_task_id;
                    RecordCommandToFileLog({
                      fileName: lastFileNameForClose,
                      commandString: data.toString() + "\n"
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
            if (_isError == true) {
              await sshPromise.close();
              masterData.saveData("data_pipeline_" + job_id + "_error", {
                pipeline_task_id: pipeline_task_id,
                command: '',
                parent: who_parent,
                message: "Your pipeline get force stop by some condition"
              })
              return;
            }
            if (_isDone == true) {
              debounceee = debounce((_command_history: string, dataString: string) => {
                masterData.saveData("write_pipeline_" + job_id, {
                  parent: who_parent,
                  data: _command_history
                })
                command_history = "";
                if (lastStartParent == who_parent) {
                  console.log("lastStartParent :: ", lastStartParent, " and who_parent :: ", who_parent);
                  console.log("resolveDone::", resolveDone);
                  masterData.removeListener("write_pipeline_" + job_id);
                  masterData.removeListener("data_pipeline_" + job_id);
                  masterData.removeListener("data_pipeline_" + job_id + "_error");
                  resolveDone();
                }
              }, 2000);
              debounceee(command_history, data.toString());
            } else {
              debounceee = debounce((_command_history: string, dataString: string) => {
                socket.write('echo done-done\r');
              }, 1000);
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
          try {
            await resTask();
            await sshPromise.close();
          } catch (ex) {
            try {
              await sshPromise.close();
            } catch (ex) { }
            throw ex;
          }
          break;
      }
    }
    console.log("lastFileNameForClose :: ", lastFileNameForClose);
    RecordCommandToFileLog({
      fileName: lastFileNameForClose,
      commandString: "finish-finish" + "\n"
    })
    return true;
  } catch (ex) {
    console.log("PipelineLoop - ex  :: ", ex)
    RecordCommandToFileLog({
      fileName: lastFileNameForClose,
      commandString: "error-error" + "\n"
    })
    return false;
  }
}

export default PipelineLoop;