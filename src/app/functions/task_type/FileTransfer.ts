import SSH2Promise from "ssh2-promise";
import mustache from 'mustache';
import MergeVarScheme from "./MergeVarScheme";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { uniq } from "lodash";
import WritePrivateKeyToVariable from "../WritePrivateKeyToVariable";
import { TaskTypeInterface } from ".";
import Rsync from "@root/tool/rsync";
import InitPtyProcess from "../InitPtyProcess";

declare let masterData: MasterDataInterface

export default async function (props: TaskTypeInterface) {
  let {
    sshPromise,
    variable,
    schema,
    pipeline_task,
    socket,
    raw_variable
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
    console.log("schema :: ", schema);
    console.log("_raw_variable :: ", raw_variable);
    console.log("_command :: ", command);
    console.log("_data :: ", _data);
    console.log("_pipeline_task :: ", pipeline_task);
    masterData.setOnListener("write_pipeline_" + pipeline_task.pipeline_item_id, async (props) => {
      console.log("_parent_order_temp_ids :: ", _parent_order_temp_ids);

      for (var a = 0; a < _parent_order_temp_ids.length; a++) {
        if (_parent_order_temp_ids[a] == props.parent) {
          // console.log("File Transfer command :: Called ");
          switch (_data.method_type) {
            case 'sftp':
              let _files = [];
              for (var a = 0; a < _data.asset_datas.length; a++) {
                for (var b = 0; b < mergeVarScheme[_data.asset_datas[a].name].length; b++) {
                  let _ioir = mergeVarScheme[_data.asset_datas[a].name][b];
                  if (_ioir.file[0].originalname != null) {
                    _files.push(_ioir.file[0].originalname);
                  }
                }
              }
              _files = uniq(_files);
              let filePRivateKey = await WritePrivateKeyToVariable.writePrivateKey({ sshPromise, raw_variable });

              let _delete_mode_active = false;
              let _total_times_transfer = _data.asset_datas.length;
              let _count_time_transfer = 0;
              for (var a = 0; a < _data.asset_datas.length; a++) {
                let ptyProcess = InitPtyProcess([], filePRivateKey);
                console.log("filePRivateKey :: ", filePRivateKey);
                ptyProcess.on('data', (data: any) => {
                  let _split = data.split(/\n/);// this._stripAnsi(data.toString());
                  if (_split != "") {
                    for (var a = 0; a < _split.length; a++) {
                      switch (_split[a]) {
                        case '':
                        case '\r':
                        case '\u001b[32m\r':
                          break;
                        default:
                          // process.stdout.write('Rsync Download |');
                          // process.stdout.write(this._stripAnsi(_split[a]).replace('X', '') + '\n');
                          // process.stdout.write(_split[a].toString());
                          console.log(_split[a].toString() + '\n');
                          break;
                      }
                    }
                  }
                  if (data.includes('failed: Not a directory')) {
                    // _is_file = true;
                  }

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
                          command: command,
                          parent: pipeline_task.temp_id
                        })
                      }
                      break;
                    case data.includes('No such file or directory'):
                    case data.includes('rsync error:'):
                      // _ptyProcess.write('exit' + '\r')
                      masterData.saveData("data_pipeline_" + pipeline_task.pipeline_item_id + "_error", {
                        command: command,
                        parent: pipeline_task.temp_id
                      })
                      break;
                  }
                });
                // ptyProcess.write("ls -a -l" + '\r');
                ptyProcess.write("chmod 600 " + filePRivateKey.identityFile + "\r");
                var rsync = Rsync.build({
                  /* Support multiple source too */
                  source: process.cwd() + '/storage/app/' + raw_variable.id + "/",
                  // source : upath.normalize(_local_path+'/'),
                  destination: filePRivateKey.username + '@' + filePRivateKey.host + ':' + _data.asset_datas[a].target_path,
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
                console.log("RSYNC ::: ", rsync.command());
                ptyProcess.write(rsync.command() + '\r');
                ptyProcess.on('exit', (exitCode: any, signal: any) => {
                  // process.stdin.off('keypress', theCallback);
                  ptyProcess.kill();
                  ptyProcess = null;
                });
              }
              break;
            case 'rsync':
              break;
          }
          // masterData.saveData("data_pipeline_" + pipeline_task.pipeline_item_id, {
          //   command: command,
          //   parent: pipeline_task.temp_id
          // })
          break;
        }
      }
    })

    return {
      parent: pipeline_task.temp_id,
      command: command
    }

  } catch (ex) {
    throw ex;
  }
}