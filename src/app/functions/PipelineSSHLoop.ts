import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import AppConfig from "@root/config/AppConfig";
import { debounce, DebouncedFunc, reject } from "lodash";
import ExecutionService from "../services/ExecutionService";
import PagePublisherService from "../services/PagePublisherService";
import PipelineItemService from "../services/PipelineItemService";
import PipelineTaskService from "../services/PipelineTaskService";
import QueueRecordDetailService, { QueueRecordDetailInterface } from "../services/QueueRecordDetailService";
import QueueRecordService, { QueueRecordInterface, QueueRecordType } from "../services/QueueRecordService";
import VariableService from "../services/VariableService";
import Ssh2 from "./base/Ssh2";
import ConnectToHost from "./ConnectOnSShPromise";
import CryptoData from "./CryptoData";
import DownloadRepo from "./DownloadRepo";
import RecordCommandToFileLog, { ResetCommandToFileLog } from "./RecordCommandToFileLog";
import task_type, { TaskTypeInterface } from "./task_type";
import WaitingTimeout from "./WaitingTimeout";

declare let masterData: MasterDataInterface;


type FunctionREcur = {
  pipeline_item_id?: number
  parent?: any
  sshPromise?: Ssh2
  resolve?: Function
  rejected?: Function
}

const PipelineSSHLoop = async function (props: {
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

    let queue_record_detail: QueueRecordDetailInterface = await QueueRecordDetailService.getQueueRecordDetailByJobId_ByQueueId(job_id, queue_record.id);

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
    let putInitToFirstLog = null;

    // Listen init message
    let saveTempFirst = "";
    masterData.setOnListener("data_pipeline_" + job_id + "_init", (props) => {
      // If putInitToFirstLog save the props.message first
      if (putInitToFirstLog == null) {
        saveTempFirst += props.message;
        return;
      };
      if (saveTempFirst != null) {
        saveTempFirst += props.message;
        props.message = saveTempFirst;
      }
      RecordCommandToFileLog({
        fileName: putInitToFirstLog,
        commandString: props.message
      })
      saveTempFirst = null;
    });

    for (var a = 0; a < _pipeline_item_ids.length; a++) {
      let sshPromise = null;
      let resolveDone = null;
      let resolveReject = null;
      let firstStart = null;
      let lastStartParent = null;
      let _pipeline_item = null;
      // Create the recursive function


      let _recursiveTasks = async (props: FunctionREcur, recursiveFunc?: { (props: FunctionREcur, Function): void }) => {

        let _pipeline_task: Array<any> = await PipelineTaskService.getPipelineTasks({
          pipeline_item_id: props.pipeline_item_id,
          order_by: "pip_task.order_number ASC",
          parent: props.parent || null
        });

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

        // Just catch if first _pipeline_item
        if (putInitToFirstLog == null) {
          putInitToFirstLog = "job_id_" + job_id + "_pipeline_id_" + _pipeline_item.id + "_task_id_" + _pipeline_task[0].id;
        }

        for (var a2 = 0; a2 < _pipeline_task.length; a2++) {

          // Reset or create empty file log first
          ResetCommandToFileLog("job_id_" + job_id + "_pipeline_id_" + _pipeline_item.id + "_task_id_" + _pipeline_task[a2].id)

          // console.log("_pipeline_task[a2].type :: ", _pipeline_task[a2].type);
          let theTaskTYpeFunc: { (props: TaskTypeInterface) } = task_type[_pipeline_task[a2].type];
          if (theTaskTYpeFunc == null) {
            throw new Error("I think your forgot define the task_type, check your file on app/functions/task_type/index.ts");
          }

          let queue_record_detail_new = await PagePublisherService.generateShareKey(queue_record_detail, {
            page_name_field: "queue_records",
            table_id_field: "queue_record_id",
            value: "job_id",
            identity_value: null
          }) as any;

          let extraVar = {
            link: AppConfig.ROOT_DOMAIN + "/dashboard/queue-record/job?share_key=" + queue_record_detail_new.share_key,
            link_add_data: AppConfig.ROOT_DOMAIN + "/xhr/outside/queue-detail/result/add",
            link_display_data: AppConfig.ROOT_DOMAIN + "/xhr/queue-record-detail/display-data/file?share_key=" + queue_record_detail_new.share_key,
            ...extra,
            job_id,
          }

          let isnnn = await theTaskTYpeFunc({
            raw_variable: variable,
            sshPromise: props.sshPromise,
            variable: _var_data,
            schema: _var_scheme,
            pipeline_task: _pipeline_task[a2],
            execution: execution,
            resolve: props.resolve,
            rejected: props.rejected,
            job_id,
            extra_var: extraVar
          });

          if (props.parent == "NULL") {
            firstStart = isnnn;
            masterData.saveData("data_pipeline_" + job_id + "_init", {
              message: "Start Queue :)\n"
            })
          }

          await recursiveFunc({
            pipeline_item_id: props.pipeline_item_id,
            sshPromise: props.sshPromise,
            parent: _pipeline_task[a2].temp_id,
            resolve: props.resolve,
            rejected: props.rejected,
          }, recursiveFunc);
        }
      }


      // Get pipeline item by id
      _pipeline_item = await PipelineItemService.getPipelineItem({
        id: _pipeline_item_ids[a],
        project_id: execution.project_id,
        pipeline_id: execution.pipeline_id
      });


      let _firstPipelineTask = await PipelineTaskService.getPipelineTaskFirsOrderNumberByPipelineId(_pipeline_item.id);
      console.log("_firstPipelineTask ::: ", _firstPipelineTask);
      putInitToFirstLog = "job_id_" + job_id + "_pipeline_id_" + _pipeline_item.id + "_task_id_" + _firstPipelineTask.id

      // Filter processing by type
      switch (_pipeline_item.type) {
        case PipelineItemService.TYPE.ANSIBLE:
          break;
        case PipelineItemService.TYPE.BASIC:
        default:

          // Try create connection ssh
          let sshPromise = await ConnectToHost({
            host_data,
            host_id,
            job_id
          })

          // Download repository from pipeline and branch on execution
          // If there is no repo on pipeline return null
          try {
            let downloadInfo = await DownloadRepo({
              pipeline_id: execution.pipeline_id,
              execution_id: execution.id,
              job_id: job_id
            })
          } catch (ex) {
            console.log("DownloadRepo - ex :: ", ex);
            throw ex;
          }

          let who_parent = null;
          let pipeline_task_id = null;
          let command_history = "";
          let debounceee: DebouncedFunc<any> = null;

          console.log("job_id ::::::::: ", job_id);

          let removeAllListeners = () => {
            masterData.removeAllListener("write_pipeline_" + job_id);
            masterData.removeAllListener("data_pipeline_" + job_id);
            masterData.removeAllListener("data_pipeline_" + job_id + "_init");
            masterData.removeAllListener("data_pipeline_" + job_id + "_error");
            masterData.removeAllListener("data_pipeline_" + job_id + "_abort");
            masterData.removeAllListener("watch_prompt_datas_" + job_id);
          }

          masterData.setOnListener("data_pipeline_" + job_id + "_error", (props) => {
            lastFileNameForClose = "job_id_" + job_id + "_pipeline_id_" + _pipeline_item.id + "_task_id_" + props.pipeline_task_id;
            console.log("vadfvdfkvmakdmvk :: ", lastFileNameForClose);
            pipeline_task_id = props.pipeline_task_id;
            sshPromise.write("echo " + props.message + "\r");
            sshPromise.write("echo error-error\r");
            // Remove the listener
            removeAllListeners();
            resolveReject(props.message || "Ups!, You need define a message for error pileine process");
          });

          masterData.setOnListener("data_pipeline_" + job_id + "_ignore", (props) => {
            lastFileNameForClose = "job_id_" + job_id + "_pipeline_id_" + _pipeline_item.id + "_task_id_" + props.pipeline_task_id;
            RecordCommandToFileLog({
              fileName: lastFileNameForClose,
              commandString: props.message
            })
            who_parent = props.parent;
            sshPromise.write("\n");
            pipeline_task_id = props.pipeline_task_id;
            // Because event ignore nothing to do if this is last task return resolveDOne();
            // For condition if this task is last task
            if (lastStartParent == who_parent) {
              // Remove the listener
              removeAllListeners();
              if (resolveDone == null) return;
              resolveDone();
            }
          });

          masterData.setOnListener("data_pipeline_" + job_id + "_abort", (props) => {
            if (resolveDone == null) {
              return setTimeout(() => {
                masterData.saveData("data_pipeline_" + job_id + "_abort", {});
              }, 1000);
            }
            masterData.saveData("data_pipeline_" + job_id + "_error", {
              pipeline_task_id: pipeline_task_id || _firstPipelineTask.id,
              command: '',
              parent: who_parent,
              message: "Abort job queue :: " + job_id
            })
          })

          masterData.setOnListener("data_pipeline_" + job_id, (props) => {
            if (props.message != null) {
              lastFileNameForClose = "job_id_" + job_id + "_pipeline_id_" + _pipeline_item.id + "_task_id_" + props.pipeline_task_id;
              RecordCommandToFileLog({
                fileName: lastFileNameForClose,
                commandString: props.message + "\n"
              })
            }
            who_parent = props.parent;
            // sshPromise.write(props.command);
            pipeline_task_id = props.pipeline_task_id;
            // Call next pipeline task
            masterData.saveData("write_pipeline_" + job_id, {
              parent: who_parent,
              data: props.command_history
            });
            if (lastStartParent == who_parent) {
              console.log("lastStartParent :: ", lastStartParent, " and who_parent :: ", who_parent);
              console.log("resolveDone::", resolveDone);

              // Clear all 
              removeAllListeners();

              // Finish it
              if (resolveDone == null) return;
              resolveDone();
            }
          });

          sshPromise.on("exit", async () => {
            console.log("Get call exit from command");
            if (resolveDone == null) return;
            resolveDone();
          })

          let resTask = () => {
            return new Promise(async (resolve: Function, rejected: Function) => {
              await _recursiveTasks({
                parent: "NULL",
                pipeline_item_id: _pipeline_item_ids[a],
                sshPromise,
                resolve,
                rejected,
              }, _recursiveTasks);
            })
          }
          try {
            await resTask();
            await sshPromise.disconect();
          } catch (ex) {
            try {
              await sshPromise.disconect();
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
    await WaitingTimeout(3000);
    RecordCommandToFileLog({
      fileName: lastFileNameForClose,
      commandString: ex.toString() + "\n"
    });
    RecordCommandToFileLog({
      fileName: lastFileNameForClose,
      commandString: "error-error" + "\n"
    })
    return false;
  }
}

export default PipelineSSHLoop;