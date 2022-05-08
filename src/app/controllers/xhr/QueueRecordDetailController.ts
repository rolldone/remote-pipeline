
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
      let _ws_client: WebSocket = ws_client[req.query.key];
      let id = req.params.id;
      let resData = await QueueRecordDetailService.getQueueRecordDetail({
        id
      });
      let _pipeline_item_ids = resData.exe_pipeline_item_ids;
      let _aa = 50;
      for (var a = 0; a < _pipeline_item_ids.length; a++) {
        let gg = _pipeline_item_ids[a]
        let isUsed = false;
        let isPending = null;
        _aa += 50;
        let fileREadline = ReadRecordCOmmandFileLog("job_id_" + resData.job_id + "_pipeline_id_" + gg, (data) => {
          if (isPending != null) {
            isPending.cancel();
          }
          isPending = debounce(() => {
            isUsed = false;
            fileREadline.close();
            console.log("FileReadline Close")
          }, 1000);
          isPending();
          setTimeout(() => {
            isUsed = true;
            _ws_client.send(JSON.stringify({
              action: "job_id_" + resData.job_id + "_pipeline_id_" + gg,
              data: data
            }))
          }, _aa += 50);
        });
        let isPendingTailClose = null;
        let tail = TailRecordCommandFileLog("job_id_" + resData.job_id + "_pipeline_id_" + gg);
        tail.on("line", function (tail, data) {
          if (isUsed == false) {
            if (isPendingTailClose != null) {
              isPendingTailClose.cancel();
            }
            isPendingTailClose = debounce(() => {
              tail.unwatch();
              console.log("unwatch ", "job_id_" + resData.job_id + "_pipeline_id_" + gg)
            }, 120000);
            isPendingTailClose();
            // console.log(data);
            _ws_client.send(JSON.stringify({
              action: "job_id_" + resData.job_id + "_pipeline_id_" + gg,
              data: data
            }))
            // masterData.saveData("ws.commit.one", {
            //   action: "job_id_" + resData.job_id + "_pipeline_id_" + gg,
            //   data: data
            // })
          }
        }.bind(this, tail));
        tail.on("error", function (error) {
          console.log('ERROR: ', error);
        });

        isPendingTailClose = debounce(() => {
          tail.unwatch();
          console.log("unwatch ", "job_id_" + resData.job_id + "_pipeline_id_" + gg)
        }, 120000);
        isPendingTailClose();
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