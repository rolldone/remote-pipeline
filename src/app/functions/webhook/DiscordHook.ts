import axios from "axios"
import FormData from 'form-data';

export interface DiscordHookListener {
  job_id?: string
  item_info?: {
    webhook_type?: string,
    name?: string,
    key?: string,
    webhook_url?: string,
  }
  data?: {
    subject?: string
    message?: string
  }
}

const DiscordHook = async function (props: DiscordHookListener) {
  try {
    let {
      webhook_type,
      name,
      key,
      webhook_url,
    } = props.item_info;

    let {
      subject,
      message
    } = props.data

    let _formData = new FormData();
    // Add the message
    _formData.append("content", `${subject}\n${message}`);
    // Send the data
    let resData = await axios({
      method: "post",
      url: webhook_url,
      data: _formData,
      headers: {
        // 'Content-Type': `multipart/form-data;`,
      }
    })

    console.log("DiscordHook ::: ", props);
  } catch (ex) {
    throw ex;
  }
}

export default DiscordHook;