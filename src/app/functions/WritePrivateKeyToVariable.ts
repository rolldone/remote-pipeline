
import Rsync from "@root/tool/rsync";
import { appendFileSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFile, writeFileSync } from "fs";
import SSH2Promise from "ssh2-promise";
import os from 'os';
import upath from 'upath';
import SSHConfigFile, { SSHConfigInterface } from "@root/tool/ssh-config";
import SSHConfig from "ssh2-promise/lib/sshConfig";
import Ssh2 from "./base/Ssh2";

const status = {
  CLEAR: 'clear'
}

export type DirectAccessType = {
  ssh_configs: Array<any>
  ssh_commands: Array<any>
  // config_file: string
}

const generateSSHConfig = (configFIle: string, identityFIlePath: string, sshCOnfig: SSHConfig, sshCOnfigBefore: SSHConfig) => {
  let _configFilePath = upath.normalizeSafe(configFIle);

  /* Persisten ssh_config */
  let hostNameSSH = `${sshCOnfig.username}_${sshCOnfig.host}_${sshCOnfig.port}`.replace(/\./g, '_');

  let ssh_confi = {
    Host: hostNameSSH, // blablabla_hostname
    HostName: sshCOnfig.host, // xxx.xxx.xxx || domain.com
    User: sshCOnfig.username, // root || xxx
    Port: sshCOnfig.port,  // 22 || xx
    IdentityFile: identityFIlePath, // /path/to/privatekey
    StrictHostKeyChecking: "no"
  } as any;

  if (sshCOnfigBefore != null) {
    let hostNameSSHBefore = `${configFIle} ${sshCOnfigBefore.username}_${sshCOnfigBefore.host}_${sshCOnfigBefore.port}`.replace(/\./g, '_');
    ssh_confi.ProxyCommand = `ssh -v -F ${hostNameSSHBefore} -W %h:%p`
  }

  /* DONT LET ERROR! */
  /* Manage the ssh_config from .ssh home dir */
  let _ssh_config = SSHConfigFile.parse(readFileSync(_configFilePath).toString());

  /* Loop every ssh_config collection from .ssh home dir */
  var sshSection = _ssh_config.find({ Host: ssh_confi.Host })

  /* Remove old current config */
  if (sshSection != null) {
    _ssh_config.remove({ Host: ssh_confi.Host })
  }

  /* Insert the curent new config */
  _ssh_config.append(ssh_confi);

  /* Write the ssh_config on sync-config store in to ssh_config on .ssh home dir  */
  writeFileSync(_configFilePath, SSHConfigFile.stringify(_ssh_config));

  return {
    ...sshCOnfig,
    identityFile: identityFIlePath,
    sshHostName: ssh_confi.Host,
    proxyCommand: ssh_confi.ProxyCommand
  };
  // return ssh_confi;
}

const writePrivateKey = async function (props: {
  sshPromise: Ssh2
  execution: any
}, action?: string) {
  try {
    let lastPrivateKeyUse = [];
    switch (action) {
      case status.CLEAR:
        mkdirSync(process.cwd() + "/storage/app/executions/" + props.execution.id, { recursive: true });
        for (var a = 0; a < props.sshPromise.connections.length; a++) {
          let _config = props.sshPromise.connections[a];
          await unlinkSync(process.cwd() + "/storage/app/executions/" + props.execution.id + '/' + _config.username + "_" + _config.host + "_" + _config.port + "_" + "_key_" + a);
        }
        break;
      default:
        try {
          mkdirSync(process.cwd() + "/storage/app/executions/" + props.execution.id, { recursive: true });
        } catch (ex) { }
        for (var a = 0; a < props.sshPromise.connections.length; a++) {
          let _configBefore = props.sshPromise.connections[a - 1] || null;
          let _config = props.sshPromise.connections[a];
          let filePrivatePath = process.cwd() + "/storage/app/executions/" + props.execution.id + '/' + _config.username + "_" + _config.host + "_" + _config.port + "_" + "_key_" + a;

          await writeFileSync(filePrivatePath, _config.privateKey || '');

          let fileSSHCOnfigPath = process.cwd() + "/storage/app/executions/" + props.execution.id + '/ssh_config';

          if (existsSync(fileSSHCOnfigPath) == false) {
            await writeFileSync(fileSSHCOnfigPath, '');
          }

          let resGenerateSSHCOnfig = generateSSHConfig(fileSSHCOnfigPath, filePrivatePath, _config, _configBefore);
          lastPrivateKeyUse.push({
            catchString: `Authenticating to ${resGenerateSSHCOnfig.host}:${resGenerateSSHCOnfig.port} as '${resGenerateSSHCOnfig.username}'`,
            host: resGenerateSSHCOnfig.host,
            port: resGenerateSSHCOnfig.port,
            identityFile: resGenerateSSHCOnfig.identityFile,
            username: resGenerateSSHCOnfig.username,
            passphrase: resGenerateSSHCOnfig.passphrase,
            password: resGenerateSSHCOnfig.password || resGenerateSSHCOnfig.passphrase,
            hostSSHName: resGenerateSSHCOnfig.sshHostName,
            sshConfigPath: fileSSHCOnfigPath,
            proxyCommand: resGenerateSSHCOnfig.proxyCommand
          })
        }
        break;
    }
    return lastPrivateKeyUse;
  } catch (ex) {
    throw ex;
  }
}

const WritePrivateKeyToVariable = {
  status,
  writePrivateKey
}

export default WritePrivateKeyToVariable;