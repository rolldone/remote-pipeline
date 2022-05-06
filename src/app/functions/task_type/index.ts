import SSH2Promise from "ssh2-promise";
import BasicCommand from "./BasicCommand";
import ConditionalCommand from "./ConditionalCommand";
import FileTransfer from "./FileTransfer";

export interface TaskTypeInterface {
  raw_variable: any,
  sshPromise: SSH2Promise,
  variable: any
  schema: any
  pipeline_task: any
  socket: any
  resolve: Function
  rejected: Function
}

export default {
  "basic-command": BasicCommand,
  "conditional-command": ConditionalCommand,
  "file-transfer": FileTransfer
}