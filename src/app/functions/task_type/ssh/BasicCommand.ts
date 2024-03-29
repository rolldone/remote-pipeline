import SSH2Promise from "ssh2-promise";
import MergeVarScheme from "../../MergeVarScheme";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { TaskTypeInterface } from "..";
import MustacheRender from "../../MustacheRender";
import upath from 'upath';
import path from "path";
import MkdirReqursive from "../../sftp/Mkdir";
import RecordCommandToFileLog from "../../RecordCommandToFileLog";
import { ClientChannel } from "ssh2";

declare let masterData: MasterDataInterface;

export default function (props: TaskTypeInterface) {
  let {
    sshPromise,
    variable,
    schema,
    pipeline_task,
    resolve,
    rejected,
    extra_var,
    job_id
  } = props;
  try {
    let mergeVarScheme = MergeVarScheme(variable, schema, extra_var);
    let _data = pipeline_task.data;
    let _parent_order_temp_ids = pipeline_task.parent_order_temp_ids;

    let working_dir = MustacheRender(_data.working_dir, mergeVarScheme);

    // NOTE YOU MUST ADD  \r for get trigger next task
    let command = MustacheRender(_data.command.toString() + "\r", mergeVarScheme);

    let processWait = async () => {
      try {
        let sftp = await sshPromise.sftp();
        console.log("Basic command :::  Called ");
        let _script_data = null;
        if (_data.use_script == true) {
          _script_data = _data.script_data;
          _script_data.content = MustacheRender(_script_data.content || "", mergeVarScheme);
          let _write_to = upath.normalizeSafe(working_dir + "/" + _script_data.file_name);
          try {
            console.log("path.dirname(_write_to) :: ", path.dirname(_write_to));
            await MkdirReqursive(sftp, path.dirname(_write_to));
          } catch (ex) {
            console.log("MkdirReqursive :: ", ex);
          }
          await sftp.writeFile(_write_to, _script_data.content);

          RecordCommandToFileLog({
            fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
            commandString: "Write File :: " + _write_to + "\n"
          })
        }

        if (working_dir != null) {
          command = `cd ${working_dir} && ${command}`;
        }
        let prompt_datas = _data.prompt_datas as Array<any> || [];
        for (var prmIdx = 0; prmIdx < prompt_datas.length; prmIdx++) {
          prompt_datas[prmIdx].value = MustacheRender(prompt_datas[prmIdx].value, mergeVarScheme);
        }
        masterData.saveData("watch_prompt_datas_" + job_id, prompt_datas);
        let _collect_command = "";
        let lastFileNameForClose = "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id;
        let callbackListen = async (stream: ClientChannel, done: Function, data: Buffer) => {
          _collect_command += data.toString();
          RecordCommandToFileLog({
            fileName: lastFileNameForClose,
            commandString: data.toString()
          })
          /* Catch if get prompt datas */
          let _watch_prompt_datas: Array<{
            key: string
            value: string
          }> = await masterData.getData("watch_prompt_datas_" + job_id, []) as any;
          for (var prIdx = 0; prIdx < _watch_prompt_datas.length; prIdx++) {
            if (data.includes(_watch_prompt_datas[prIdx].key) == true) {
              let itemCommand = await stream.write(_watch_prompt_datas[prIdx].value + '\r');
              // RecordCommandToFileLog({
              //   fileName: lastFileNameForClose,
              //   commandString: _watch_prompt_datas[prIdx].value
              // })
              // _watch_prompt_datas.splice(prIdx, 1);
              // await masterData.saveData("watch_prompt_datas_" + job_id, _watch_prompt_datas);
              break;
            }
          }
          // done("");
        };
        // sshPromise.on("data", callbackListen);
        RecordCommandToFileLog({
          fileName: lastFileNameForClose,
          commandString: command
        })
        let command_history = await sshPromise.write(command, callbackListen);
        RecordCommandToFileLog({
          fileName: lastFileNameForClose,
          commandString: command_history.toString() + "\n"
        })
        // await callbackListen(command_history as any);
        // sshPromise.off('data', callbackListen);
        masterData.saveData("data_pipeline_" + job_id, {
          pipeline_task_id: pipeline_task.id,
          command: command,
          command_history: _collect_command + command_history.toString() + "\n",
          parent: pipeline_task.temp_id
        })

      } catch (ex: any) {
        console.log("sftp - ex :: ", ex);
        masterData.saveData("data_pipeline_" + job_id + "_error", {
          pipeline_task_id: pipeline_task.id,
          message: ex.message,
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
  // console.log("props basic-command ::: ", props);
}