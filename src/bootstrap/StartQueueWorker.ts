import CreateQueue from "@root/app/functions/CreateQueue";
import DeleteQueueItem from "@root/app/functions/DeleteQueueItem";
import QueueRecordDetailService from "@root/app/services/QueueRecordDetailService";
import QueueRecordService, { QueueRecordInterface } from "@root/app/services/QueueRecordService";

export default function (next: Function) {
  return new Promise(async (resolve: Function) => {
    try {
      console.log("StartQueueWorker Called.");
      let queueRecords: Array<QueueRecordInterface> = await QueueRecordService.getQueueRecords({
        status: QueueRecordService.STATUS.READY,
        with_deleted: true
      });
      console.log("queueRecords :: ", queueRecords);
      next();
      for (var a = 0; a < queueRecords.length; a++) {
        let id = queueRecords[a].id;
        let data = queueRecords[a].data;
        let process_mode = queueRecords[a].exe_process_mode;
        let process_limit = queueRecords[a].exe_process_limit || 1;
        let queue_name = "queue_" + process_mode + "_" + id;
        let delay = queueRecords[a].exe_delay;

        let queue_record_details = await QueueRecordDetailService.getQueueRecordDetails({
          queue_record_id: id,
          status: QueueRecordDetailService.STATUS.RUNNING
        })
        
        for (var b = 0; b < queue_record_details.length; b++) {
          await DeleteQueueItem({
            queue_record_detail_id: queue_record_details[b].id
          })
        }
        await CreateQueue({ id, data, process_mode, process_limit, queue_name, delay });
      }
      if (queueRecords.length == 0) {
        QueueRecordDetailService.updateQueueRecordDetailWhere({
          "status": QueueRecordDetailService.STATUS.STOPPED,
        }, {
          where: {
            "status": QueueRecordDetailService.STATUS.RUNNING
          }
        });
      }
      console.log("StartQueueQorker.ts - execute :: ", "DONE");
      resolve();
    } catch (ex) {
      console.error("StartQueueQorker - ex :: ", ex);
    }
  });
}