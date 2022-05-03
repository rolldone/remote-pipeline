import SSH2Promise from "ssh2-promise";
import ExecutionService from "../services/ExecutionService";
import PipelineItemService from "../services/PipelineItemService";
import PipelineTaskService from "../services/PipelineTaskService";
import QueueRecordService from "../services/QueueRecordService";
import VariableService from "../services/VariableService";
import ConnectToHost from "./ConnectToHost";
import task_type from "./task_type";

export default async function (props: {
  queue_record_id: number
  host_id: number
  host_data: any
}) {
  let {
    queue_record_id,
    host_id,
    host_data
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
      // Create the recursive function
      let _recursiveTasks = async (props: {
        pipeline_item_id?: number
        parent?: any
        sshPromise?: Promise<SSH2Promise>
      }, recursiveFunc?: Function) => {
        let _pipeline_task: Array<any> = await PipelineTaskService.getPipelineTasks({
          pipeline_item_id: props.pipeline_item_id,
          order_by: "pip_task.order_number",
          order_by_value: "ASC",
          parent: props.parent || null
        });
        // console.log("_pipeline_task - " + props.parent + " :: ", _pipeline_task);
        if (_pipeline_task.length == 0) {
          return;
        }
        for (var a2 = 0; a2 < _pipeline_task.length; a2++) {
          await task_type[_pipeline_task[a2].type]({
            sshPromise: props.sshPromise,
            variable: _var_data,
            schema: _var_scheme,
            pipeline_task: _pipeline_task[a2]
          });
          recursiveFunc({
            pipeline_item_id: props.pipeline_item_id,
            sshPromise: props.sshPromise,
            parent: _pipeline_task[a2].temp_id
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
          let sshPromise = ConnectToHost({
            host_data,
            host_id
          })
          _recursiveTasks({
            parent: "NULL",
            pipeline_item_id: _pipeline_item_ids[a],
            sshPromise
          }, _recursiveTasks);
          break;
      }
    }
  } catch (ex) {
    throw ex;
  }
}