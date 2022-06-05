import SSH2Promise from "ssh2-promise";
import MergeVarScheme from "../../MergeVarScheme";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { TaskTypeInterface } from "../.";
import InitPtyProcess from "../../InitPtyProcess";
import Rsync from "@root/tool/rsync";
import RecordCommandToFileLog from "../../RecordCommandToFileLog";
import WritePrivateKeyToVariable from "../../WritePrivateKeyToVariable";
import MustacheRender from "../../MustacheRender";
import AppConfig from "@root/config/AppConfig";

declare let masterData: MasterDataInterface;


const FullRemoteSyncronise = function (props: TaskTypeInterface) {
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
    let mergeVarScheme = MergeVarScheme(variable, schema, extra_var);
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
      let socket = await sshPromise.shell();
      let sftp = await sshPromise.sftp();

      let hostport = (_data.host + "_" + _data.port).toString().replace(/\./g, "_");
      let privateKeyPathName = _data.private_key_path + "/" + hostport;
      if (_data.auth_type == "private_key") {
        let resultRender = MustacheRender(_data.private_key, mergeVarScheme);
        await sftp.writeFile(privateKeyPathName, resultRender, {});
        await sftp.chmod(privateKeyPathName, "600");
      }

      socket.on('data', (data) => {
        if (data.includes('failed: Not a directory')) {
          // _is_file = true;
        }
        RecordCommandToFileLog({
          fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
          commandString: data.toString()
        })
        console.log("Full Remote Command :: ", data.toString());
        switch (true) {
          case data.includes('Are you sure you want to continue connecting'):
            socket.write('yes\r')
            break;
          case data.includes('Enter passphrase for key'):
            socket.write(_data.passphrase + '\r');
            break;
          case data.includes('password:'):
            socket.write(_data.password + '\r')
            break;
          case data.includes('total size'):
            // socket.write('exit' + '\r')
            socket.write("rm " + privateKeyPathName)
            masterData.saveData("data_pipeline_" + job_id, {
              pipeline_task_id: pipeline_task.id,
              command: command,
              parent: pipeline_task.temp_id
            })
            break;
          case data.includes('No such file or directory'):
          case data.includes('rsync error:'):
            // socket.write('exit' + '\r')
            masterData.saveData("data_pipeline_" + job_id + "_error", {
              pipeline_task_id: pipeline_task.id,
              command: command,
              parent: pipeline_task.temp_id
            })
            break;
        }
      });
      let _delete_mode_active = _data.transfer_mode == "force" ? true : false;

      let _excludes = _data.exclude.split("\n");
      let _includes = _data.include.split("\n");

      console.log("_exclude ::::: ", _excludes);
      console.log("_include ::::: ", _includes);

      var rsync = Rsync.build({
        /* Support multiple source too */
        source: _data.transfer_action == "upload" ? "./" : _data.username + '@' + _data.host + ':' + _data.target_path,
        // source : upath.normalize(_local_path+'/'),
        destination: _data.transfer_action == "upload" ? _data.username + '@' + _data.host + ':' + _data.target_path : _data.working_dir,
        /* Include First */
        include: _includes,
        /* Exclude after include */
        exclude: _excludes,//extraWatchs[index].ignores,
        // flags : '-vt',
        flags: '-avzLm',
        set: '--size-only --checksum ' + (_delete_mode_active == false ? '' : '--delete'),
        // set : '--no-perms --no-owner --no-group',
        // set : '--chmod=D777,F777',
        // set : '--perms --chmod=u=rwx,g=rwx,o=,Dg+s',
        shell: (() => {
          if (_data.auth_type == "private_key") {
            return 'ssh -i ' + privateKeyPathName + ' -p ' + _data.port
          } else if (_data.auth_type == "basic_auth") {
            return 'ssh -p ' + _data.port
          } else {
            // Local
            return "";
          }
        })()
      });
      // Its important cd to working directory
      socket.write("cd " + _data.working_dir + "\r");
      console.log('rsync.command() :: ', rsync.command())
      socket.write(rsync.command() + '\r');
    }
    masterData.setOnListener("write_pipeline_" + job_id, async (props) => {
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
}

export default FullRemoteSyncronise;