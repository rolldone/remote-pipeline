import { AsyncJs } from "../tool";
import StartBullMQ from "./StartBullMQ";
import StartCheckHost from "./StartCheckHost";
import StartConfig from "./StartConfig";
import StartCronJob from "./StartCronJob";
import StartExpress from "./StartExpress";
import StartFlyDrive from "./StartFlyDrive";
import StartMasterData from "./StartMasterData";
import StartPubSub from "./StartPubSub";
import StartQueueWorker from "./StartQueueWorker";
import StartRedis from "./StartRedis";
import StartSerializeError from "./StartSerializeError";
import StartSqlite3 from "./StartSqlite3";
import StartTimezone from "./StartTimezone";
import StartWebSocket from "./StartWebSocket";

const task: Array<any> = [
  /* Main Bootstrap */
  StartTimezone,
  StartSerializeError,
  StartPubSub,
  StartMasterData,
  StartConfig,
  StartRedis,
  StartExpress,
  StartSqlite3,
  StartBullMQ,
  StartQueueWorker,
  StartWebSocket,
  StartFlyDrive,
  StartCheckHost,
  StartCronJob
];

export default function (asyncDone: Function) {
  AsyncJs.series(task, function (err, result) {
    if (err) {
      return console.error(err);
    }
    console.log('Initialize Bootstrap Is Done!');
    asyncDone(null);
  })
}