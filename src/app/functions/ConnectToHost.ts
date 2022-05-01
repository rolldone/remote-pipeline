import HostService from "../services/HostService";

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
    switch (host_data.auth_type) {
      case 'basic_auth':
        auth_value = host_data;
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
        };
        console.log("resHostData :: ", resHostData);
        break;
      case 'private_key':
        auth_value = host_data;
        break;
    }
    return auth_value;
  } catch (ex) {
    throw ex;
  }
}