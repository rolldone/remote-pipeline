import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import SqlBricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
import BoolearParse from "../functions/base/BoolearParse";
import CreateDate from "../functions/base/CreateDate";
import SafeValue from "../functions/base/SafeValue";
import CreateQueue from "../functions/CreateQueue";
import HostService, { Host } from "./HostService";
import PipelineItemService, { PipelineItemInterface } from "./PipelineItemService";
import QueueRecordDetailService from "./QueueRecordDetailService";
import QueueRecordService from "./QueueRecordService";
import QueueSceduleService from "./QueueSceduleService";
import SqlService from "./SqlService";

declare let db: Knex;
declare let masterData: MasterDataInterface;

const PROCESS_MODE = {
  SEQUENTIAL: 'sequential',
  PARALLEL: 'parallel'
}

export interface Execution {
  id?: number
  name?: string
  process_mode?: string
  process_limit?: number
  pipeline_id?: number
  project_id?: number
  user_id?: number
  branch?: string
  variable_id?: number
  variable_option?: string
  pipeline_item_ids?: Array<number>
  pipeline_items?: Array<PipelineItemInterface>
  host_ids?: Array<number>
  description?: string
  access_host_type?: string
  created_at?: string
  updated_at?: string
  mode?: string
  delay?: number
  hosts?: Array<Host>
  parent_id?: number
  execution_type?: string
}

export interface ExecutionServiceInterface extends Execution {
  ids?: Array<number>
  force_deleted?: boolean
  project_ids?: Array<number>
  pipeline_ids?: Array<number>
}

const defineQuery = () => {

  SqlBricks.aliasExpansions({
    'pro': "projects",
    "pip": "pipelines",
    "pip_item": "pipeline_items",
    "var": "variables",
    'usr': "users",
    'exe': "executions",
  });
  let query = SqlBricks.select(
    'exe.id as id',
    'exe.name as name',
    'exe.process_mode as process_mode',
    'exe.process_limit as process_limit',
    'exe.pipeline_id as pipeline_id',
    'exe.project_id as project_id',
    'exe.user_id as user_id',
    'exe.branch as branch',
    'exe.variable_id as variable_id',
    'exe.variable_option as variable_option',
    'exe.pipeline_item_ids as pipeline_item_ids',
    'exe.host_ids as host_ids',
    'exe.description as description',
    'exe.mode as mode',
    'exe.access_host_type as access_host_type',
    'exe.created_at as created_at',
    'exe.updated_at as updated_at',
    'exe.parent_id as parent_id',
    'exe.delay as delay',
    'exe.execution_type as execution_type',
    'pro.name as pro_name',
    'pip.name as pip_name',
    'var.name as var_name',
  ).from("exe");

  return query;
}

export default {
  PROCESS_MODE,
  async addExecution(props: Execution) {
    try {
      let resData = await SqlService.insert(SqlBricks.insert('executions', CreateDate({
        name: props.name,
        process_mode: props.process_mode,
        process_limit: props.process_limit,
        pipeline_id: props.pipeline_id,
        project_id: props.project_id,
        user_id: props.user_id,
        branch: props.branch,
        variable_id: props.variable_id,
        variable_option: props.variable_option,
        pipeline_item_ids: JSON.stringify(props.pipeline_item_ids),
        host_ids: JSON.stringify(props.host_ids),
        description: props.description,
        access_host_type: props.access_host_type,
        mode: props.mode,
        delay: props.delay,
        parent_id: props.parent_id || null,
        execution_type: props.execution_type
      })).toString());
      resData = await this.getExecution({
        id: resData.id
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async updateExecution(props: Execution) {
    try {
      let exeData: Execution = await this.getExecution({
        id: props.id
      });
      if (exeData == null) {
        throw new Error("Execution data not found!");
      }
      let resData = await SqlService.update(SqlBricks.update('executions', CreateDate({
        name: SafeValue(props.name, exeData.name),
        process_mode: SafeValue(props.process_mode, exeData.process_mode),
        process_limit: SafeValue(props.process_limit, exeData.process_limit),
        pipeline_id: SafeValue(props.pipeline_id, exeData.pipeline_id),
        project_id: SafeValue(props.project_id, exeData.project_id),
        branch: SafeValue(props.branch, exeData.branch),
        user_id: SafeValue(props.user_id, exeData.user_id),
        variable_id: SafeValue(props.variable_id, exeData.variable_id),
        variable_option: SafeValue(props.variable_option, exeData.variable_option),
        pipeline_item_ids: JSON.stringify(SafeValue(props.pipeline_item_ids, exeData.pipeline_item_ids)),
        host_ids: JSON.stringify(SafeValue(props.host_ids, exeData.host_ids)),
        description: SafeValue(props.description, exeData.description),
        access_host_type: SafeValue(props.access_host_type, exeData.access_host_type),
        mode: SafeValue(props.mode, exeData.mode),
        delay: SafeValue(props.delay, exeData.delay),
        created_at: SafeValue(exeData.created_at, null),
        parent_id: SafeValue(exeData.parent_id, null),
        execution_type: SafeValue(props.execution_type, exeData.execution_type)
      })).where("id", props.id).toString());
      resData = await this.getExecution({
        id: props.id
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async deleteExecutions(props: ExecutionServiceInterface) {
    try {
      let _in: Array<any> | string = [
        ...props.ids
      ];
      _in = _in.join(',');

      let _force_deleted = BoolearParse(SafeValue(props.force_deleted, "false"));

      if (_force_deleted == true) {
        let resDeleteQueueRecordDetail = await QueueRecordDetailService.deleteFrom({
          execution_ids: props.ids
        })
        let resDeleteQueueSchedule = await QueueSceduleService.deleteFrom({
          execution_ids: props.ids
        })
        let resDeleteQueueRecord = await QueueRecordService.deleteFrom({
          execution_ids: props.ids
        })
      }

      let resData = await SqlService.smartDelete(SqlBricks.delete('executions').where(SqlBricks.in("id", _in)).toString(), _force_deleted);

      return null;//resData;
    } catch (ex) {
      throw ex;
    }
  },
  getExecution: async function (props: ExecutionServiceInterface) {
    try {
      let query = defineQuery();

      query = query.leftJoin('pro').on({
        "pro.id": "exe.project_id"
      });
      query = query.leftJoin('pip').on({
        "pip.id": "exe.pipeline_id"
      });
      query = query.leftJoin("usr").on({
        "usr.id": "exe.user_id"
      });
      query = query.leftJoin("var").on({
        "var.id": "exe.variable_id"
      });
      if (props.user_id != null) {
        query = query.where("usr.id", props.user_id);
      }
      query = query.where("exe.id", props.id);

      // Need table project deleted_at null
      query = query.where(SqlBricks.isNull("pro.deleted_at"));
      query = query.where(SqlBricks.isNull("pip.deleted_at"));
      query = query.where(SqlBricks.isNull("exe.deleted_at"));

      query = query.orderBy("exe.id DESC");
      query = query.limit(1);
      let resData = await db.raw(query.toString());
      resData = resData[0];
      if (resData == null) return;
      resData.pipeline_item_ids = JSON.parse(resData.pipeline_item_ids || '[]');
      resData.host_ids = JSON.parse(resData.host_ids || '[]');
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  getExecutions: async function (props: ExecutionServiceInterface) {
    try {
      let query = defineQuery();

      query = query.leftJoin('pro').on({
        "pro.id": "exe.project_id"
      });
      query = query.leftJoin('pip').on({
        "pip.id": "exe.pipeline_id"
      });
      query = query.leftJoin("usr").on({
        "usr.id": "exe.user_id"
      });
      query = query.leftJoin("var").on({
        "var.id": "exe.variable_id"
      });
      if (props.user_id != null) {
        query = query.where("usr.id", props.user_id);
      }
      if (props.mode == null) {
        query = query.where(SqlBricks.isNull("exe.mode"));
      } else {
        query = query.where("exe.mode", props.mode);
      }

      if (props.pipeline_id != null) {
        query = query.where("pip.id", props.pipeline_id);
      }

      if (props.project_id != null) {
        query = query.where("pro.id", props.project_id);
      }

      if (props.parent_id != null) {
        query = query.where("exe.parent_id", props.parent_id);
      } else {
        query = query.where("exe.parent_id", null);
      }

      // Need table project deleted_at null
      query = query.where(SqlBricks.isNull("pro.deleted_at"));
      query = query.where(SqlBricks.isNull("pip.deleted_at"));
      query = query.where(SqlBricks.isNull("exe.deleted_at"));

      query = query.orderBy("exe.id DESC");
      let resDatas: Array<any> = await db.raw(query.toString());
      for (let a = 0; a < resDatas.length; a++) {
        let resData: Execution = resDatas[a];
        resData.pipeline_item_ids = JSON.parse(resData.pipeline_item_ids as any || '[]');
        resData.pipeline_items = await PipelineItemService.getPipelineItems({
          project_id: resData.project_id,
          pipeline_id: resData.pipeline_id,
          ids: resData.pipeline_item_ids
        });
        resData.host_ids = JSON.parse(resData.host_ids as any || '[]');
        resData.hosts = await HostService.getHosts({
          ids: resData.host_ids
        })
      }
      return resDatas;
    } catch (ex) {
      throw ex;
    }
  },
  async runExecution(props) {
    try {
      /* Get the execution data first */
      // SqlBricks.aliasExpansions({
      //   'pro': "projects",
      //   "pip": "pipelines",
      //   "pip_item": "pipeline_items",
      //   "var": "variables",
      //   'usr': "users",
      //   'exe': "executions",
      // });
      // let query = SqlBricks.select(
      //   'exe.id as id',
      //   'exe.name as name',
      //   'exe.process_mode as process_mode',
      //   'exe.process_limit as process_limit',
      //   'exe.pipeline_id as pipeline_id',
      //   'exe.project_id as project_id',
      //   'exe.user_id as user_id',
      //   'exe.variable_id as variable_id',
      //   'exe.variable_option as variable_option',
      //   'exe.pipeline_item_ids as pipeline_item_ids',
      //   'exe.host_ids as host_ids',
      //   'exe.description as description',
      //   'pro.name as pro_name',
      //   'pip.name as pip_name',
      //   'var.name as var_name'
      // ).from("exe");
      // query = query.leftJoin('pro').on({
      //   "pro.id": "exe.project_id"
      // });
      // query = query.leftJoin('pip').on({
      //   "pip.id": "exe.pipeline_id"
      // });
      // query = query.leftJoin("usr").on({
      //   "usr.id": "exe.user_id"
      // });
      // query = query.leftJoin("var").on({
      //   "var.id": "exe.variable_id"
      // });
      // if (props.user_id != null) {
      //   query = query.where("usr.id", props.user_id);
      // }
      // query = query.where("exe.id", props.id);
      // query = query.orderBy("exe.id DESC");
      // query = query.limit(1);
      // let resData = await SqlService.selectOne(query.toString());
      let resData = await this.getExecution({
        id: props.id
      })
      /* Generate the on bull queue */
      var createTheQueue = (resData) => {
        let id = resData.id;
        let data = resData.data;
        return new Promise((resolve: Function) => {
          masterData.saveData("queue.request.queue", {
            id, data,
            callback: async (props) => {
              if (props == "") {
                let variable_extra = JSON.parse("{}");
                let process_mode = resData.process_mode;
                let process_limit = resData.process_limit || 1;
                let queue_name = "queue_" + process_mode + "_" + id;
                let delay = 2000;
                let resQueueRecord = await CreateQueue({ id, variable_extra, process_mode, process_limit, queue_name, delay });
                return resolve(resQueueRecord);
              }
              resolve(props);
            }
          })
        });
      }
      resData = await createTheQueue(resData);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async deleteFrom(props?: ExecutionServiceInterface) {
    try {
      SqlBricks.aliasExpansions({
        'exe': "executions",
        'pip': "pipelines",
        'pro': "projects"
      });

      let selectQuery = SqlBricks.select(
        "exe.id"
      ).from("exe");

      selectQuery = selectQuery.leftJoin("pip").on({
        "exe.pipeline_id": "pip.id"
      }).leftJoin("pro").on({
        "pro.id": "exe.project_id"
      });

      if (props.project_ids != null) {
        selectQuery = selectQuery.where(SqlBricks.in("pro.id", props.project_ids));
      }

      if (props.pipeline_ids != null) {
        selectQuery = selectQuery.where(SqlBricks.in("pip.id", props.pipeline_ids));
      }

      let resDeleteQuery = await SqlService.delete(`
        DELETE FROM executions WHERE id IN (
          ${selectQuery.toString()}
        )
      `);
      return resDeleteQuery;
    } catch (ex) {
      throw ex;
    }
  }
}