
import { ReadRecordCOmmandFileLog, TailRecordCommandFileLog } from "@root/app/functions/RecordCommandToFileLog";
import QueueRecordDetailService from "@root/app/services/QueueRecordDetailService";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import Sqlbricks from "@root/tool/SqlBricks";
import BaseController from "base/BaseController";
import { debounce } from "lodash";

declare let masterData: MasterDataInterface;
declare let ws_client: any;

export interface QueueRecordDetailControllerInterface extends BaseControllerInterface {
  getQueueRecordDetails: { (req: any, res: any): void }
  getQueueRecordDetail: { (req: any, res: any): void }
  getDisplayProcess: { (req: any, res: any): void }
}

const QueueRecordDetailController = BaseController.extend<QueueRecordDetailControllerInterface>({
  async getQueueRecordDetails(req, res) {
    try {
      let props = req.query;
      let resData = await QueueRecordDetailService.getQueueRecordDetails(props);
      return res.send({
        status: 'success',
        status_code: 200,
        return: resData
      });
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async getQueueRecordDetail(req, res) {
    try {
      let id = req.params.id;
      let props = req.query;
      let resData = await QueueRecordDetailService.getQueueRecordDetail({
        id,
        ...props
      });
      return res.send({
        status: 'success',
        status_code: 200,
        return: resData
      });
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async getDisplayProcess(req, res) {
    try {
      let _ws_client: {
        key: string
        ws: WebSocket
      } = ws_client[req.query.key];
      let id = req.params.id;
      let resData = await QueueRecordDetailService.getQueueRecordDetail({
        id
      });
      let _pipeline_item_ids = resData.exe_pipeline_item_ids;
      for (var a = 0; a < _pipeline_item_ids.length; a++) {
        let gg = _pipeline_item_ids[a]
        // Tail function
        let runningTail = () => {
          let isPendingTailClose = null;
          let tail = TailRecordCommandFileLog("job_id_" + resData.job_id + "_pipeline_id_" + gg);
          tail.on("line", function (data) {
            if (isPendingTailClose != null) {
              isPendingTailClose.cancel();
            }
            isPendingTailClose = debounce(() => {
              tail.unwatch();
              console.log("unwatch ", "job_id_" + resData.job_id + "_pipeline_id_" + gg)
            }, 120000);
            isPendingTailClose();
            // If suddenly get close by websocket event
            if (_ws_client != null) {
              _ws_client.ws.send(JSON.stringify({
                action: "job_id_" + resData.job_id + "_pipeline_id_" + gg,
                data: data
              }))
            }
          });
          tail.on("error", function (error) {
            console.log('ERROR: ', error);
          });
          return tail;
        }
        let isPendingToClose = null;
        let fileREadline = ReadRecordCOmmandFileLog("job_id_" + resData.job_id + "_pipeline_id_" + gg, (data) => {
          if (isPendingToClose != null) {
            isPendingToClose.cancel();
          }
          isPendingToClose = debounce(() => {
            fileREadline.close();
            console.log("FileReadline Close")
            runningTail();
          }, 1000);
          isPendingToClose();

          // If suddenly get close by websocket event
          if (_ws_client != null) {
            _ws_client.ws.send(JSON.stringify({
              action: "job_id_" + resData.job_id + "_pipeline_id_" + gg,
              data: data
            }))
          }
        });
        // Write for first time for get line on trigger event
        fileREadline.write("--" + "\n")
      }
      return res.send({
        status: 'success',
        status_code: 200,
        return: resData
      });
    } catch (ex) {
      console.log(ex);
      return res.status(400).send(ex);
    }
  }
});

export default QueueRecordDetailController;