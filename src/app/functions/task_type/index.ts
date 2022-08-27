import SSH2Promise from "ssh2-promise";
import BasicCommand from "./ssh/BasicCommand";
import ConditionalCommand from "./basic/ConditionalCommand";
import DownloadRequest from "./ssh/DownloadRequest";
import FileTransfer from "./ssh/FileTransfer";
import HttpRequest from "./basic/HttpRequest";
import NewQueueCommand from "./ssh/NewQueueCommand";
import FullRemoteSyncronise from "./ssh/remote/FullRemoteSyncronise";
import RepoInstall from "./ssh/RepoInstall";
import WriteScriptCode from "./ssh/WriteScriptCode";
import WriteTransfer from "./ssh/WriteTransfer";

export interface TaskTypeInterface {
  raw_variable: any,
  sshPromise?: SSH2Promise,
  variable: any
  schema: any
  pipeline_task: any
  socket: any
  execution: any
  resolve: Function
  rejected: Function
  job_id: string
  extra_var: any
}

export default {
  "basic-command": BasicCommand,
  "conditional-command": ConditionalCommand,
  "file-transfer": FileTransfer,
  "write-transfer": WriteTransfer,
  "repo-install": RepoInstall,
  "transfer-remote": FullRemoteSyncronise,
  "download-request": DownloadRequest,
  "write-script": WriteScriptCode,
  "new-queue": NewQueueCommand,
  "http-request": HttpRequest
}