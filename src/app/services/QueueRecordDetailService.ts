import sqlbricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
declare let db: Knex;

const STATUS = {
  RUNNING: 1,
  FAILED: 2,
  WAITING: 3,
  DELAYED: 4,
  COMPLETED: 5,
  STOPPED: 6
}

export default {
  STATUS,
  async getQueueRecordDetails(props) {
    try {
      sqlbricks.aliasExpansions({
        "qrec_detail": "queue_record_details",
        'qrec': "queue_records",
        'exe': "executions",
      });
      let query_record_detail = sqlbricks.select(
        'qrec_detail.id as id',
        'qrec_detail.queue_record_id as queue_record_id',
        'qrec_detail.queue_name as queue_name',
        'qrec_detail.job_id as job_id',
        'qrec_detail.data as data',
        'qrec_detail.status as status',
        'qrec.id as qrec_id',
        'qrec.queue_key as qrec_queue_key',
        'qrec.execution_id as qrec_execution_id',
        'qrec.status as qrec_status',
        'qrec.data as qrec_data',
        'qrec.type as qrec_type',
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
        'exe.description as exe_description'
      ).from("qrec_detail");

      query_record_detail
        .leftJoin("qrec").on({
          "qrec.id": "qrec_detail.queue_record_id"
        })
        .leftJoin("exe").on({
          "exe.id": "qrec.execution_id"
        })
      if (props.queue_record_id != null) {
        query_record_detail.where("qrec.id", props.queue_record_id);
      }
      // query_record_detail.limit(1);
      let queryString = query_record_detail.toString();
      console.log("query :: ", queryString);
      let res_data_record_detail: Array<any> = await db.raw(queryString);
      res_data_record_detail.filter((el) => {
        el.data = JSON.parse(el.data || '{}');
        el.qrec_data = JSON.parse(el.qrec_data || '{}');
        return el;
      });
      return res_data_record_detail;
    } catch (ex) {
      throw ex;
    }
  },
  async getQueueRecordDetail(props) {
    try {
      sqlbricks.aliasExpansions({
        "qrec_detail": "queue_record_details",
        'qrec': "queue_records",
        'exe': "executions",
      });
      let query_record_detail = sqlbricks.select(
        'qrec_detail.id as id',
        'qrec_detail.queue_record_id as queue_record_id',
        'qrec_detail.queue_name as queue_name',
        'qrec_detail.job_id as job_id',
        'qrec_detail.data as data',
        'qrec_detail.status as status',
        'qrec.id as qrec_id',
        'qrec.queue_key as qrec_queue_key',
        'qrec.execution_id as qrec_execution_id',
        'qrec.status as qrec_status',
        'qrec.data as qrec_data',
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
        'exe.description as exe_description'
      ).from("qrec_detail");

      query_record_detail
        .leftJoin("qrec").on({
          "qrec.id": "qrec_detail.queue_record_id"
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
      let res_data_record_detail = await db.raw(queryString);
      res_data_record_detail = res_data_record_detail[0];
      // If null
      if (res_data_record_detail == null) return null;

      res_data_record_detail.data = JSON.parse(res_data_record_detail.data || '{}');
      res_data_record_detail.qrec_data = JSON.parse(res_data_record_detail.qrec_data || '{}');
      return res_data_record_detail;
    } catch (ex) {
      throw ex;
    }
  },
  async addQueueRecordDetail(props) {
    try {
      console.log("addQueueRecordDetail props :: ", props);
      let queryInsert = sqlbricks.insert("queue_record_details", {
        queue_record_id: props.queue_record_id,
        queue_name: props.queue_name,
        job_id: props.job_id,
        data: JSON.stringify(props.job_data),
        status: props.status
      });
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
  async updateQueueRecordDetail(props) {
    try {
      console.log("addQueueRecordDetail props :: ", props);
      let queryUpdate = sqlbricks.update("queue_record_details", {
        queue_record_id: props.queue_record_id,
        queue_name: props.queue_name,
        job_id: props.job_id,
        data: JSON.stringify(props.job_data),
        status: props.status
      });
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
  }
}