
import Rsync from "@root/tool/rsync";
import { mkdirSync, unlinkSync, writeFile, writeFileSync } from "fs";
import SSH2Promise from "ssh2-promise";

const status = {
  CLEAR: 'clear'
}

const writePrivateKey = async function (props: {
  sshPromise: SSH2Promise
  execution: any
}, action?: string) {
  try {
    console.log('sshPromise.config :::: ', props.sshPromise.config);
    let lastPrivateKeyUse = {};
    switch (action) {
      case status.CLEAR:
        mkdirSync(process.cwd() + "/storage/app/executions/" + props.execution.id, { recursive: true });
        for (var a = 0; a < props.sshPromise.config.length; a++) {
          let _config = props.sshPromise.config[a];
          await unlinkSync(process.cwd() + "/storage/app/executions/" + props.execution.id + '/' + _config.host + "_key_" + a);

        }
        break;
      default:
        try {
          mkdirSync(process.cwd() + "/storage/app/executions/" + props.execution.id, { recursive: true });
        } catch (ex) { }
        for (var a = 0; a < props.sshPromise.config.length; a++) {
          let _config = props.sshPromise.config[a];
          await writeFileSync(process.cwd() + "/storage/app/executions/" + props.execution.id + '/' + _config.host + "_key_" + a, _config.privateKey);
          lastPrivateKeyUse = {
            host: _config.host,
            port: _config.port,
            identityFile: process.cwd() + "/storage/app/executions/" + props.execution.id + '/' + _config.host + "_key_" + a,
            username: _config.username,
            passphrase: _config.passphrase,
            password: _config.password || _config.passphrase
          }
        }
        break;
    }
    return lastPrivateKeyUse as any;
  } catch (ex) {
    throw ex;
  }
}

const WritePrivateKeyToVariable = {
  status,
  writePrivateKey
}

export default WritePrivateKeyToVariable;