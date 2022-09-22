import { readFileSync } from 'fs';
import Ssh2 from '../src/app/functions/base/Ssh2';

let Test = async () => {
  let ssh = new Ssh2([
    {
      port: 2200,
      host: "192.168.50.4",
      username: "root",
      privateKey: readFileSync(".ssh/openssh_nopassword")
    },
    {
      port: 2200,
      host: "192.168.50.4",
      username: "root",
      privateKey: readFileSync(".ssh/openssh_nopassword")
    }
  ]);
  let client = await ssh.connect();
  ssh.on("data", (data) => {
    console.log("output :: ", data.toString());
  })
  setTimeout(async () => {
    let resData = await ssh.write("ping localhost -c 10\n");
    console.log(resData);
    await ssh.disconect();
    process.exit(1);
  }, 5000)
}

Test();