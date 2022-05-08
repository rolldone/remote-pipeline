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

export const QueueRecordType = {
  SCHEDULE: 'schedule',
  INSTANT: 'instant'
}

export default {
  STATUS: QueueRecordStatus,
  TYPE: QueueRecordType,
  async getQueueRecord(props) {
    try {
      sqlbricks.aliasExpansions({
        'qrec': "queue_records",
        'qrec_sch': "queue_schedules",
        'exe': "executions",
      });

      let query = sqlbricks.select(
        'qrec.id as id',
        'qrec.queue_key as queue_key',
        'qrec.execution_id as execution_id',
        'qrec.status as status',
        'qrec.data as data',
        'qrec.type as type',
        'qrec_sch.id as qrec_sch_id',
        'qrec_sch.queue_record_id as qrec_sch_queue_record_id',
        'qrec_sch.execution_id as qrec_sch_execution_id',
        'qrec_sch.schedule_type as qrec_sch_schedule_type',
        'qrec_sch.data as qrec_sch_data',
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
      query = query.leftJoin('qrec_sch').on({
        "qrec_sch.queue_record_id": "qrec.id"
      });
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
      resQueueRecord.qrec_sch_data = JSON.parse(resQueueRecord.qrec_sch_data || '{}');
      resQueueRecord.data = JSON.parse(resQueueRecord.data || '{}');
      resQueueRecord.exe_host_ids = JSON.parse(resQueueRecord.exe_host_ids);
      return resQueueRecord;
    } catch (ex) {
      throw ex;
    }
  },
  async getQueueRecords(props) {
    try {
      sqlbricks.aliasExpansions({
        'qrec': "queue_records",
        'qrec_sch': "queue_schedules",
        'exe': "executions",
      });

      let query = sqlbricks.select(
        'qrec.id as id',
        'qrec.queue_key as queue_key',
        'qrec.execution_id as execution_id',
        'qrec.status as status',
        'qrec.data as data',
        'qrec.type as type',
        'qrec_sch.id as qrec_sch_id',
        'qrec_sch.queue_record_id as qrec_sch_queue_record_id',
        'qrec_sch.execution_id as qrec_sch_execution_id',
        'qrec_sch.schedule_type as qrec_sch_schedule_type',
        'qrec_sch.data as qrec_sch_data',
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
      query = query.leftJoin('qrec_sch').on({
        "qrec_sch.queue_record_id": "qrec.id"
      });
      query = query.leftJoin('exe').on({
        "qrec.execution_id": "exe.id"
      });

      if (props.status != null) {
        query = query.where("qrec.status", props.status);
      }

      if (props.type != null) {
        query = query.where("qrec.type", props.type);
      }

      query = query.orderBy("exe.id DESC");

      query.limit(props.limit || 50);
      query.offset((props.offset || 0) * (props.limit || 50));

      let _query = query.toString();
      let resQueueRecords: Array<any> = await db.raw(_query);
      if (resQueueRecords == null) return null;
      for (var a = 0; a < resQueueRecords.length; a++) {
        resQueueRecords[a] = resQueueRecords[a] || null;
        resQueueRecords[a].qrec_sch_data = JSON.parse(resQueueRecords[a].qrec_sch_data || '{}');
        resQueueRecords[a].data = JSON.parse(resQueueRecords[a].data || '{}');
        resQueueRecords[a].exe_host_ids = JSON.parse(resQueueRecords[a].exe_host_ids);
      }
      return resQueueRecords;
    } catch (ex) {
      throw ex;
    }
  }
}