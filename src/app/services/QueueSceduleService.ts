import SqlBricks from "@root/tool/SqlBricks";
import SqlService from "./SqlService";

export interface QueueScheduleInterface {
  id?: any
  queue_record_id?: any
  execution_id?: any
  schedule_type?: string
  data?: any

  qrec_data?: any
  exe_pipeline_item_ids?: Array<number>
  exe_host_ids?: Array<number>
}

export interface QueueItemInterface {
  id?: any
  data?: any
  process_mode?: string
  host_id?: any
}

export interface QueueScheduleServiceInterface extends QueueScheduleInterface {
  project_ids?: Array<number>
  pipeline_ids?: Array<number>
  execution_ids?: Array<number>
  queue_record_ids?: Array<number>
}

const preSelect = () => {
  SqlBricks.aliasExpansions({
    'q_sch': "queue_schedules",
    'qrec': "queue_records",
    'exe': "executions",
  });
  // Get again
  let query = SqlBricks.select(
    'q_sch.id as id',
    'q_sch.queue_record_id as queue_record_id',
    'q_sch.execution_id as execution_id',
    'q_sch.schedule_type as schedule_type',
    'q_sch.data as data',
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
    'exe.description as exe_description',
    'exe.delay as exe_delay'
  ).from("q_sch");

  return query;
}

const returnFactoryColumn = (props: QueueScheduleInterface) => {
  let resData = props;
  resData.qrec_data = JSON.parse(resData.qrec_data || '{}');
  resData.data = JSON.parse(resData.data || '{}')
  resData.exe_pipeline_item_ids = JSON.parse(resData.exe_pipeline_item_ids as any || '[]');
  resData.exe_host_ids = JSON.parse(resData.exe_host_ids as any || '[]');
  return resData;
}

export default {
  schedule_type: {
    REPEATABLE: 'repeatable',
    ONE_TIME_SCHEDULE: 'one_time_schedule'
  },
  async addQueueSchedule(props: QueueScheduleInterface) {
    try {
      let query = SqlBricks.insert("queue_schedules", {
        queue_record_id: props.queue_record_id,
        execution_id: props.execution_id,
        schedule_type: props.schedule_type,
        data: JSON.stringify(props.data)
      }).toString();
      let resDataId = await SqlService.insert(query);
      let resData = await this.getQueueSchedule({
        id: resDataId
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async updateQueueSchedule(props: QueueScheduleInterface) {
    try {
      let query = SqlBricks.update("queue_schedules", {
        queue_record_id: props.queue_record_id,
        execution_id: props.execution_id,
        schedule_type: props.schedule_type,
        data: JSON.stringify(props.data)
      }).where("id", props.id).toString();
      let resDataUpdate = await SqlService.update(query);
      let resData = await this.getQueueSchedule({
        id: props.id
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getQueueSchedules(props: QueueScheduleInterface) {
    try {
      let query = preSelect();
      query = query.leftJoin('qrec').on({
        "qrec.id": "q_sch.queue_record_id"
      });
      query = query.leftJoin('exe').on({
        "exe.id": "q_sch.execution_id"
      });
      query = query.orderBy("q_sch.id DESC");
      let resDatas: Array<any> = await SqlService.select(query.toString());
      resDatas.forEach((resData) => {
        return returnFactoryColumn(resData);
      })
      return resDatas;
    } catch (ex) {
      throw ex;
    }
  },
  async getQueueSchedule(props: QueueScheduleInterface) {
    let query = preSelect();
    query = query.leftJoin('qrec').on({
      "qrec.id": "q_sch.queue_record_id"
    });
    query = query.leftJoin('exe').on({
      "exe.id": "q_sch.execution_id"
    });
    query = query.orderBy("q_sch.id DESC");
    query = query.limit(1);
    if (props.execution_id != null && props.queue_record_id != null) {
      query = query.where({
        "q_sch.execution_id": props.execution_id,
        "q_sch.queue_record_id": props.queue_record_id
      })
    } else {
      query = query.where({
        "q_sch.id": props.id
      })
    }
    let resData = await SqlService.selectOne(query.toString());
    if (resData == null) return null;
    resData = returnFactoryColumn(resData);
    return resData;
  },
  async deleteQueueSchedule(ids: Array<number>) {
    try {
      let _in: Array<any> | string = [
        ...ids
      ];
      _in = _in.join(',');
      let resData = await SqlService.delete(SqlBricks.delete('queue_schedules').where(SqlBricks.in("id", _in)).toString());
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async deleteFrom(props: QueueScheduleServiceInterface) {
    try {
      SqlBricks.aliasExpansions({
        'q_sch': "queue_schedules",
        'qrec': "queue_records",
        'exe': "executions",
        'pip': "pipelines",
        'pro': "projects"
      });

      let selectQuery = SqlBricks.select(
        "q_sch.queue_record_id"
      ).from("q_sch");

      selectQuery = selectQuery.leftJoin("qrec").on({
        "q_sch.queue_record_id": "qrec.id"
      }).leftJoin("exe").on({
        "exe.id": "q_sch.execution_id"
      }).leftJoin("pip").on({
        "pip.id": "exe.pipeline_id"
      }).leftJoin("pro").on({
        "pro.id": "exe.project_id"
      });

      if (props.project_ids != null) {
        selectQuery = selectQuery.where(SqlBricks.in("pro.id", props.project_ids));
      }

      if (props.pipeline_ids != null) {
        selectQuery = selectQuery.where(SqlBricks.in("pip.id", props.pipeline_ids));
      }

      if (props.execution_ids != null) {
        selectQuery = selectQuery.where(SqlBricks.in("exe.id", props.execution_ids));
      }

      if (props.queue_record_ids != null) {
        selectQuery = selectQuery.where(SqlBricks.in("qrec.id", props.queue_record_ids));
      }

      let resDeleteQuery = await SqlService.delete(`
        DELETE FROM queue_schedules WHERE queue_record_id IN (
          ${selectQuery.toString()}
        )
      `);
      return resDeleteQuery;
    } catch (ex) {
      throw ex;
    }
  }
}