import sqlbricks from "@root/tool/SqlBricks";
import { UpdateStatement } from "@root/tool/SqlBricks/sql-bricks";
import { Knex } from "knex";
import SqlService from "./SqlService";
import dirToJson from 'dir-to-json';
import mimeType from 'mime-types';
import { existsSync, mkdirSync, readFileSync, renameSync } from "fs";
import SafeValue from "../functions/base/SafeValue";
import CreateDate from "../functions/base/CreateDate";
import upath from 'upath'
import filendir from 'filendir';
import AppConfig from "@root/config/AppConfig";

declare let db: Knex;

const STATUS = {
  RUNNING: 1,
  FAILED: 2,
  WAITING: 3,
  DELAYED: 4,
  COMPLETED: 5,
  STOPPED: 6
}

const transformColumn = (el) => {
  el.data = JSON.parse(el.data || '{}');
  el.qrec_data = JSON.parse(el.qrec_data || '{}');
  el.qrec_sch_data = JSON.parse(el.qrec_sch_data || '{}');
  el.exe_host_ids = JSON.parse(el.exe_host_ids || '[]');
  el.exe_pipeline_item_ids = JSON.parse(el.exe_pipeline_item_ids || '[]');
  return el;
}

export interface QueueRecordDetailInterface {
  id?: number
  queue_record_id?: number
  queue_name?: string
  job_id?: string
  data?: any
  status?: number
  created_at?: string
  updated_at?: string
  deleted_at?: string
  // aditional
  job_data?: any
  // Queue record
  qrec_type?: string
  qrec_id?: number
  qrec_data?: any
  // Queue schedule
  qrec_sch_schedule_type?: string
  qrec_sch_data?: any
  // Execution
  exe_process_mode?: string
  exe_process_limit?: number
  exe_delay?: number

}

export interface QueueRecordDetailServiceInterface extends QueueRecordDetailInterface {
  ids?: Array<number>
  order_by?: string
  group_by?: string
  limit?: number
  offset?: number
  user_id?: number,
  where?: any
  // id many 2 many relation
  project_ids?: Array<number>
  pipeline_ids?: Array<number>
  execution_ids?: Array<number>
  queue_record_ids?: Array<number>
}

const preSelectQuery = () => {
  sqlbricks.aliasExpansions({
    "qrec_detail": "queue_record_details",
    'qrec': "queue_records",
    'qrec_sch': "queue_schedules",
    'exe': "executions",
  });
  let query_record_detail = sqlbricks.select(
    'qrec_detail.id as id',
    'qrec_detail.queue_record_id as queue_record_id',
    'qrec_detail.queue_name as queue_name',
    'qrec_detail.job_id as job_id',
    'qrec_detail.data as data',
    'qrec_detail.status as status',
    'qrec_detail.created_at as created_at',
    'qrec_detail.updated_at as updated_at',
    'qrec_detail.deleted_at as deleted_at',
    'qrec.id as qrec_id',
    'qrec.queue_key as qrec_queue_key',
    'qrec.execution_id as qrec_execution_id',
    'qrec.status as qrec_status',
    'qrec.data as qrec_data',
    'qrec.type as qrec_type',
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
    'exe.delay as exe_delay'
  ).from("qrec_detail");
  return query_record_detail;
}

export default {
  STATUS,

  async getQueueRecordDetails(props: QueueRecordDetailServiceInterface) {
    try {
      let query_record_detail = preSelectQuery();
      query_record_detail
        .leftJoin("qrec").on({
          "qrec.id": "qrec_detail.queue_record_id"
        })
        .leftJoin("qrec_sch").on({
          "qrec_sch.queue_record_id": "qrec.id"
        })
        .leftJoin("exe").on({
          "exe.id": "qrec.execution_id"
        })
      if (props.queue_record_id != null) {
        query_record_detail.where("qrec.id", props.queue_record_id);
      }
      if (props.status != null) {
        query_record_detail.where("qrec_detail.status", props.status);
      }
      if (props.order_by != null) {
        query_record_detail.orderBy(props.order_by);
      } else {
        query_record_detail.orderBy("qrec_detail.id DESC");
      }
      query_record_detail.limit(props.limit || 50);
      query_record_detail.offset((props.offset || 0) * (props.limit || 50));
      let queryString = query_record_detail.toString();
      console.log("query :: ", queryString);
      let res_data_record_detail: Array<any> = await db.raw(queryString);
      res_data_record_detail.filter((el) => {
        return transformColumn(el);
      });
      return res_data_record_detail;
    } catch (ex) {
      throw ex;
    }
  },
  async getQueueRecordDetailByJobId(job_id: string, queue_record_id: number) {
    try {
      let query_record_detail = preSelectQuery();
      query_record_detail
        .leftJoin("qrec").on({
          "qrec.id": "qrec_detail.queue_record_id"
        })
        .leftJoin("qrec_sch").on({
          "qrec_sch.queue_record_id": "qrec.id"
        })
        .leftJoin("exe").on({
          "exe.id": "qrec.execution_id"
        })
      query_record_detail.where({
        "qrec_detail.job_id": job_id,
        "qrec_detail.queue_record_id": queue_record_id
      });
      // query_record_detail.limit(1);
      let queryString = query_record_detail.toString();
      console.log("query :: ", queryString);
      let res_data_record_detail = await SqlService.selectOne(queryString);
      // If null
      if (res_data_record_detail == null) return null;
      res_data_record_detail = transformColumn(res_data_record_detail);
      return res_data_record_detail;
    } catch (ex) {
      throw ex;
    }
  },
  async getQueueRecordDetailByJobIdAndUserId(job_id: string, user_id: number) {
    try {
      let query_record_detail = preSelectQuery();
      query_record_detail
        .leftJoin("qrec").on({
          "qrec.id": "qrec_detail.queue_record_id"
        })
        .leftJoin("qrec_sch").on({
          "qrec_sch.queue_record_id": "qrec.id"
        })
        .leftJoin("exe").on({
          "exe.id": "qrec.execution_id"
        })
      query_record_detail.where({
        "qrec_detail.job_id": job_id,
        "exe.user_id": user_id
      });
      // query_record_detail.limit(1);
      let queryString = query_record_detail.toString();
      console.log("query :: ", queryString);
      let res_data_record_detail = await SqlService.selectOne(queryString);
      // If null
      if (res_data_record_detail == null) return null;
      res_data_record_detail = transformColumn(res_data_record_detail);
      return res_data_record_detail;
    } catch (ex) {
      throw ex;
    }
  },
  async getQueueRecordDetail(props: QueueRecordDetailServiceInterface) {
    try {
      let query_record_detail = preSelectQuery();
      query_record_detail
        .leftJoin("qrec").on({
          "qrec.id": "qrec_detail.queue_record_id"
        })
        .leftJoin("qrec_sch").on({
          "qrec_sch.queue_record_id": "qrec.id"
        })
        .leftJoin("exe").on({
          "exe.id": "qrec.execution_id"
        })
      query_record_detail.where({
        "qrec_detail.id": props.id
      });
      // query_record_detail.limit(1);
      let queryString = query_record_detail.toString();
      console.log("query :: ", queryString);
      let res_data_record_detail = await SqlService.selectOne(queryString);
      // If null
      if (res_data_record_detail == null) return null;
      res_data_record_detail = transformColumn(res_data_record_detail);
      return res_data_record_detail;
    } catch (ex) {
      throw ex;
    }
  },
  async addQueueRecordDetail(props: QueueRecordDetailInterface) {
    try {
      console.log("addQueueRecordDetail props :: ", props);
      let queryInsert = sqlbricks.insert("queue_record_details", CreateDate({
        queue_record_id: props.queue_record_id,
        queue_name: props.queue_name,
        job_id: props.job_id,
        data: JSON.stringify(props.job_data),
        status: props.status
      }));
      let _query = queryInsert.toString();
      let resDataId = await db.raw(_query);
      let resData = await this.getQueueRecordDetail({
        id: resDataId.lastInsertRowid
      });
      console.log("addQueueRecordDetail :: ", resData);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async updateQueueRecordDetail(props: QueueRecordDetailInterface) {
    try {
      let queueData: QueueRecordDetailInterface = await this.getQueueRecordDetail({
        id: props.id
      })
      if (queueData == null) {
        throw new Error("Not found data");
      }
      console.log("addQueueRecordDetail props :: ", props);
      let queryUpdate = sqlbricks.update("queue_record_details", CreateDate({
        queue_record_id: SafeValue(props.queue_record_id, queueData.queue_record_id),
        queue_name: SafeValue(props.queue_name, queueData.queue_name),
        job_id: SafeValue(props.job_id, queueData.job_id),
        data: JSON.stringify(SafeValue(props.job_data, queueData.data)),
        status: SafeValue(props.status, queueData.status),
        created_at: SafeValue(queueData.created_at, null)
      }));
      queryUpdate.where({
        "id": props.id
      })
      let _query = queryUpdate.toString();
      let resDataId = await db.raw(_query);
      let resData = await this.getQueueRecordDetail({
        id: props.id
      });
      console.log("addQueueRecordDetail :: ", resData);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async updateQueueRecordDetailWhere(props: QueueRecordDetailInterface, propsCondition: QueueRecordDetailServiceInterface) {
    try {
      console.log("addQueueRecordDetail props :: ", props);
      let queryUpdate = sqlbricks.update("queue_record_details", {
        ...props
      });
      for (var key in propsCondition) {
        queryUpdate = queryUpdate.where(key, propsCondition[key]);
      }
      let _query = queryUpdate.toString();
      let resData = await SqlService.update(_query);

      let _querSelect = preSelectQuery();
      _querSelect = _querSelect
        .leftJoin("qrec").on({
          "qrec.id": "qrec_detail.queue_record_id"
        })
        .leftJoin("qrec_sch").on({
          "qrec_sch.queue_record_id": "qrec.id"
        })
        .leftJoin("exe").on({
          "exe.id": "qrec.execution_id"
        })
      for (var key in propsCondition) {
        switch (key) {
          case 'id':
          case 'job_id':
          case 'status':
            _querSelect = _querSelect.where("qrec_detail." + key, propsCondition[key]);
            break;
          default:
            _querSelect = _querSelect.where(key, propsCondition[key]);
            break;
        }
      }
      resData = await SqlService.select(_querSelect.toString());
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getQueueIdsStatus(props: {
    ids: Array<number>
    user_id: number
  }) {
    try {
      sqlbricks.aliasExpansions({
        "qrec_detail": "queue_record_details",
        'qrec': "queue_records",
        'qrec_sch': "queue_schedules",
        'exe': "executions",
      });
      let query_record_detail = sqlbricks.select(
        'qrec_detail.id as id',
        'qrec_detail.status as status',
      ).from("qrec_detail");

      query_record_detail
        .leftJoin("qrec").on({
          "qrec.id": "qrec_detail.queue_record_id"
        })
        .leftJoin("qrec_sch").on({
          "qrec_sch.queue_record_id": "qrec.id"
        })
        .leftJoin("exe").on({
          "exe.id": "qrec.execution_id"
        })
      query_record_detail.where(sqlbricks.in("qrec_detail.id", props.ids || []));
      query_record_detail.where("exe.user_id", props.user_id);
      let resData = await SqlService.select(query_record_detail.toString());
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getDirectories(job_id: string, user_id: number) {
    try {
      let queueDetailData = await this.getQueueRecordDetailByJobIdAndUserId(job_id, user_id);
      if (queueDetailData == null) {
        throw new Error("Job is not found!");
      }
      // If you prefer, you can also use promises
      let resData = await dirToJson(process.cwd() + "/storage/app/jobs/" + job_id + "/download");
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  getFile: async function (path: string, job_id: string, user_id: number): Promise<{
    mime: string | boolean
    data: Buffer,
    full_path: string
  }> {
    try {
      let queueDetailData = await this.getQueueRecordDetailByJobIdAndUserId(job_id, user_id);
      if (queueDetailData == null) {
        throw new Error("Job is not found!");
      }
      // If you prefer, you can also use promises
      let _mimeType = mimeType.lookup(process.cwd() + "/storage/app/jobs/" + job_id + "/download/" + path);
      let _file = readFileSync(process.cwd() + "/storage/app/jobs/" + job_id + "/download/" + path);
      return {
        mime: _mimeType,
        data: _file,
        full_path: process.cwd() + "/storage/app/jobs/" + job_id + "/download/" + path
      }
    } catch (ex) {
      throw ex;
    }
  },
  async deleteFrom(props: QueueRecordDetailServiceInterface) {
    try {
      sqlbricks.aliasExpansions({
        "qrec_detail": "queue_record_details",
        'qrec': "queue_records",
        'exe': "executions",
        'pip': "pipelines",
        'pro': "projects"
      });

      let selectQuery = sqlbricks.select(
        "qrec_detail.queue_record_id"
      ).from("qrec_detail");

      selectQuery = selectQuery.leftJoin("qrec").on({
        "qrec_detail.queue_record_id": "qrec.id"
      }).leftJoin("exe").on({
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

      if (props.queue_record_ids != null) {
        selectQuery = selectQuery.where(sqlbricks.in("qrec.id", props.queue_record_ids));
      }

      let resDeleteQuery = await SqlService.delete(`
        DELETE FROM queue_record_details WHERE queue_record_id IN (
          ${selectQuery.toString()}
        )
      `);
      return resDeleteQuery;
    } catch (ex) {
      throw ex;
    }
  },
  addResultQueueDetailData(props: {
    job_id: string
    file_name: string
    path: string
    user_id: number
    files: any
  }) {
    try {
      console.log("addResultQueueDetailData :: ", props);
      if (props.files == null) {
        throw new Error("File not found!");
      }
      if (props.files.length == 0) {
        throw new Error("File not found!");
      }
      let oldPath = props.files[0].path;
      let newFolder = upath.normalize(process.cwd() + "/storage/app/jobs/" + props.job_id + "/download/" + props.path + "/");
      let newPath = newFolder + "/" + props.file_name;
      if (existsSync(newFolder) == false) {
        mkdirSync(newFolder, { recursive: true });
      }
      renameSync(oldPath, newPath);
      return AppConfig.ROOT_DOMAIN + "/xhr/queue-record-detail/display-data/" + props.job_id + "/file?path=" + upath.normalize(props.path + "/" + props.file_name);
    } catch (ex) {
      throw ex;
    }
  }
}