import HostService from "../services/HostService";
import ssh2Promise from 'ssh2-promise';

export default async function (props: {
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
      case 'basic_auth':
        auth_value = host_data;
        sshconfig = {
          host: auth_value.host,
          username: auth_value.username,
          password: auth_value.password
        }
        break;
      case 'parent':
        let resHostData = await HostService.getHost({
          id: host_id
        });
        auth_value = {
          ...host_data,
          username: resHostData.username,
          password: resHostData.password,
          private_key: resHostData.private_key,
          passphrase: resHostData.passphrase
        };
        sshconfig = {
          host: auth_value.ip_address,
          port: auth_value.port,
          username: auth_value.username,
          privateKey: auth_value.private_key,
          password: auth_value.password,
          passphrase: auth_value.passphrase
        }
        console.log("resdHostData :: ", sshconfig);
        break;
      case 'private_key':
        auth_value = host_data;
        sshconfig = {
          host: auth_value.host,
          username: auth_value.username,
          privateKey: auth_value.private_key,
          passphrase: auth_value.passphrase
        }
        break;
    }
    var ssh = new ssh2Promise(sshconfig);
    await ssh.connect();
    console.log("Connection established");
    let resData = await ssh.exec("whoami");
    console.log("ResData :: ", resData);
    return ssh;
  } catch (ex) {
    throw ex;
  }
}