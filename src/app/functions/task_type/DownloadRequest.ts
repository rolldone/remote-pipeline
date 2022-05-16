import SSH2Promise from "ssh2-promise";
import MergeVarScheme from "../MergeVarScheme";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { uniq } from "lodash";
import WritePrivateKeyToVariable from "../WritePrivateKeyToVariable";
import { TaskTypeInterface } from ".";
import Rsync from "@root/tool/rsync";
import InitPtyProcess from "../InitPtyProcess";
import RecordCommandToFileLog from "../RecordCommandToFileLog";
import MustacheRender from "../MustacheRender";
import { mkdirSync, writeFileSync, writeSync } from "fs";
import path from "path";
import upath from 'upath';

declare let masterData: MasterDataInterface;

const DownloadRequest = function (props: TaskTypeInterface) {
  let {
    sshPromise,
    variable,
    schema,
    pipeline_task,
    socket,
    resolve,
    rejected,
    raw_variable,
    job_id,
    execution
  } = props;
  try {
    console.log("WriteTransfer ::::: ", props);
    let mergeVarScheme = MergeVarScheme(variable, schema);
    let _data = pipeline_task.data;
    _data.command = "\r";
    let _parent_order_temp_ids = pipeline_task.parent_order_temp_ids;

    let command = MustacheRender(_data.command.toString() + "\r", mergeVarScheme);

    // console.log("mergeVarScheme :: ", mergeVarScheme);
    // console.log("schema :: ", schema);
    // console.log("_raw_variable :: ", raw_variable);
    // console.log("_command :: ", command);
    // console.log("_data :: ", _data);
    // console.log("_pipeline_task :: ", pipeline_task);

    let processWait = async () => {
      // Create folder on jobs/[job_id]/download
      let base_working_dir = process.cwd() + '/storage/app/jobs/' + job_id + '/download';
      try {
        mkdirSync(base_working_dir, { recursive: true });
      } catch (ex) { }

      // Store the privateKey string to be file and save it to storage/app/variables/{var_id}
      let filePRivateKey = await WritePrivateKeyToVariable.writePrivateKey({ sshPromise, execution });

      console.log("Download Request Command :: Called ");
      switch (_data.method_type) {
        case 'sftp':
          try {
            let sftp = await sshPromise.sftp();
            for (var aq2 = 0; aq2 < _data.asset_datas.length; aq2++) {
              try {
                let pathDirname = upath.normalize(path.dirname(base_working_dir + "/" + _data.asset_datas[aq2].target_path));
                mkdirSync(pathDirname, { recursive: true });
              } catch (ex) { }
              writeFileSync(upath.normalize(base_working_dir + "/" + _data.asset_datas[aq2].target_path), '');
              await sftp.fastGet(_data.asset_datas[aq2].source_path, upath.normalize(base_working_dir + _data.asset_datas[aq2].target_path))
              RecordCommandToFileLog({
                fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
                commandString: "Fash Get :: " + _data.asset_datas[aq2].source_path + " to [storage-saved]:" + _data.asset_datas[aq2].target_path + "\n"
              })
            }
            masterData.saveData("data_pipeline_" + pipeline_task.pipeline_item_id, {
              pipeline_task_id: pipeline_task.id,
              command: command,
              parent: pipeline_task.temp_id
            })
          } catch (ex) {
            console.log("sftp - ex :: ", ex);
            masterData.saveData("data_pipeline_" + pipeline_task.pipeline_item_id + "_error", {
              pipeline_task_id: pipeline_task.id,
              command: command,
              parent: pipeline_task.temp_id
            })
          }
          break;
        case 'rsync':
          // For now keep delete mode is false
          let _delete_mode_active = false;
          // Set max total times running node-pty. And go to  next pipeline task
          let _total_times_transfer = _data.asset_datas.length;
          let _count_time_transfer = 0;
          for (var r1 = 0; r1 < _data.asset_datas.length; r1++) {
            let ptyProcess = InitPtyProcess({
              commands: [],
              working_dir: base_working_dir
            }, filePRivateKey);
            ptyProcess.on('data', (data: any) => {
              // let _split = data.split(/\n/);
              // if (_split != "") {
              //   for (var af2 = 0; af2 < _split.length; af2++) {
              //     switch (_split[af2]) {
              //       case '':
              //       case '\r':
              //       case '\u001b[32m\r':
              //         break;
              //       default:
              //         console.log(_split[af2].toString() + '\n');
              //         break;
              //     }
              //   }
              // }
              if (data.includes('failed: Not a directory')) {
                // _is_file = true;
              }

              RecordCommandToFileLog({
                fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
                commandString: data.toString()
              })

              switch (true) {
                case data.includes('Are you sure you want to continue connecting'):
                  ptyProcess.write('yes\r')
                  break;
                case data.includes('Enter passphrase for key'):
                case data.includes('password:'):
                  ptyProcess.write(filePRivateKey.password + '\r')
                  break;
                case data.includes('total size'):
                  _count_time_transfer += 1;
                  if (_total_times_transfer == _count_time_transfer) {
                    ptyProcess.write('exit' + '\r')
                    masterData.saveData("data_pipeline_" + pipeline_task.pipeline_item_id, {
                      pipeline_task_id: pipeline_task.id,
                      command: command,
                      parent: pipeline_task.temp_id
                    })
                  }
                  break;
                case data.includes('No such file or directory'):
                case data.includes('rsync error:'):
                  ptyProcess.write('exit' + '\r')
                  masterData.saveData("data_pipeline_" + pipeline_task.pipeline_item_id + "_error", {
                    pipeline_task_id: pipeline_task.id,
                    command: command,
                    parent: pipeline_task.temp_id
                  })
                  break;
              }
            });
            try {
              let pathDirname = upath.normalize(path.dirname(base_working_dir + "/" + _data.asset_datas[r1].target_path));
              mkdirSync(pathDirname, { recursive: true });
            } catch (ex) { }
            writeFileSync(upath.normalize(base_working_dir + "/" + _data.asset_datas[r1].target_path), '');
            // Set privatekey permission to valid for auth ssh
            if (filePRivateKey.identityFile != null) {
              ptyProcess.write("chmod 600 " + filePRivateKey.identityFile + "\r");
            }
            var rsync = Rsync.build({
              /* Support multiple source too */
              source: filePRivateKey.username + '@' + filePRivateKey.host + ':' + _data.asset_datas[r1].source_path,
              // source : upath.normalize(_local_path+'/'),
              destination: "./" + _data.asset_datas[r1].target_path,
              /* Include First */
              include: [],// extraWatchs[index].includes || [],
              /* Exclude after include */
              exclude: [],//extraWatchs[index].ignores,
              // flags : '-vt',
              flags: '-avzLm',
              set: '--size-only --checksum ' + (_delete_mode_active == false ? '' : '--delete'),
              // set : '--no-perms --no-owner --no-group',
              // set : '--chmod=D777,F777',
              // set : '--perms --chmod=u=rwx,g=rwx,o=,Dg+s',
              shell: 'ssh -i ' + filePRivateKey.identityFile + ' -p ' + filePRivateKey.port
            });
            ptyProcess.write(rsync.command() + '\r');
            ptyProcess.on('exit', (exitCode: any, signal: any) => {
              ptyProcess.kill();
              ptyProcess = null;
            });
          }
          break;
      }
    }
    // console.log("command :::: ", command);
    masterData.setOnListener("write_pipeline_" + pipeline_task.pipeline_item_id, async (props) => {
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

export default DownloadRequest;