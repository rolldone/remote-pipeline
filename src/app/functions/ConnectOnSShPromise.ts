import HostService from "../services/HostService";
import ssh2Promise from 'ssh2-promise';
import CredentialService, { CredentialInterface, CredentialServiceInterface } from "../services/CredentialService";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";

declare let masterData: MasterDataInterface;

const initAuthType = async (host_id: number, host_data) => {
  let sshconfig = null;
  let auth_value = null;
  switch (host_data.auth_type) {
    case 'parent':
      let resHostData = await HostService.getHost({
        id: host_id
      });
      auth_value = {
        ...host_data,
        ...resHostData
      };
      console.log("auth_value :: ", auth_value);
      break;
    default:
      auth_value = host_data;
      break;
  }

  switch (auth_value.auth_type) {
    case 'basic_auth':
      sshconfig = {
        host: auth_value.host,
        port: auth_value.port,
        username: auth_value.username,
        password: auth_value.password
      }
      break;
    case 'private_key':
      sshconfig = {
        host: auth_value.host,
        port: auth_value.port,
        username: auth_value.username,
        privateKey: auth_value.private_key,
        passphrase: auth_value.passphrase
      }
      break;
    case 'credential':
      let credential_data: CredentialInterface = await CredentialService.getCredential({
        id: auth_value.credential_id
      })
      switch (credential_data.type) {
        case 'certificate':
          sshconfig = {
            host: auth_value.host,
            port: auth_value.port,
            username: auth_value.username,
            privateKey: credential_data.data.certificate,
            passphrase: credential_data.data.passphrase || null
          }
          break;
        case 'password':
          sshconfig = {
            host: auth_value.host,
            port: auth_value.port,
            username: auth_value.username,
            password: credential_data.data.password
          }
          break;
      }
      break;
  }

  return sshconfig;
}
const ConnectOnSShPromise = async function (props: {
  host_data: any
  host_id: any
  job_id: string
}) {
  let {
    host_data,
    host_id,
    job_id
  } = props;
  try {
    let auth_value = null;
    let sshconfig = null;
    console.log("host_data.auth_type :: ", host_data.auth_type);

    sshconfig = await initAuthType(host_id, host_data);

    let proxy_datas: Array<any> = Object.assign([], host_data.proxy_datas) || [];
    proxy_datas.reverse();

    let ssh = null;
    if (proxy_datas.length > 0) {
      for (var a = 0; a < proxy_datas.length; a++) {
        proxy_datas[a] = await initAuthType(host_id, proxy_datas[a]);
      }
      proxy_datas.push(sshconfig);
      ssh = new ssh2Promise(proxy_datas, true);
    } else {
      ssh = new ssh2Promise(sshconfig);
    }

    await ssh.connect();

    console.log("Connection established");

    masterData.saveData("data_pipeline_" + job_id + "_init", {
      message: "Connect to host :: Connection established \n"
    });
    return ssh;
  } catch (ex: any) {
    masterData.saveData("data_pipeline_" + job_id + "_init", {
      message: "Connect to host :: " + ex.message
    })
    throw ex;
  }
}

export default ConnectOnSShPromise;