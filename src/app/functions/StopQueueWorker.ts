import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import ProcessQueue, { deleteProcessQueue } from "../queues/ProcessQueue";
import QueueRecordService, { QueueRecordInterface } from "../services/QueueRecordService";
import CreateQueueName from "./CreateQueueName";

declare let masterData: MasterDataInterface;

const StopQueueWorker = async (props: {
  id: number
  user_id: number
}) => {
  let queueRecord: QueueRecordInterface = await QueueRecordService.getQueueRecordByIdAndUserId(props.id, props.user_id);
  deleteProcessQueue(CreateQueueName(queueRecord.exe_process_mode, queueRecord.id));
  masterData.saveData(`queue.request.${queueRecord.exe_process_mode}.delete`, CreateQueueName(queueRecord.exe_process_mode, queueRecord.id));
  return queueRecord;
}

export default StopQueueWorker;