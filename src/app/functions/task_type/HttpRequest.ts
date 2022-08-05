import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { TaskTypeInterface } from ".";
import MergeVarScheme from "../MergeVarScheme";
import MustacheRender from "../MustacheRender";
import RecordCommandToFileLog from "../RecordCommandToFileLog";
import axios from 'axios';
import FormData from "form-data";

declare let masterData: MasterDataInterface;

const HttpRequest = (props: TaskTypeInterface) => {
  let {
    sshPromise,
    variable,
    schema,
    pipeline_task,
    socket,
    raw_variable,
    execution,
    job_id,
    extra_var
  } = props;

  try {
    let mergeVarScheme = MergeVarScheme(variable, schema, extra_var);
    let _data = pipeline_task.data;
    let _parent_order_temp_ids = pipeline_task.parent_order_temp_ids;

    let command = MustacheRender(_data.command.toString(), mergeVarScheme);

    let processWait = async () => {
      try {
        let {
          headers,
          params,
          body_datas,
          url,
          verb,
          content_type
        } = _data;
        let _headers = {};
        for (let _aHeaders = 0; _aHeaders < headers.length; _aHeaders++) {
          _headers[headers[_aHeaders].key] = headers[_aHeaders].value;
        }
        let _params = {}
        for (let _aParams = 0; _aParams < params.length; _aParams++) {
          _params[params[_aParams].key] = params[_aParams].value;
        }
        let _formData = null;
        switch (content_type) {
          case 'application/x-www-form-urlencoded':
            _formData = new FormData();
            for (let _aBodys = 0; _aBodys < body_datas.length; _aBodys++) {
              _formData.append(body_datas[_aBodys].key, body_datas[_aBodys].value);
            }
            // _headers["Content-type"] = content_type;
            break;
          case 'application/json':
            _formData = {};
            for (let _aBodys = 0; _aBodys < body_datas.length; _aBodys++) {
              _formData[body_datas[_aBodys].key] = body_datas[_aBodys].value;
            }
            _headers["Content-type"] = content_type;
            break;
          case 'application/xml':
            _formData = {};
            for (let _aBodys = 0; _aBodys < body_datas.length; _aBodys++) {
              _formData[body_datas[_aBodys].key] = body_datas[_aBodys].value;
            }
            _headers["Content-type"] = content_type;
            break;
        }
        let resData = await axios({
          url: url,
          method: verb,
          headers: _headers,
          params: _params,
          data: _formData
        })
        RecordCommandToFileLog({
          fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
          commandString: "Status ::" + resData.status + "\n" // "Write File :: " + _write_to + "\n"
        })
        RecordCommandToFileLog({
          fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
          commandString: "Status Text ::" + resData.statusText + "\n" // "Write File :: " + _write_to + "\n"
        })
        // console.log("resData.request :: ", resData.request);
        // RecordCommandToFileLog({
        //   fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
        //   commandString: "Request ::" + resData.request + "\n" // "Write File :: " + _write_to + "\n"
        // })
        // console.log("resData.data :: ", resData.data);
        if (typeof resData.data === 'object') {
          resData.data = JSON.stringify(resData.data);
        }
        RecordCommandToFileLog({
          fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
          commandString: "Data ::" + resData.data + "\n" // "Write File :: " + _write_to + "\n"
        })
        masterData.saveData("data_pipeline_" + job_id, {
          pipeline_task_id: pipeline_task.id,
          command: command,
          parent: pipeline_task.temp_id
        })
        // _data.target_path = MustacheRender(_data.target_path,mergeVarScheme);
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
    }

    // console.log("command :::: ", command);
    masterData.setOnMultiSameListener("write_pipeline_" + job_id, async (props) => {
      for (var a = 0; a < _parent_order_temp_ids.length; a++) {
        if (_parent_order_temp_ids[a] == props.parent) {
          processWait();
          break;
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

export default HttpRequest;