import sqlbricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
import BoolearParse from "../functions/base/BoolearParse";
import CreateDate from "../functions/base/CreateDate";
import SafeValue from "../functions/base/SafeValue";
import QueueRecordDetailService from "./QueueRecordDetailService";
import QueueSceduleService from "./QueueSceduleService";
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

  created_at?: string
  updated_at?: string
  deleted_at?: string

  // join
  // execution
  exe_host_ids?: Array<number>
  exe_process_mode?: string
  exe_process_limit?: number
  exe_delay?: number
  exe_user_id?: number
  exe_access_host_type?: string
  // Schedule
  qrec_sch_data?: any
}

export interface QueueRecordServiceInterface extends QueueRecordInterface {
  ids?: Array<number>
  limit?: number
  page?: number
  order_by?: string
  offset?: number
  user_id?: number
  with_deleted?: boolean

  force_deleted?: boolean
  // Many to many relation
  project_ids?: Array<number>
  pipeline_ids?: Array<number>
  execution_ids?: Array<number>
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
    'qrec.created_at as created_at',
    'qrec.updated_at as updated_at',
    'qrec.deleted_at as deleted_at',
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
    'exe.delay as exe_delay',
    'exe.access_host_type as exe_access_host_type',
    'pip.name as pip_name'
  ).from("qrec");
  return query;
}

const returnFactoryColumn = (props: QueueRecordInterface) => {
  let resQueueRecord = props;
  resQueueRecord.qrec_sch_data = JSON.parse(resQueueRecord.qrec_sch_data || '{}');
  resQueueRecord.data = JSON.parse(resQueueRecord.data || '{}');
  resQueueRecord.exe_host_ids = JSON.parse(resQueueRecord.exe_host_ids as any);

  return resQueueRecord;
}

export default {
  STATUS: QueueRecordStatus,
  TYPE: QueueRecordType,
  async addQueueRecord(props: QueueRecordInterface) {
    try {
      let id = await SqlService.insert(sqlbricks.insert('queue_records', CreateDate({
        queue_key: props.queue_key,
        execution_id: props.execution_id,
        status: props.status,
        data: JSON.stringify(props.data || {}),
        type: props.type
      })).toString());
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
      let existData: QueueRecordInterface = await this.getQueueRecord({
        id: props.id
      })

      if (existData == null) {
        throw new Error("The Data is not found!");
      }

      let resData = await SqlService.update(sqlbricks.update('queue_records', CreateDate({
        queue_key: SafeValue(props.queue_key, existData.queue_key),
        execution_id: SafeValue(props.execution_id, existData.execution_id),
        status: SafeValue(props.status, existData.status),
        data: JSON.stringify(SafeValue(props.data, SafeValue(existData.data, {}))),
        type: SafeValue(props.type, SafeValue(existData.type, 'instant')),
        created_at: SafeValue(existData.created_at, null)
      })).where("id", props.id).toString());

      resData = await this.getQueueRecord({
        id: props.id
      })

      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async deleteQueueRecord(props: QueueRecordServiceInterface) {
    try {

      let _force_deleted = BoolearParse(SafeValue(props.force_deleted, "false"));

      if (_force_deleted == true) {
        let resDeleteQueueRecordDetail = await QueueRecordDetailService.deleteFrom({
          queue_record_ids: props.ids
        })
        let resDeleteQueueSchedule = await QueueSceduleService.deleteFrom({
          queue_record_ids: props.ids
        })
      }

      let resData = await SqlService.smartDelete(sqlbricks.delete('queue_records').where(sqlbricks.in("id", props.ids)).toString(), _force_deleted);

      return null;
    } catch (ex) {
      throw ex;
    }
  },
  async getQueueRecord(props: QueueRecordServiceInterface) {
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
      query = query.where({
        "qrec.id": props.id
      })

      query = query.where(sqlbricks.isNull("exe.deleted_at"));
      query = query.where(sqlbricks.isNull("pip.deleted_at"));

      query = query.orderBy("exe.id DESC");
      query = query.limit(1);

      let resQueueRecord = await SqlService.selectOne(query.toString());
      if (resQueueRecord == null) return null;
      resQueueRecord = returnFactoryColumn(resQueueRecord);
      return resQueueRecord;
    } catch (ex) {
      throw ex;
    }
  },
  async getQueueRecordByIdAndUserId(id: number, user_id: number) {
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
      query = query.where({
        "qrec.id": id,
        "exe.user_id": user_id
      })

      query = query.where(sqlbricks.isNull("exe.deleted_at"));
      query = query.where(sqlbricks.isNull("pip.deleted_at"));

      query = query.orderBy("exe.id DESC");
      query = query.limit(1);

      let resQueueRecord = await SqlService.selectOne(query.toString());
      if (resQueueRecord == null) return null;
      resQueueRecord = returnFactoryColumn(resQueueRecord);
      return resQueueRecord;
    } catch (ex) {
      throw ex;
    }
  },
  async getQueueRecordByKey(key: string) {
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
      query = query.where({
        "qrec.queue_key": key
      })

      query = query.where(sqlbricks.isNull("exe.deleted_at"));
      query = query.where(sqlbricks.isNull("pip.deleted_at"));

      query = query.orderBy("exe.id DESC");
      query = query.limit(1);

      let resQueueRecord = await SqlService.selectOne(query.toString());
      if (resQueueRecord == null) return null;
      resQueueRecord = returnFactoryColumn(resQueueRecord);
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

      let _with_deleted = BoolearParse(SafeValue(props.with_deleted, false));
      if (_with_deleted == null || _with_deleted == false) {
        query = query.where(sqlbricks.isNull("exe.deleted_at"));
        query = query.where(sqlbricks.isNull("pip.deleted_at"));
      }

      if (props.order_by != null) {
        query = query.orderBy(props.order_by);
      } else {
        query = query.orderBy("exe.id DESC");
      }

      query.limit(props.limit || 50);
      query.offset((props.offset || 0) * (props.limit || 50));

      let _query = query.toString();

      let resQueueRecords: Array<any> = await SqlService.select(_query);
      for (var a = 0; a < resQueueRecords.length; a++) {
        resQueueRecords[a] = returnFactoryColumn(resQueueRecords[a]);
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
  },
  async deleteFrom(props?: QueueRecordServiceInterface) {
    try {
      sqlbricks.aliasExpansions({
        'qrec': "queue_records",
        'exe': "executions",
        'pip': "pipelines",
        'pro': "projects"
      });

      let selectQuery = sqlbricks.select(
        "qrec.id"
      ).from("qrec");

      selectQuery = selectQuery.leftJoin("exe").on({
        "exe.id": "qrec.execution_id"
      }).leftJoin("pip").on({
        "pip.id": "exe.pipeline_id"
      }).leftJoin("pro").on({
        "pro.id": "exe.project_id"
      });

      if (props.project_ids != null) {
        selectQuery = selectQuery.where(sqlbricks.in("pro.id", props.project_ids));
      }

      if (props.pipeline_ids != null) {
        selectQuery = selectQuery.where(sqlbricks.in("pip.id", props.pipeline_ids));
      }

      if (props.execution_ids != null) {
        selectQuery = selectQuery.where(sqlbricks.in("exe.id", props.execution_ids));
      }

      let resDeleteQuery = await SqlService.delete(`
        DELETE FROM queue_records WHERE id IN (
          ${selectQuery.toString()}
        )
      `);
      return resDeleteQuery;
    } catch (ex) {
      throw ex;
    }
  }
}