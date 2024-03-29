import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { TaskTypeInterface } from "..";
import MergeVarScheme from "../../MergeVarScheme";
import MustacheRender from "../../MustacheRender";
import RecordCommandToFileLog from "../../RecordCommandToFileLog";
import axios from 'axios';
import FormData from "form-data";
import SafeValue from "../../base/SafeValue";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import upath from 'upath';
import File2Service from "@root/app/services/File2Service";
import FlyDriveConfig from "@root/config/FlyDriveConfig";
import { StorageManager } from "@slynova/flydrive";

declare let storage: StorageManager
declare let masterData: MasterDataInterface;

const HttpRequest = (props: TaskTypeInterface) => {
  let {
    variable,
    schema,
    pipeline_task,
    raw_variable,
    execution,
    job_id,
    extra_var
  } = props;

  try {
    let mergeVarScheme = MergeVarScheme(variable, schema, extra_var);
    let _data = pipeline_task.data;
    console.log("mvkdfvmkdfvmk :: ", _data);
    // Render first to get data from tag
    _data = JSON.parse(MustacheRender(JSON.stringify(_data), mergeVarScheme));

    let _parent_order_temp_ids = pipeline_task.parent_order_temp_ids;

    // NOTE YOU MUST ADD  \r for get trigger next task
    let command = MustacheRender((_data.command == null ? "" : _data.command.toString()) + "\r", mergeVarScheme);

    let resData = null;
    let processWait = async () => {
      try {
        let {
          headers,
          params,
          body_datas,
          file_datas,
          url,
          verb,
          content_type
        } = _data;

        console.log("file_datas :: ", file_datas);

        let _headers = {};
        for (let _aHeaders = 0; _aHeaders < SafeValue(headers, []).length; _aHeaders++) {
          _headers[headers[_aHeaders].key] = headers[_aHeaders].value;
        }
        let _params = {}
        for (let _aParams = 0; _aParams < SafeValue(params, []).length; _aParams++) {
          _params[params[_aParams].key] = params[_aParams].value;
        }

        let _formData = null;

        switch (content_type) {
          case 'application/x-www-form-urlencoded':
            _formData = new URLSearchParams();
            for (let _aBodys = 0; _aBodys < SafeValue(body_datas, []).length; _aBodys++) {
              _formData.append(body_datas[_aBodys].key, body_datas[_aBodys].value);
            }

            _formData = _formData.toString();
            _headers["Content-type"] = content_type;
            break;
          case 'multipart/form-data':
            let _formDataM = new FormData();
            try {
              if (existsSync(upath.normalize(`${process.cwd()}/storage/app/executions/${execution.id}/files`)) == false) {
                mkdirSync(upath.normalize(`${process.cwd()}/storage/app/executions/${execution.id}/files`), {
                  recursive: true
                });
              }
              for (let fileIdx = 0; fileIdx < file_datas.length; fileIdx++) {
                let assetData = await File2Service.getFileById(file_datas[fileIdx].id);
                let readFile = await storage.disk(FlyDriveConfig.FLY_DRIVE_DRIVER).getBuffer(upath.normalize(`${assetData.user_id}/${assetData.path}/${assetData.name}`));
                // writeFileSync(upath.normalize(`${process.cwd()}/storage/app/executions/${execution.id}/files/${assetData.name}`), readFile.content);
                // console.log("file_datas[fileIdx].key :: ", file_datas[fileIdx].key);
                // console.log("readFile.content :: ", readFile.content);
                _formDataM.append(file_datas[fileIdx].key, readFile.content, assetData.name);
              }
            } catch (ex: any) {
              masterData.saveData("data_pipeline_" + job_id + "_error", {
                pipeline_task_id: pipeline_task.id,
                command: command,
                parent: pipeline_task.temp_id,
                message: "Error :: " + pipeline_task.temp_id + " - " + pipeline_task.name + ` :: ex :: ` + ex.message
              })
              break;
            }
            for (let _aBodys = 0; _aBodys < SafeValue(body_datas, []).length; _aBodys++) {
              _formDataM.append(body_datas[_aBodys].key, body_datas[_aBodys].value);
            }
            _headers["Content-type"] = content_type;
            _formData = _formDataM;
            break;
          case 'application/json':
            _formData = {};
            for (let _aBodys = 0; _aBodys < SafeValue(body_datas, []).length; _aBodys++) {
              _formData[body_datas[_aBodys].key] = body_datas[_aBodys].value;
            }
            _headers["Content-type"] = content_type;
            break;
          case 'application/xml':
            _formData = {};
            for (let _aBodys = 0; _aBodys < SafeValue(body_datas, []).length; _aBodys++) {
              _formData[body_datas[_aBodys].key] = body_datas[_aBodys].value;
            }
            _headers["Content-type"] = content_type;
            break;
        }

        resData = await axios({
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
          parent: pipeline_task.temp_id,
          message: resData.data
        })

      } catch (ex: any) {
        console.log("cConditional Command - JOB ID ::", job_id);
        console.log("Conditional Command ::: ", ex);
        // RecordCommandToFileLog({
        //   fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
        //   commandString: "Error :: " + ex.message + "\n" // "Write File :: " + _write_to + "\n"
        // })
        // setTimeout(() => {
        //   masterData.saveData("data_pipeline_" + job_id + "_error", {
        //     pipeline_task_id: pipeline_task.id,
        //     command: command || resData.data,
        //     parent: pipeline_task.temp_id,
        //     message: "On Pipeline Task Key :: " + pipeline_task.temp_id + " - " + pipeline_task.name + " :: Get problem from your http request"
        //   })
        // }, 2000);

        // You get error or not just passed it!
        masterData.saveData("data_pipeline_" + job_id, {
          pipeline_task_id: pipeline_task.id,
          command: command,
          parent: pipeline_task.temp_id,
          message: ex.message
        })
      }
    }

    // console.log("command :::: ", command);
    masterData.setOnMultiSameListener("write_pipeline_" + job_id, async (props) => {
      for (var a = 0; a < _parent_order_temp_ids.length; a++) {
        console.log("props.parent ", props.parent);
        console.log("_parent_order_temp_ids[a]", _parent_order_temp_ids[a]);
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

export default HttpRequest;