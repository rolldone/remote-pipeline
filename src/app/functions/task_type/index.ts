import SSH2Promise from "ssh2-promise";
import BasicCommand from "./BasicCommand";
import ConditionalCommand from "./ConditionalCommand";
import DownloadRequest from "./DownloadRequest";
import FileTransfer from "./FileTransfer";
import FullRemoteSyncronise from "./remote/FullRemoteSyncronise";
import RepoInstall from "./RepoInstall";
import WriteScriptCode from "./WriteScriptCode";
import WriteTransfer from "./WriteTransfer";

export interface TaskTypeInterface {
  raw_variable: any,
  sshPromise: SSH2Promise,
  variable: any
  schema: any
  pipeline_task: any
  socket: any
  execution: any
  resolve: Function
  rejected: Function
  job_id: number
}

export default {
  "basic-command": BasicCommand,
  "conditional-command": ConditionalCommand,
  "file-transfer": FileTransfer,
  "write-transfer": WriteTransfer,
  "repo-install": RepoInstall,
  "transfer-remote": FullRemoteSyncronise,
  "download-request": DownloadRequest,
  "write-script": WriteScriptCode
}