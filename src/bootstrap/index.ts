import { AsyncJs } from "../tool";
import StartBullMQ from "./StartBullMQ";
import StartConfig from "./StartConfig";
import StartExpress from "./StartExpress";
import StartMasterData from "./StartMasterData";
import StartPubSub from "./StartPubSub";
import StartQueueWorker from "./StartQueueWorker";
import StartRecordOpenFolder from "./StartRecordOpenFolder";
import StartRedis from "./StartRedis";
import StartSerializeError from "./StartSerializeError";
import StartSqlite3 from "./StartSqlite3";

const task: Array<any> = [
  /* Main Bootstrap */
  StartSerializeError,
  StartPubSub,
  StartMasterData,
  StartConfig,
  StartExpress,
  StartRecordOpenFolder,
  StartRedis,
  StartSqlite3,
  StartBullMQ,
  StartQueueWorker
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