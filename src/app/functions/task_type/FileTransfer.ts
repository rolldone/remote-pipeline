import SSH2Promise from "ssh2-promise";
import mustache from 'mustache';
import MergeVarScheme from "./MergeVarScheme";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { uniq } from "lodash";
import sftpsyncdeploy from 'sftp-sync-deploy';
import sftp2sync from 'sftp2sync';
declare let masterData: MasterDataInterface

export default async function (props: {
  raw_variable: any,
  sshPromise: SSH2Promise,
  variable: any
  schema: any
  pipeline_task: any
  socket: any
  resolve: Function
  rejected: Function
}) {
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
      for (var a = 0; a < _parent_order_temp_ids.length; a++) {
        if (_parent_order_temp_ids[a] == props.parent) {
          // console.log("File Transfer command :: Called ");
          switch (_data.method_type) {
            case 'sftp':
              let _files = [];
              for (var a = 0; a < _data.asset_datas.length; a++) {
                for (var b = 0; b < mergeVarScheme[_data.asset_datas[a].name].length; b++) {
                  let _ioir = mergeVarScheme[_data.asset_datas[a].name][b];
                  console.log("kkkkkkkkkkkkkkkkk :: ", _ioir.file[0]);
                  if (_ioir.file[0].originalname != null) {
                    _files.push(_ioir.file[0].originalname);
                  }
                }
              }
              _files = uniq(_files);
              for (var a = 0; a < _data.asset_datas.length; a++) {
                for (var a2 = 0; a2 < _files.length; a2++) {
                  console.log("_files ::::: ", _files);
                  console.log("process.cwd()", process.cwd());
                  // sftp2sync.upload(process.cwd()+'/storage/app/'+raw_variable.id,_data.asset_datas[a].target_path,false,[''],{
                  //   port: sshPromise.config.port,
                  //   host: sshPromise.config.host,
                  //   username: sshPromise.config.username,
                  //   privateKey: sshPromise.config.privateKey,
                  //   passphrase: sshPromise.config.passphrase,
                  //   password: sshPromise.config.password,
                  // })
                  await sftpsyncdeploy({
                    localDir: process.cwd() + '/storage/app/' + raw_variable.id + '/' + _files[a2],
                    remoteDir: _data.asset_datas[a].target_path,
                    port: sshPromise.config[0].port,
                    host: sshPromise.config[0].host,
                    username: sshPromise.config[0].username,
                    privateKey: sshPromise.config[0].privateKey.toString(),
                    passphrase: sshPromise.config[0].passphrase,
                    password: sshPromise.config[0].password,
                  }, {
                    dryRun: false,                  // Enable dry-run mode. Default to false
                    exclude: [],
                    excludeMode: 'remove',          // Behavior for excluded files ('remove' or 'ignore'), Default to 'remove'.
                    forceUpload: false              // Force uploading all files, Default to false(upload only newer files).
                  })
                }

              }
              break;
            case 'rsync':
              break;
          }
          masterData.saveData("data_pipeline_" + pipeline_task.pipeline_item_id, {
            command: command,
            parent: pipeline_task.temp_id
          })
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