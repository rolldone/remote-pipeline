import MergeVarScheme from "../../MergeVarScheme";
import InitPtyProcess from "../../InitPtyProcess";
import Rsync from "@root/tool/rsync";
import WritePrivateKeyToVariable from "../../WritePrivateKeyToVariable";
import RecordCommandToFileLog from "../../RecordCommandToFileLog";
import MustacheRender from "../../MustacheRender";
import MkdirReqursive from "../../sftp/Mkdir";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { TaskTypeInterface } from "..";

declare let masterData: MasterDataInterface;

const RepoInstall = function (props: TaskTypeInterface) {
  let {
    sshPromise,
    variable,
    schema,
    pipeline_task,
    socket,
    execution,
    resolve,
    rejected,
    raw_variable,
    job_id,
    extra_var
  } = props;
  try {
    let mergeVarScheme = MergeVarScheme(variable, schema, extra_var);
    let _data = pipeline_task.data;
    let _parent_order_temp_ids = pipeline_task.parent_order_temp_ids;

    // NOTE YOU MUST ADD  \r for get trigger next task
    let command = MustacheRender(_data.command.toString() + "\r", mergeVarScheme);

    let processWait = async () => {

      // Store the privateKey string to be file and save it to storage/app/variables/{var_id}
      let filePRivateKey = await WritePrivateKeyToVariable.writePrivateKey({ sshPromise, execution });

      if (execution.branch == null) {
        // Ignore it
        masterData.saveData("data_pipeline_" + job_id, {
          pipeline_task_id: pipeline_task.id,
          command: command,
          parent: pipeline_task.temp_id
        })
        return;
      }
      let ptyProcess = InitPtyProcess({
        working_dir: process.cwd() + '/storage/app/executions/' + execution.id + '/repo/' + execution.branch, // process.cwd() + '/storage/app/jobs/' + job_id + '/repo/' + execution.branch,
        commands: []
      });
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
            ptyProcess.write('exit' + '\r')
            masterData.saveData("data_pipeline_" + job_id, {
              pipeline_task_id: pipeline_task.id,
              command: command,
              parent: pipeline_task.temp_id
            })
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
      // Set privatekey permission to valid for auth ssh
      if (filePRivateKey.identityFile != null) {
        ptyProcess.write("chmod 600 " + filePRivateKey.identityFile + "\r");
      }
      
      // Check if path have variable rendered
      _data.target_path = MustacheRender(_data.target_path,mergeVarScheme);

      let _delete_mode_active = _data.transfer_mode == "force" ? true : false;
      var rsync = Rsync.build({
        /* Support multiple source too */
        source: "./",
        // source : upath.normalize(_local_path+'/'),
        destination: filePRivateKey.username + '@' + filePRivateKey.host + ':' + _data.target_path,
        /* Include First */
        include: [],
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

      // Use sftp to create folder first
      let sftp = await sshPromise.sftp();
      await MkdirReqursive(sftp, _data.target_path);

      // Run the rsync
      ptyProcess.write(rsync.command() + '\r');
    }

    // console.log("command :::: ", command);
    masterData.setOnMultiSameListener("write_pipeline_" + job_id, async (props) => {
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

export default RepoInstall;