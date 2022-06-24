import HostService from "../services/HostService";
import ssh2Promise from 'ssh2-promise';
import CredentialService, { CredentialInterface, CredentialServiceInterface } from "../services/CredentialService";

const ConnectOnSShPromise = async function (props: {
  host_data: any
  host_id: any
}) {
  try {
    let {
      host_data,
      host_id
    } = props;
    let auth_value = null;
    let sshconfig = null;
    console.log("host_data.auth_type :: ", host_data.auth_type);
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
    console.log("ooooooooooooooooooooo :: ", sshconfig);
    var ssh = new ssh2Promise(sshconfig);
    await ssh.connect();
    console.log("Connection established");
    return ssh;
  } catch (ex) {
    throw ex;
  }
}

export default ConnectOnSShPromise;