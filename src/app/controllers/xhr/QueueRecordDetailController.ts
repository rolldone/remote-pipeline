
import SafeValue from "@root/app/functions/base/SafeValue";
import CryptoData from "@root/app/functions/CryptoData";
import GetAuthUser from "@root/app/functions/GetAuthUser";
import { ReadRecordCOmmandFileLog, TailRecordCommandFileLog } from "@root/app/functions/RecordCommandToFileLog";
import ExecutionService from "@root/app/services/ExecutionService";
import PagePublisherService from "@root/app/services/PagePublisherService";
import PipelineTaskService from "@root/app/services/PipelineTaskService";
import QueueRecordDetailService, { QueueRecordDetailInterface, QueueRecordDetailServiceInterface } from "@root/app/services/QueueRecordDetailService";
import TokenDataService, { TokenDataInterface, TOPIC } from "@root/app/services/TokenDataService";
import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import Sqlbricks from "@root/tool/SqlBricks";
import BaseController from "base/BaseController";
import _, { debounce } from "lodash";
const marked = require("marked");

declare let masterData: MasterDataInterface;
declare let ws_client: any;

export interface QueueRecordDetailControllerInterface extends BaseControllerInterface {
  getQueueRecordDetails: { (req: any, res: any): void }
  getQueueRecordDetail: { (req: any, res: any): void }
  getDisplayProcess: { (req: any, res: any): void }
  getDisplayProcessItem: { (req: any, res: any): void }
  getIdsStatus: { (req: any, res: any): void }
  getDirectories: { (req: any, res: any): void }
  getFile: { (req: any, res: any): void }
  deleteQueueRecordDetails: { (req: any, res: any): void }
  generateUrlDisplay: { (req: any, res: any): void }
}

const QueueRecordDetailController = BaseController.extend<QueueRecordDetailControllerInterface>({
  async getQueueRecordDetails(req, res) {
    try {
      let user = await GetAuthUser(req);
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
      let res_pipeline_item = await PipelineTaskService.getPipelineTasks({
        pipeline_id: resData.exe_pipeline_id,
        order_by: "pip_item.id ASC, pip_task.order_number ASC",
        pipeline_item_ids: resData.exe_pipeline_item_ids
      })
      let resGroupPipeline = _(res_pipeline_item).groupBy("pip_item_id").map((g) => {
        return {
          name: g[0].pip_item_name,
          data: g
        }
      }).value();
      for (let i = 0; i < resGroupPipeline.length; i++) {
        let _tasks = resGroupPipeline[i].data;
        for (let j = 0; j < _tasks.length; j++) {
          let gg = _tasks[j]
          let keyLis = "job_id_" + resData.job_id + "_pipeline_id_" + gg.pip_item_id + '_task_id_' + gg.id;
          // Tail function
          let runningTail = (keyLis: string) => {
            let isPendingTailClose = null;
            let tail = TailRecordCommandFileLog(keyLis);
            tail.on("line", function (data) {
              if (isPendingTailClose != null) {
                isPendingTailClose.cancel();
              }
              isPendingTailClose = debounce(() => {
                tail.unwatch();
                console.log("unwatch ", keyLis)
              }, 120000);
              isPendingTailClose();
              // If suddenly get close by websocket event
              if (_ws_client != null) {
                _ws_client.ws.send(JSON.stringify({
                  action: keyLis,
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
          setTimeout(() => {
            let fileREadline = ReadRecordCOmmandFileLog(keyLis, (data) => {
              if (isPendingToClose != null) {
                isPendingToClose.cancel();
              }
              isPendingToClose = debounce(() => {
                fileREadline.close();
                console.log("FileReadline Close")
                runningTail(keyLis);
              }, 500);
              isPendingToClose();

              // If suddenly get close by websocket event
              if (_ws_client != null) {
                _ws_client.ws.send(JSON.stringify({
                  action: keyLis,
                  data: data
                }))
              }
            });
            // Write for first time for get line on trigger event
            fileREadline.write("--" + "\n")
          }, 1000)
        }
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
  },
  async getDisplayProcessItem(req, res) {
    try {
      let _ws_client: {
        key: string
        ws: WebSocket
      } = ws_client[req.query.key];
      let id = req.params.id;
      let resData = await QueueRecordDetailService.getQueueRecordDetail({
        id
      });
      let res_pipeline_item = await PipelineTaskService.getPipelineTasks({
        pipeline_id: resData.exe_pipeline_id,
        order_by: "pip_item.id ASC, pip_task.order_number ASC",
        pipeline_item_ids: resData.exe_pipeline_item_ids
      })
      let resGroupPipeline = _(res_pipeline_item).groupBy("pip_item_id").map((g) => {
        return {
          name: g[0].pip_item_name,
          data: g
        }
      }).value();
    } catch (ex) {
      console.log(ex);
      return res.status(400).send(ex);
    }
  },
  async getIdsStatus(req, res) {
    try {
      let user = await GetAuthUser(req);
      let props: QueueRecordDetailServiceInterface = req.query;
      props.ids = JSON.parse(props.ids || '[]' as any);
      props.user_id = user.id;
      let resData = await QueueRecordDetailService.getQueueIdsStatus({
        ids: props.ids,
        user_id: props.user_id
      });
      return res.send({
        status: 'success',
        status_code: 200,
        return: resData
      });
    } catch (ex) {
      console.log(ex);
      return res.status(400).send(ex);
    }
  },
  async getDirectories(req, res) {
    try {
      let job_id = req.query.job_id;
      let resData = await QueueRecordDetailService.getDirectories(job_id);
      return res.send({
        status: 'success',
        status_code: 200,
        return: resData
      });
    } catch (ex) {
      console.log(ex);
      return res.status(400).send(ex);
    }
  },
  async getFile(req, res) {
    try {
      let path = req.query.path;
      let job_id = req.query.job_id;
      let resData = await QueueRecordDetailService.getFile(path, job_id);
      if (resData.mime != false) {
        res.contentType(resData.mime);
      } else {
        res.contentType(resData.full_path);
      }
      console.log(marked);
      switch (resData.mime) {
        case 'text/markdown':
          res.contentType("text/html");
          return res.send(marked.parse(resData.data.toString()));
      }
      res.send(resData.data);
      // return res.send({
      //   status: 'success',
      //   status_code: 200,
      //   return: resData
      // });
    } catch (ex) {
      console.log(ex);
      return res.status(400).send(ex);
    }
  },
  async deleteQueueRecordDetails(req, res) {
    try {
      let user = await GetAuthUser(req);
      let ids = JSON.parse(req.body.ids || '[]');
      let resData = await QueueRecordDetailService.deleteQueueFromIds_UserId(ids, user.id);
      return res.send({
        status: 'success',
        status_code: 200,
        return: resData
      });
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async generateUrlDisplay(req, res) {
    try {
      let user = await GetAuthUser(req);
      let id = req.body.queue_record_detail_id || null;
      let queueRecordDetailData: QueueRecordDetailInterface = await QueueRecordDetailService.getQueueRecordDetail({
        id
      });
      // Inser to token datas
      let resTokenData: TokenDataInterface = await TokenDataService.addOrUpdate({
        token: queueRecordDetailData.td_token,
        topic: TOPIC.QUEUE_DISPLAY_RESULT_SHARE,
        data: {
          // Important data for page auth
          page_name: "queue_records",
          table_id: queueRecordDetailData.queue_record_id,
          identity_value: null,
          user_id: queueRecordDetailData.exe_user_id,
          // Your business data
          id: queueRecordDetailData.id,
          job_id: queueRecordDetailData.job_id
        }
      });
      queueRecordDetailData.token_data_id = resTokenData.id;
      let resData = await QueueRecordDetailService.updateQueueRecordDetail(queueRecordDetailData);
      return res.send({
        status: 'success',
        status_code: 200,
        return: resData
      });
    } catch (ex) {
      return res.status(400).send(ex);
    }
  }
});

export default QueueRecordDetailController;