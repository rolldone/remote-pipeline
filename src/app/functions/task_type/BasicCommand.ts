import SSH2Promise from "ssh2-promise";

export default function (props: {
  sshPromise: SSH2Promise,
  variable: any
  schema: any
  pipeline_task: any
}) {
  console.log("props basic-command ::: ", props);

}