import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import SqlBricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
import CreateQueue from "../functions/CreateQueue";
import HostService, { Host } from "./HostService";
import PipelineItemService, { PipelineItemInterface } from "./PipelineItemService";
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
  mode?: string
  hosts?: Array<Host>
}

export interface ExecutionServiceInterface extends Execution {
  ids?: Array<number>
  force_deleted?: boolean
}

export default {
  PROCESS_MODE,
  async addExecution(props: Execution) {
    try {
      let resData = await SqlService.insert(SqlBricks.insert('executions', {
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
        mode: props.mode
      }).toString());
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
      let resData = await SqlService.update(SqlBricks.update('executions', {
        name: props.name,
        process_mode: props.process_mode,
        process_limit: props.process_limit,
        pipeline_id: props.pipeline_id,
        project_id: props.project_id,
        branch: props.branch,
        user_id: props.user_id,
        variable_id: props.variable_id,
        variable_option: props.variable_option,
        pipeline_item_ids: JSON.stringify(props.pipeline_item_ids),
        host_ids: JSON.stringify(props.host_ids),
        description: props.description,
        mode: props.mode,
      }).where("id", props.id).toString());
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
      let resData = await SqlService.smartDelete(SqlBricks.delete('executions').where(SqlBricks.in("id", _in)).toString(), props.force_deleted || false);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  getExecution: async function (props: ExecutionServiceInterface) {
    try {
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
        'pro.name as pro_name',
        'pip.name as pip_name',
        'var.name as var_name'
      ).from("exe");
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
        'pro.name as pro_name',
        'pip.name as pip_name',
        'var.name as var_name'
      ).from("exe");
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
                let data = JSON.parse("{}");
                let process_mode = resData.process_mode;
                let process_limit = resData.process_limit || 1;
                let queue_name = "queue_" + process_mode + "_" + id;
                let resQueueRecord = await CreateQueue({ id, data, process_mode, process_limit, queue_name });
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
  }
}