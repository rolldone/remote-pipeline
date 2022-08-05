import SSH2Promise from "ssh2-promise";
import MergeVarScheme from "../MergeVarScheme";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { TaskTypeInterface } from ".";
import MustacheRender from "../MustacheRender";
import upath from 'upath';
import path from "path";
import MkdirReqursive from "../sftp/Mkdir";
import RecordCommandToFileLog from "../RecordCommandToFileLog";
import QueueRecordService from "@root/app/services/QueueRecordService";
import CreateQueue from "../CreateQueue";
import SafeValue from "../base/SafeValue";
import VariableItemService from "@root/app/services/VariableItemService";


declare let masterData: MasterDataInterface;

const NewQueueCommand = function (props: TaskTypeInterface) {
  let {
    sshPromise,
    variable,
    schema,
    pipeline_task,
    socket,
    resolve,
    rejected,
    extra_var,
    job_id
  } = props;
  try {

    let mergeVarScheme = MergeVarScheme(variable, schema, extra_var);
    let _data = pipeline_task.data;
    let _parent_order_temp_ids = pipeline_task.parent_order_temp_ids;

    // NOTE YOU MUST ADD  \r for get trigger next task
    let command = MustacheRender(_data.command.toString() + "\r", mergeVarScheme);

    let processWait = async () => {
      try {
        console.log("NewQueueCommand command ::  Called ");
        let _queue_datas: Array<any> = null;
        _queue_datas = _data.queue_datas || [];
        for (var a = 0; a < _queue_datas.length; a++) {
          let queue_record = await QueueRecordService.getQueueRecord({
            id: _queue_datas[a].id
          })
          console.log("queue_record :: ", queue_record);
          if (queue_record != null) {
            let id = _queue_datas[a].id;
            let variable_extra = mergeVarScheme;
            let process_mode = queue_record.exe_process_mode;
            let process_limit = SafeValue(queue_record.exe_process_limit, 1);
            let delay = SafeValue(queue_record.exe_delay, 2000);
            let queue_name = "queue_" + process_mode + "_" + id;

            // If variable item id not null use this variable
            if (_queue_datas[a].data.variable_item_id != null) {
              let variable_item = await VariableItemService.getVariableItemById(_queue_datas[a].data.variable_item_id);
              mergeVarScheme = MergeVarScheme(variable_item.datas, variable_item.var_schema, extra_var);
              command = MustacheRender(_data.command.toString() + "\r", mergeVarScheme);
              variable_extra = mergeVarScheme;
              process_mode = SafeValue(_queue_datas[a].data.process_mode, process_mode);
              process_limit = SafeValue(_queue_datas[a].data.process_limit, process_limit);
              delay = SafeValue(_queue_datas[a].data.delay, delay);
            }

            let resQueueRecord = await CreateQueue({ id, variable_extra, process_mode, process_limit, queue_name, delay: delay });

            RecordCommandToFileLog({
              fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
              commandString: "Create queue :: " + _queue_datas[a].name + "\n"
            })

          } else {

            RecordCommandToFileLog({
              fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
              commandString: "Create queue :: " + _queue_datas[a].name + " Not found\n"
            })

          }
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

    // console.log("command :::: ", command);
    masterData.setOnMultiSameListener("write_pipeline_" + job_id, (props) => {
      for (var a = 0; a < _parent_order_temp_ids.length; a++) {
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

export default NewQueueCommand;