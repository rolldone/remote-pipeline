import sqlbricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
declare let db: Knex;

export const QueueRecordStatus = {
  STAND_BY: 0,
  READY: 1,
  COMPLETED: 2,
  FAILED: 3,
  DELAYED: 4
}

export default {
  STATUS: QueueRecordStatus,
  async getQueueRecord(props) {
    try {
      sqlbricks.aliasExpansions({
        'qrec': "queue_records",
        'exe': "executions",
      });

      let query = sqlbricks.select(
        'qrec.id as id',
        'qrec.queue_key as queue_key',
        'qrec.execution_id as execution_id',
        'qrec.status as status',
        'qrec.data as data',
        'exe.id as exe_id',
        'exe.name as exe_name',
        'exe.process_mode as exe_process_mode',
        'exe.process_limit as exe_process_limit',
        'exe.pipeline_id as exe_pipeline_id',
        'exe.project_id as exe_project_id',
        'exe.user_id as exe_user_id',
        'exe.variable_id as exe_variable_id',
        'exe.variable_option as exe_variable_option',
        'exe.pipeline_item_ids as exe_pipeline_item_ids',
        'exe.host_ids as exe_host_ids',
        'exe.description as exe_description',
      ).from("qrec");

      query = query.leftJoin('exe').on({
        "qrec.execution_id": "exe.id"
      });
      query = query.where({
        "qrec.id": props.id
      })

      query = query.orderBy("exe.id DESC");
      query = query.limit(1);

      let _query = query.toString();
      let resQueueRecord = await db.raw(_query);
      if (resQueueRecord == null) return null;
      resQueueRecord = resQueueRecord[0] || null;
      resQueueRecord.exe_host_ids = JSON.parse(resQueueRecord.exe_host_ids);
      return resQueueRecord;
    } catch (ex) {
      throw ex;
    }
  }
}