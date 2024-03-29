import MergeVarScheme from "../../MergeVarScheme";
import WritePrivateKeyToVariable from "../../WritePrivateKeyToVariable";
import Rsync from "@root/tool/rsync";
import InitPtyProcess from "../../InitPtyProcess";
import RecordCommandToFileLog from "../../RecordCommandToFileLog";
import MustacheRender from "../../MustacheRender";
import upath from 'upath';
import FlyDriveConfig from "@root/config/FlyDriveConfig";
import File2Service from "@root/app/services/File2Service";
import { StorageManager } from "@slynova/flydrive";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { uniq } from "lodash";
import { TaskTypeInterface } from "..";
import { existsSync, mkdirSync, writeFileSync } from "fs";

declare let masterData: MasterDataInterface
declare let storage: StorageManager

export default async function (props: TaskTypeInterface) {
  let {
    sshPromise,
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
    let _parent_order_temp_ids = pipeline_task.parent_order_temp_ids;
    let _condition_values = _data.condition_values;
    let isPassed = false;

    // NOTE YOU MUST ADD  \r for get trigger next task
    _data.command = "\r";
    let command = MustacheRender(_data.command.toString(), mergeVarScheme);
    // console.log("mergeVarScheme :: ", mergeVarScheme);
    // console.log("schema :: ", schema);
    // console.log("_raw_variable :: ", raw_variable);
    // console.log("_command :: ", command);
    // console.log("_data :: ", _data);
    // console.log("_pipeline_task :: ", pipeline_task);

    let processWait = async () => {
      let _files = [];
      for (var au2 = 0; au2 < _data.asset_datas.length; au2++) {
        console.log("_data.asset_datas :: ", _data.asset_datas);
        for (var b = 0; b < mergeVarScheme[_data.asset_datas[au2].name].length; b++) {
          let _ioir = mergeVarScheme[_data.asset_datas[au2].name][b];
          // if (_ioir.file[0].originalname != null) {
          //   _files.push(_ioir.file[0].originalname);
          // }
          if (_ioir.name != null) {
            try {
              if (existsSync(upath.normalize(`${process.cwd()}/storage/app/executions/${execution.id}/files`)) == false) {
                mkdirSync(upath.normalize(`${process.cwd()}/storage/app/executions/${execution.id}/files`), {
                  recursive: true
                });
              }
              let assetData = await File2Service.getFileById(_ioir.id);
              let readFile = await storage.disk(FlyDriveConfig.FLY_DRIVE_DRIVER).getBuffer(upath.normalize(`${assetData.user_id}/${assetData.path}/${assetData.name}`));
              writeFileSync(upath.normalize(`${process.cwd()}/storage/app/executions/${execution.id}/files/${_ioir.name}`), readFile.content);
            } catch (ex) {
              masterData.saveData("data_pipeline_" + job_id + "_error", {
                pipeline_task_id: pipeline_task.id,
                command: command,
                parent: pipeline_task.temp_id,
                message: "Error :: " + pipeline_task.temp_id + " - " + pipeline_task.name + ` :: On Copy File ${_ioir.name} From storage to variable get problem`
              })
              break;
            }
            _files.push(_ioir.name);
          }
        }
      }


      // Remove duplicate data on array
      _files = uniq(_files);
      // Store the privateKey string to be file and save it to storage/app/executions/{var_id}
      let filePRivateKey = await WritePrivateKeyToVariable.writePrivateKey({ sshPromise, execution });

      console.log("File Transfer command :: Called ");
      switch (_data.method_type) {
        case 'sftp':
          try {
            let sftp = await sshPromise.sftp();
            for (var aq2 = 0; aq2 < _data.asset_datas.length; aq2++) {
              for (var amg2 = 0; amg2 < _files.length; amg2++) {

                // Check if contain mustache 
                _data.asset_datas[aq2].target_path = MustacheRender(_data.asset_datas[aq2].target_path, mergeVarScheme);
                let foldeRfile = _data.asset_datas[aq2].target_path + "/" + _files[amg2];

                let arrayPath = foldeRfile.split("/");
                let newPath = "";
                let lastCreated = null;
                for (let a = 0; a < arrayPath.length; a++) {
                  newPath = newPath + (arrayPath[a - 1] || '') + "/";
                  if (arrayPath[a] == "") { }
                  else {
                    if (upath.normalize(newPath) != "/") {
                      try {
                        await sftp.mkdir(upath.normalize(newPath));
                      } catch (ex) {
                        RecordCommandToFileLog({
                          fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
                          commandString: "Create folder :: " + upath.normalize(newPath) + " is exist.\n"
                        })
                      }
                    }
                  }
                }
                await sftp.fastPut(process.cwd() + '/storage/app/executions/' + execution.id + "/files/" + _files[amg2], _data.asset_datas[aq2].target_path + "/" + _files[amg2], {})
                RecordCommandToFileLog({
                  fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
                  commandString: "Fash Put :: " + _data.asset_datas[aq2].target_path + "/" + _files[amg2] + "\n"
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

            let selectdConfigPrivate = null;

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

              for (let afr = 0; afr < filePRivateKey.length; afr++) {
                switch (true) {
                  case data.includes(filePRivateKey[afr].catchString):
                    selectdConfigPrivate = filePRivateKey[afr];
                    break;
                }
              }

              switch (true) {
                case data.includes('Are you sure you want to continue connecting'):
                  ptyProcess.write('yes\r')
                  break;
                case data.includes('Enter passphrase for key'):
                case data.includes('password:'):
                  ptyProcess.write(selectdConfigPrivate.password + '\r')
                  break;
                case data.includes('total size'):
                  _count_time_transfer += 1;
                  ptyProcess.write('exit' + '\r')
                  if (_total_times_transfer == _count_time_transfer) {
                    masterData.saveData("data_pipeline_" + job_id, {
                      pipeline_task_id: pipeline_task.id,
                      command: command,
                      parent: pipeline_task.temp_id
                    })
                  }
                  break;
                case data.includes('key_load_public: No such file or directory'):
                  // Ignore
                  break;
                case data.includes('No such file or directory'):
                case data.includes('rsync error:'):
                  ptyProcess.write('exit' + '\r')
                  masterData.saveData("data_pipeline_" + job_id + "_error", {
                    pipeline_task_id: pipeline_task.id,
                    command: command,
                    parent: pipeline_task.temp_id
                  })
                  break;
              }
            });

            // Check if contain mustache 
            _data.asset_datas[r1].target_path = MustacheRender(_data.asset_datas[r1].target_path, mergeVarScheme);

            ptyProcess.write("cd " + process.cwd() + '/storage/app/executions/' + execution.id + "/files\r");
            // Set privatekey permission to valid for auth ssh
            // if (filePRivateKey.identityFile != null) {
            //   ptyProcess.write("chmod 600 " + filePRivateKey.identityFile + "\r");
            // }

            for (let afr = 0; afr < filePRivateKey.length; afr++) {
              ptyProcess.write("chmod 600 " + filePRivateKey[afr].identityFile + "\r");
            }

            let lastFilePRivateKey = filePRivateKey[filePRivateKey.length - 1];

            let shellSSHForRsync = null;
            if (lastFilePRivateKey.proxyCommand == null) {
              shellSSHForRsync = `ssh -v -F ${lastFilePRivateKey.sshConfigPath} -p ${lastFilePRivateKey.port} -i ${lastFilePRivateKey.identityFile}`;
            } else {
              shellSSHForRsync = `ssh -v -F ${lastFilePRivateKey.sshConfigPath} -p ${lastFilePRivateKey.port} -i ${lastFilePRivateKey.identityFile} -o ProxyCommand="${lastFilePRivateKey.proxyCommand}"`;
            }

            var rsync = Rsync.build({
              /* Support multiple source too */
              source: "./",
              // source : upath.normalize(_local_path+'/'),
              destination: lastFilePRivateKey.username + '@' + lastFilePRivateKey.host + ':' + _data.asset_datas[r1].target_path,
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
              // shell: 'ssh -i ' + filePRivateKey.identityFile + ' -p ' + filePRivateKey.port

              // DONT USE SSH CONFIG NAME FOR FIRST RUN RSYNC
              // You WILL GET BAD SEND COMMAND ON RSYNC SERVER
              shell: shellSSHForRsync
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