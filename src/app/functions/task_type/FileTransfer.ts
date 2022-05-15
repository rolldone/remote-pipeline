import SSH2Promise from "ssh2-promise";
import mustache from 'mustache';
import MergeVarScheme from "../MergeVarScheme";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { uniq } from "lodash";
import WritePrivateKeyToVariable from "../WritePrivateKeyToVariable";
import { TaskTypeInterface } from ".";
import Rsync from "@root/tool/rsync";
import InitPtyProcess from "../InitPtyProcess";
import RecordCommandToFileLog from "../RecordCommandToFileLog";

declare let masterData: MasterDataInterface

export default async function (props: TaskTypeInterface) {
  let {
    sshPromise,
    variable,
    schema,
    pipeline_task,
    socket,
    raw_variable,
    execution,
    job_id
  } = props;

  try {
    let mergeVarScheme = MergeVarScheme(variable, schema);
    let _data = pipeline_task.data;
    let _parent_order_temp_ids = pipeline_task.parent_order_temp_ids;
    let _condition_values = _data.condition_values;
    let isPassed = false;
    _data.command = "\r";
    let command = mustache.render(_data.command.toString(), mergeVarScheme);
    // console.log("mergeVarScheme :: ", mergeVarScheme);
    // console.log("schema :: ", schema);
    // console.log("_raw_variable :: ", raw_variable);
    // console.log("_command :: ", command);
    // console.log("_data :: ", _data);
    // console.log("_pipeline_task :: ", pipeline_task);

    let processWait = async() => {
      let _files = [];
      for (var au2 = 0; au2 < _data.asset_datas.length; au2++) {
        for (var b = 0; b < mergeVarScheme[_data.asset_datas[au2].name].length; b++) {
          let _ioir = mergeVarScheme[_data.asset_datas[au2].name][b];
          if (_ioir.file[0].originalname != null) {
            _files.push(_ioir.file[0].originalname);
          }
        }
      }
      // Remove duplicate data on array
      _files = uniq(_files);
      // Store the privateKey string to be file and save it to storage/app/variables/{var_id}
      let filePRivateKey = await WritePrivateKeyToVariable.writePrivateKey({ sshPromise, execution });

      console.log("File Transfer command :: Called ");
      switch (_data.method_type) {
        case 'sftp':
          try {
            let sftp = await sshPromise.sftp();
            for (var aq2 = 0; aq2 < _data.asset_datas.length; aq2++) {
              for (var amg2 = 0; amg2 < _files.length; amg2++) {
                await sftp.fastPut(process.cwd() + '/storage/app/variables/' + raw_variable.id + "/" + _files[amg2], _data.asset_datas[aq2].target_path + "/" + _files[amg2])
                RecordCommandToFileLog({
                  fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
                  commandString: "Fash Put :: " + _data.asset_datas[aq2].target_path + "/" + _files[amg2]
                })
              }
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
              working_dir: process.cwd()
            }, filePRivateKey);
            ptyProcess.on('data', (data: any) => {
              let _split = data.split(/\n/);
              if (_split != "") {
                for (var af2 = 0; af2 < _split.length; af2++) {
                  switch (_split[af2]) {
                    case '':
                    case '\r':
                    case '\u001b[32m\r':
                      break;
                    default:
                      console.log(_split[af2].toString() + '\n');
                      break;
                  }
                }
              }
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
            ptyProcess.write("cd " + process.cwd() + '/storage/app/variables/' + raw_variable.id + "/\r");
            // Set privatekey permission to valid for auth ssh
            if (filePRivateKey.identityFile != null) {
              ptyProcess.write("chmod 600 " + filePRivateKey.identityFile + "\r");
            }
            var rsync = Rsync.build({
              /* Support multiple source too */
              source: "./",
              // source : upath.normalize(_local_path+'/'),
              destination: filePRivateKey.username + '@' + filePRivateKey.host + ':' + _data.asset_datas[r1].target_path,
              /* Include First */
              include: ((_files) => {
                let _asset = [];
                _asset.push("*/");
                for (var a23 = 0; a23 < _files.length; a23++) {
                  _asset.push(_files[a23]);
                }
                return _asset;
              })(_files),// extraWatchs[index].includes || [],
              /* Exclude after include */
              exclude: ["*"],//extraWatchs[index].ignores,
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

    masterData.setOnListener("write_pipeline_" + pipeline_task.pipeline_item_id, async (props) => {
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