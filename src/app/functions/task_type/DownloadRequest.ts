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
import { constants, createWriteStream, existsSync, mkdirSync, writeFileSync, writeSync } from "fs";
import path from "path";
import upath from 'upath';
import SafeValue from "../base/SafeValue";

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
    execution,
    extra_var
  } = props;
  try {
    console.log("WriteTransfer ::::: ", props);
    let mergeVarScheme = MergeVarScheme(variable, schema, extra_var);
    let _data = pipeline_task.data;
    _data.command = "\r";
    let _parent_order_temp_ids = pipeline_task.parent_order_temp_ids;

    // NOTE YOU MUST ADD  \r for get trigger next task
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
              if (SafeValue(_data.asset_datas[aq2].is_folder, false) == true) {
                if (existsSync(upath.normalize(base_working_dir + "/" + _data.asset_datas[aq2].target_path)) == false) {
                  mkdirSync(upath.normalize(base_working_dir + "/" + _data.asset_datas[aq2].target_path), { recursive: true });
                }
                // Check if path have variable rendered
                _data.asset_datas[aq2].source_path = MustacheRender(_data.asset_datas[aq2].source_path, mergeVarScheme);

                // console.log("listFiles :: ", listFiles);
                function removeNonDuplicatePath(path1, path2) {
                  let newPath1 = path1.replace(path2, "");
                  let newPath11 = path1.replace(newPath1, "");
                  return newPath11;
                }
                function isDir(mode) {
                  return (mode & constants.S_IFMT) == constants.S_IFDIR;
                }
                let downloadsRecurd = async (basePathName, pathName) => {
                  let listFiles = await sftp.readdir(upath.normalize(basePathName + '/' + pathName));
                  for (let _ff = 0; _ff < listFiles.length; _ff++) {
                    try {
                      console.log("listFiles[_ff].path", removeNonDuplicatePath(basePathName + "/" + pathName + "/" + listFiles[_ff].filename, pathName + "/" + listFiles[_ff].filename))
                      let newPathProcess = removeNonDuplicatePath(basePathName + "/" + pathName + "/" + listFiles[_ff].filename, pathName + "/" + listFiles[_ff].filename);
                      if (isDir(listFiles[_ff].attrs.mode) == true) {
                        mkdirSync(upath.normalize(base_working_dir + "/" + _data.asset_datas[aq2].target_path + "/" + newPathProcess));
                        await downloadsRecurd(_data.asset_datas[aq2].source_path, listFiles[_ff].filename);
                      } else {
                        let pp = await sftp.readFile(upath.normalize(_data.asset_datas[aq2].source_path + "/" + pathName + "/" + listFiles[_ff].filename));
                        let newPath = upath.normalize(base_working_dir + "/" + _data.asset_datas[aq2].target_path + "/" + newPathProcess);
                        console.log("newPath :: ", newPath);
                        writeFileSync(newPath, pp);
                      }
                    } catch (ex) {
                      console.error("sftp.readFile :: ", ex);
                    }
                    // createWriteStream()
                  }
                }
                await downloadsRecurd(_data.asset_datas[aq2].source_path, "");
              } else {
                let _writeFileName = upath.normalize(base_working_dir + "/" + _data.asset_datas[aq2].target_path);
                if (existsSync(_writeFileName) == false) {
                  mkdirSync(_writeFileName, { recursive: true });
                }
                await sftp.fastGet(_data.asset_datas[aq2].source_path, _writeFileName)
              }

              RecordCommandToFileLog({
                fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
                commandString: "Fash Get :: " + _data.asset_datas[aq2].source_path + " to [storage-saved]:" + _data.asset_datas[aq2].target_path + "\n"
              })
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
          console.log("_data.asset_datas :: ", _data.asset_datas.length);
          console.log("_count_time_transfer :: ", _count_time_transfer);
          for (var r1 = 0; r1 < _data.asset_datas.length; r1++) {
            let ptyProcess = InitPtyProcess({
              commands: [],
              working_dir: base_working_dir
            }, filePRivateKey);
            ptyProcess.on('data', (data: any) => {
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
                    masterData.saveData("data_pipeline_" + job_id, {
                      pipeline_task_id: pipeline_task.id,
                      command: command,
                      parent: pipeline_task.temp_id
                    })
                  }
                  ptyProcess.write('exit' + '\r')
                  break;
                case data.includes('No such file or directory'):
                case data.includes('rsync error:'):
                  masterData.saveData("data_pipeline_" + job_id + "_error", {
                    pipeline_task_id: pipeline_task.id,
                    command: command,
                    parent: pipeline_task.temp_id
                  })
                  ptyProcess.write('exit' + '\r')
                  break;
              }
            });

            // Check if path have variable rendered
            _data.asset_datas[r1].source_path = MustacheRender(_data.asset_datas[r1].source_path, mergeVarScheme)

            if (SafeValue(_data.asset_datas[r1].is_folder, false) == true) {
              try {
                let pathDirectory = upath.normalize(base_working_dir + "/" + _data.asset_datas[r1].target_path);
                mkdirSync(pathDirectory, { recursive: true });
                _data.asset_datas[r1].source_path = upath.normalize(_data.asset_datas[r1].source_path) + "/";
              } catch (ex: any) {
                console.log("mkdirSync :: ", upath.normalize(base_working_dir + "/" + _data.asset_datas[r1].target_path));
                masterData.saveData("data_pipeline_" + job_id + "_error", {
                  pipeline_task_id: pipeline_task.id,
                  command: command,
                  parent: pipeline_task.temp_id,
                  message: "Catch the error : " + ex.message
                })
                return;
              }
            }
            // Set privatekey permission to valid for auth ssh
            if (filePRivateKey.identityFile != null) {
              ptyProcess.write("chmod 600 " + filePRivateKey.identityFile + "\r");
            }

            var rsync = Rsync.build({
              /* Support multiple source too */
              source: filePRivateKey.username + '@' + filePRivateKey.host + ':' + upath.normalize("/" + _data.asset_datas[r1].source_path),
              // source : upath.normalize(_local_path+'/'),
              destination: "." + upath.normalize("/" + _data.asset_datas[r1].target_path),
              /* Include First */
              include: [],// extraWatchs[index].includes || [],
              /* Exclude after include */
              exclude: [],//extraWatchs[index].ignores,
              // flags : '-vt',
              flags: '-avzLm',
              set: (_delete_mode_active == false ? '' : '--delete'),
              // set: '--size-only --checksum ' + (_delete_mode_active == false ? '' : '--delete'),
              // set : '--no-perms --no-owner --no-group',
              // set : '--chmod=D777,F777',
              // set : '--perms --chmod=u=rwx,g=rwx,o=,Dg+s',
              shell: 'ssh -i ' + filePRivateKey.identityFile + ' -p ' + filePRivateKey.port
            });
            ptyProcess.write(rsync.command() + '\r');
            ptyProcess.on('exit', (exitCode: any, signal: any) => {
              console.log("Node-pty :: Exit");
              ptyProcess.kill();
              ptyProcess = null;
            });
          }
          break;
      }
    }
    // console.log("command :::: ", command);
    masterData.setOnMultiSameListener("write_pipeline_" + job_id, async (props) => {
      for (var a = 0; a < _parent_order_temp_ids.length; a++) {
        console.log("props.parent ", props.parent);
        if (_parent_order_temp_ids[a] == props.parent) {
          console.log("DownloadRequest :: _parent_order_temp_ids[a]", _parent_order_temp_ids[a]);
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