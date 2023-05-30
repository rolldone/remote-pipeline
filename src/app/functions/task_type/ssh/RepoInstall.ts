import MergeVarScheme from "../../MergeVarScheme";
import InitPtyProcess from "../../InitPtyProcess";
import Rsync from "@root/tool/rsync";
import WritePrivateKeyToVariable from "../../WritePrivateKeyToVariable";
import RecordCommandToFileLog from "../../RecordCommandToFileLog";
import MustacheRender from "../../MustacheRender";
import MkdirReqursive from "../../sftp/Mkdir";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import { TaskTypeInterface } from "..";
import { promisify } from "util";
import { readdir, stat } from "fs";
import upath from 'upath';
import path from "path";
import { allLimit, mapLimit } from "async";
import GetStatInfo from "../../base/GetStatInfo";
import { SftpSsh2 } from "../../base/Ssh2";
import micromatch from 'micromatch';

declare let masterData: MasterDataInterface;

const RepoInstall = function (props: TaskTypeInterface) {
  let {
    sshPromise,
    variable,
    schema,
    pipeline_task,
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
    let command = "";
    try {
      command = MustacheRender(_data.command.toString() + "\r", mergeVarScheme);
    } catch (error) {
      command = "\r";
    }

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
      let _local_path = process.cwd() + '/storage/app/executions/' + execution.id + '/repo/' + execution.branch;
      let ptyProcess = InitPtyProcess({
        working_dir: _local_path, // process.cwd() + '/storage/app/jobs/' + job_id + '/repo/' + execution.branch,
        commands: []
      });
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
            ptyProcess.write('exit' + '\r')
            masterData.saveData("data_pipeline_" + job_id, {
              pipeline_task_id: pipeline_task.id,
              command: command,
              parent: pipeline_task.temp_id
            })
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

      for (let afr = 0; afr < filePRivateKey.length; afr++) {
        ptyProcess.write("chmod 600 " + filePRivateKey[afr].identityFile + "\r");
      }

      let lastFilePRivateKey = filePRivateKey[filePRivateKey.length - 1];

      // Check if path have variable rendered
      _data.target_path = MustacheRender(_data.target_path, mergeVarScheme);

      let _delete_mode_active = _data.transfer_mode == "force" ? true : false;

      let shellSSHForRsync = null;
      if (lastFilePRivateKey.proxyCommand == null) {
        shellSSHForRsync = `ssh -v -F ${lastFilePRivateKey.sshConfigPath} -p ${lastFilePRivateKey.port} -i ${lastFilePRivateKey.identityFile}`;
      } else {
        shellSSHForRsync = `ssh -v -F ${lastFilePRivateKey.sshConfigPath} -p ${lastFilePRivateKey.port} -i ${lastFilePRivateKey.identityFile} -o ProxyCommand="${lastFilePRivateKey.proxyCommand}"`;
      }
      let str = _data.include;
      if (str == "*") {
        str = "/*\n";
      }
      const _include = str == "" ? [] : str.split('\n');

      str = _data.exclude;
      if (str == "*") {
        str = "/*\n";
      }
      const _exclude = str == "" ? [] : str.split('\n');

      // Use sftp to create folder first
      let sftp = await sshPromise.sftp();
      switch (_data.method_type) {
        case 'rsync':
        default:
          // This is rsync
          var rsync = Rsync.build({
            /* Support multiple source too */
            source: "./",
            // source : upath.normalize(_local_path+'/'),
            destination: lastFilePRivateKey.username + '@' + lastFilePRivateKey.host + ':' + _data.target_path,
            /* Include First */
            include: _include,
            /* Exclude after include */
            exclude: _exclude,//extraWatchs[index].ignores,
            // flags : '-vt',
            flags: '-avzLm',
            set: '--size-only --checksum ' + (_delete_mode_active == false ? '' : '--delete'),
            // set : '--no-perms --no-owner --no-group',
            // set : '--chmod=D777,F777',
            // set : '--perms --chmod=u=rwx,g=rwx,o=,Dg+s',
            // shell: 'ssh -v -i ' + lastFilePRivateKey.identityFile + ' -p ' + filePRivateKey.port

            // DONT USE SSH CONFIG NAME FOR FIRST RUN RSYNC
            // You WILL GET BAD SEND COMMAND ON RSYNC SERVER
            shell: shellSSHForRsync
          });

          await MkdirReqursive(sftp, _data.target_path);
          // Run the rsync
          ptyProcess.write(rsync.command() + '\r');

          break;
        case 'sftp':
          // This is sftp
          const deleteDirectory = async function (sftp: SftpSsh2, directoryPath) {
            try {
              const files = await sftp.readdir(directoryPath) as any;
              for (const file of files) {
                const filePath = `${directoryPath}/${file.filename}`;
                if (GetStatInfo(file.attrs.permissions, "directory") == true) {
                  // Recursively delete subdirectories
                  await deleteDirectory(sftp, filePath);
                } else {
                  // Delete files
                  await sftp.unlink(filePath);
                }
              }
              // Delete the directory itself
              await sftp.rmdir(directoryPath);
              console.log(`Directory ${directoryPath} deleted successfully.`);
            } catch (err: any) {
              console.error(`Failed to delete directory ${directoryPath}: ${err.message}`);
            }
          }
          const _transferFolderWithFilters = async (localPath, remotePath, includePatterns = [], excludePatterns = [], concurent_limit = 5) => {
            try {
              const files = await promisify(readdir)(localPath);
              // console.log("files :: ", files);
              await new Promise((resolve, reject) => {
                mapLimit(files, concurent_limit, async (file, callback) => {
                  const filePath = path.join(localPath, file);
                  const _stat = await promisify(stat)(filePath);
                  if (_stat.isDirectory()) {
                    const shouldExclude = excludePatterns.some((pattern) => {
                      const isMatch = micromatch.all(path.join(remotePath, file), path.join(remotePath, pattern));
                      // console.log('shouldExclude', [pattern, path.join(remotePath, file)], [isMatch])
                      return isMatch;
                    });

                    const shouldInclude = includePatterns.length === 0 || includePatterns.some((pattern) => {
                      const isMatch = micromatch.all(path.join(remotePath, file), path.join(remotePath, pattern));
                      // console.log('shouldInclude', [pattern, path.join(remotePath, file)], [isMatch])
                      return isMatch;
                    });

                    // Check if the file should be included based on inclusion and exclusion rules
                    const shouldDelete = shouldInclude && !shouldExclude;
                    if (shouldExclude == true) {

                      // Delete excluded directory recursively
                      try {
                        await deleteDirectory(sftp, path.join(remotePath, file));
                        RecordCommandToFileLog({
                          fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
                          commandString: "Delete Folder :: " + upath.normalize(path.join(remotePath, file)) + ".\n"
                        })
                      } catch (error) {
                        console.log("sftp.rmdir - err :: ", error);
                        RecordCommandToFileLog({
                          fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
                          commandString: "Cannot delete :: " + upath.normalize(path.join(remotePath, file)) + ".\n"
                        })
                      }
                    } else if (shouldInclude == true) {
                      try {
                        await sftp.mkdir(path.join(remotePath, file));
                      } catch (ex) {
                        RecordCommandToFileLog({
                          fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
                          commandString: "Create folder :: " + upath.normalize(path.join(remotePath, file)) + " is exist.\n"
                        })
                      }
                      await _transferFolderWithFilters(filePath, path.join(remotePath, file), includePatterns, excludePatterns, concurent_limit);
                    }
                  } else {
                    const shouldExclude = excludePatterns.some((pattern) => {
                      const isMatch = micromatch.all(path.join(remotePath, file), path.join(remotePath, pattern));
                      // console.log('shouldExclude', [pattern, path.join(remotePath, file)], [isMatch])
                      return isMatch;
                    });

                    const shouldInclude = includePatterns.length === 0 || includePatterns.some((pattern) => {
                      const isMatch = micromatch.all(path.join(remotePath, file), path.join(remotePath, pattern));
                      // console.log('shouldInclude', [pattern, path.join(remotePath, file)], [isMatch])
                      return isMatch;
                    });
                    if (shouldExclude == true) {
                      try {
                        console.log("sftp.unlink :: ", path.join(remotePath, file));
                        await sftp.unlink(path.join(remotePath, file));
                        RecordCommandToFileLog({
                          fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
                          commandString: "Delete File :: " + upath.normalize(path.join(remotePath, file)) + ".\n"
                        })
                      } catch (error) {
                        console.log("sftp.unlink - err :: ", error);
                        RecordCommandToFileLog({
                          fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
                          commandString: "Cannot delete :: " + upath.normalize(path.join(remotePath, file)) + ".\n"
                        })
                      }
                    } else if (shouldInclude == true) {
                      await sftp.fastPut(filePath, path.join(remotePath, file));
                      RecordCommandToFileLog({
                        fileName: "job_id_" + job_id + "_pipeline_id_" + pipeline_task.pipeline_item_id + "_task_id_" + pipeline_task.id,
                        commandString: "Create file :: " + upath.normalize(path.join(remotePath, file)) + ".\n"
                      })
                    }

                  }
                },
                  (err) => {
                    if (err) {
                      reject(err);
                    } else {
                      resolve(null);
                    }
                  })
              })

              console.log('Folder transfer completed successfully.');
              return true; // Indicate that the transfer is done
            } catch (err) {
              throw err;
            }
          }
          // Run sftp
          try {
            await _transferFolderWithFilters(_local_path, _data.target_path, _include, _exclude, 5);
          } catch (error) {
            console.log("error ::: ", error);
            ptyProcess.write('exit' + '\r')
            masterData.saveData("data_pipeline_" + job_id + "_error", {
              pipeline_task_id: pipeline_task.id,
              command: command,
              parent: pipeline_task.temp_id
            })
            // Stop it
            return
          }
          ptyProcess.write('exit' + '\r')
          masterData.saveData("data_pipeline_" + job_id, {
            pipeline_task_id: pipeline_task.id,
            command: command,
            parent: pipeline_task.temp_id
          })
          break;
      }
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