import sqlbricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
import CreateQueue from "../functions/CreateQueue";
import SqlService from "./SqlService";
declare let db: Knex;

export const QueueRecordStatus = {
  STAND_BY: 0,
  READY: 1,
  COMPLETED: 2,
  FAILED: 3,
  DELAYED: 4
}

export interface QueueRecordInterface {
  id?: number
  queue_key?: string
  execution_id?: number
  status?: number
  data?: string
  type?: string
}

export interface QueueRecordServiceInterface extends QueueRecordInterface {
  ids?: Array<number>
  limit?: number
  page?: number
  order_by?: string
  offset?: number
  user_id?: number
}

export const QueueRecordType = {
  SCHEDULE: 'schedule',
  INSTANT: 'instant'
}

const preSelectQuery = () => {
  sqlbricks.aliasExpansions({
    'qrec': "queue_records",
    'qrec_sch': "queue_schedules",
    'exe': "executions",
    "pip": "pipelines"
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
  return query;
}

export default {
  STATUS: QueueRecordStatus,
  TYPE: QueueRecordType,
  async addQueueRecord(props: QueueRecordInterface) {
    try {
      let id = await SqlService.insert(sqlbricks.insert('queue_records', {
        queue_key: props.queue_key,
        execution_id: props.execution_id,
        status: props.status,
        data: JSON.stringify(props.data || {}),
        type: props.type
      }).toString());
      let resData = await this.getQueueRecord({
        id
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async updateQueueRecord(props: QueueRecordInterface) {
    try {
      let resData = await SqlService.update(sqlbricks.update('queue_records', {
        queue_key: props.queue_key,
        execution_id: props.execution_id,
        status: props.status,
        data: JSON.stringify(props.data || {}),
        type: props.type || 'instant'
      }).where("id", props.id).toString());

      resData = await this.getQueueRecord({
        id: props.id
      })

      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async deleteQueueRecord(ids: Array<number>) {
    try {
      // let _in: Array<any> | string = [
      //   ...ids
      // ];
      // _in = _in.join(',');
      let resData = await SqlService.delete(sqlbricks.delete('queue_records').where(sqlbricks.in("id", ids)).toString());
      return {
        status: 'success',
        status_code: 200,
        return: resData
      }
    } catch (ex) {
      throw ex;
    }
  },
  async getQueueRecord(props) {
    try {
      let query = preSelectQuery();
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
  async getQueueRecords(props?: QueueRecordServiceInterface) {
    try {
      let query = preSelectQuery();
      query = query.leftJoin('qrec_sch').on({
        "qrec_sch.queue_record_id": "qrec.id"
      });
      query = query.leftJoin('exe').on({
        "qrec.execution_id": "exe.id"
      });
      query = query.leftJoin("pip").on({
        "pip.id": "exe.pipeline_id"
      })

      if (props.status != null) {
        query = query.where("qrec.status", props.status);
      }

      if (props.type != null) {
        query = query.where("qrec.type", props.type);
      }

      if (props.execution_id != null) {
        query = query.where("qrec.execution_id", props.execution_id);
      }

      if (props.order_by != null) {
        query = query.orderBy(props.order_by);
      } else {
        query = query.orderBy("exe.id DESC");
      }

      query = query.where(sqlbricks.isNull("exe.deleted_at"));
      query = query.where(sqlbricks.isNull("pip.deleted_at"));

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
  },
  async getQueueIdsStatus(props?: QueueRecordServiceInterface) {
    try {
      sqlbricks.aliasExpansions({
        'qrec': "queue_records",
        'qrec_sch': "queue_schedules",
        'exe': "executions",
      });

      let query = sqlbricks.select(
        'qrec.id as id',
        'qrec.status as status',
        'exe.user_id as exe_user_id'
      ).from("qrec");

      query = query.leftJoin('qrec_sch').on({
        "qrec_sch.queue_record_id": "qrec.id"
      });

      query = query.leftJoin('exe').on({
        "qrec.execution_id": "exe.id"
      });

      query = query.where(sqlbricks.in("qrec.id", props.ids));
      query = query.where("exe.user_id", props.user_id)

      let resData = await SqlService.select(query.toString());
      return resData;

    } catch (ex) {
      throw ex;
    }
  }
}