import AppConfig from "@root/config/AppConfig";
import ExecutionService from "../services/ExecutionService";
import PipelineItemService from "../services/PipelineItemService";
import PipelineTaskService from "../services/PipelineTaskService";
import VariableService from "../services/VariableService";
import task_type, { TaskTypeInterface } from "./task_type";
import WaitingTimeout from "./WaitingTimeout";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { debounce, DebouncedFunc } from "lodash";
import QueueRecordDetailService, { QueueRecordDetailInterface } from "../services/QueueRecordDetailService";
import QueueRecordService, { QueueRecordInterface, QueueRecordType } from "../services/QueueRecordService";
import RecordCommandToFileLog, { ResetCommandToFileLog } from "./RecordCommandToFileLog";
import PagePublisherService from "../services/PagePublisherService";
import TokenDataService, { TokenDataInterface } from "../services/TokenDataService";

declare let masterData: MasterDataInterface;

type FunctionREcur = {
  pipeline_item_id?: number
  parent?: any
  socket?: any
  resolve?: Function
  rejected?: Function
}

const PipelineBasicLoop = async (props: {
  queue_record_id: number
  job_id: string,
  extra: any
}) => {
  let {
    queue_record_id,
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

          let resTokenData: TokenDataInterface = await TokenDataService.addOrUpdate({
            token: queue_record_detail.job_id,
            topic: TokenDataService.TOPIC.QUEUE_DISPLAY_RESULT_SHARE,
            data: {
              // Mandatory data
              page_name: "queue_records",
              table_id: queue_record.id,
              identity_value: null,
              user_id: queue_record.exe_user_id,
              auth_required: true,
              // Your business data
              /* Your data here */
              job_id: queue_record_detail.job_id,
              queue_record_id: queue_record_detail.id
            }
          })

          queue_record_detail.token_data_id = resTokenData.id;

          await QueueRecordDetailService.updateQueueRecordDetail(queue_record_detail);

          let extraVar = {
            link: AppConfig.ROOT_DOMAIN + "/dashboard/queue-record/job?share_key=" + resTokenData.token,
            link_add_data: AppConfig.ROOT_DOMAIN + "/xhr/outside/queue-detail/result/add",
            link_display_data: AppConfig.ROOT_DOMAIN + "/xhr/queue-record-detail/display-data/file?share_key=" + resTokenData.token,
            ...extra,
            job_id,
          }

          let isnnn = await theTaskTYpeFunc({
            raw_variable: variable,
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
            parent: _pipeline_task[a2].temp_id,
            socket: props.socket,
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


      let removeAllListeners = () => {

        masterData.removeAllListener("write_pipeline_" + job_id);
        masterData.removeAllListener("data_pipeline_" + job_id);
        masterData.removeAllListener("data_pipeline_" + job_id + "_init");
        masterData.removeAllListener("data_pipeline_" + job_id + "_error");
        masterData.removeAllListener("data_pipeline_" + job_id + "_abort");

      }

      // Filter processing by type
      switch (_pipeline_item.type) {
        case PipelineItemService.TYPE.ANSIBLE:
          break;
        case PipelineItemService.TYPE.BASIC:
        default:

          let who_parent = null;
          let pipeline_task_id = null;
          let command_history = "";
          let debounceee: DebouncedFunc<any> = null;

          masterData.setOnListener("data_pipeline_" + job_id + "_error", (props) => {

            lastFileNameForClose = "job_id_" + job_id + "_pipeline_id_" + _pipeline_item.id + "_task_id_" + props.pipeline_task_id;

            pipeline_task_id = props.pipeline_task_id;

            // Remove the listener
            removeAllListeners();

            resolveReject(props.message || "Ups!, You need define a message for error pileine process");
          });

          let callNextCommand = () => {
            if (debounceee != null) {
              debounceee.cancel();
            }
            debounceee = debounce((_command_history: string) => {
              masterData.saveData("write_pipeline_" + job_id, {
                parent: who_parent,
                data: _command_history
              })
              command_history = "";
              if (lastStartParent == who_parent) {
                console.log("lastStartParent :: ", lastStartParent, " and who_parent :: ", who_parent);
                console.log("resolveDone::", resolveDone);
                removeAllListeners();
                if (resolveDone == null) return;
                resolveDone();
              }
            }, 2000);
            debounceee(command_history);
          }

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


          masterData.setOnListener("data_pipeline_" + job_id + "_ignore", (props) => {
            lastFileNameForClose = "job_id_" + job_id + "_pipeline_id_" + _pipeline_item.id + "_task_id_" + props.pipeline_task_id;
            RecordCommandToFileLog({
              fileName: lastFileNameForClose,
              commandString: props.message
            })
            command_history += props.message;
            who_parent = props.parent;
            pipeline_task_id = props.pipeline_task_id;
            // Because event ignore nothing to do if this is last task return resolveDOne();
            if (lastStartParent == who_parent) {
              removeAllListeners();
              if (resolveDone == null) return;
              resolveDone();
            } else {
              callNextCommand();
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
            command_history += props.message;
            who_parent = props.parent;
            pipeline_task_id = props.pipeline_task_id;
            callNextCommand();
          });

          let resTask = () => {
            return new Promise(async (resolve: Function, rejected: Function) => {
              await _recursiveTasks({
                parent: "NULL",
                pipeline_item_id: _pipeline_item_ids[a],
                resolve,
                rejected,
              }, _recursiveTasks);
            })
          }
          try {
            await resTask();
          } catch (ex) {
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
      commandString: "error-error" + "\n"
    })
    return false;
  }
}

export default PipelineBasicLoop;