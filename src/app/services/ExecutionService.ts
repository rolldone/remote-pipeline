import SqlBricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
declare let db: Knex;

const PROCESS_MODE = {
  SEQUENTIAL: 'sequential',
  PARALLEL: 'parallel'
}

export default {
  PROCESS_MODE,
  getExecution: async function (props: any) {
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
        'exe.variable_id as variable_id',
        'exe.variable_option as variable_option',
        'exe.pipeline_item_ids as pipeline_item_ids',
        'exe.host_ids as host_ids',
        'exe.description as description',
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
  getExecutions: async function (props: any) {
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
        'exe.variable_id as variable_id',
        'exe.variable_option as variable_option',
        'exe.pipeline_item_ids as pipeline_item_ids',
        'exe.host_ids as host_ids',
        'exe.description as description',
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
      query = query.orderBy("exe.id DESC");
      let resDatas: Array<any> = await db.raw(query.toString());
      resDatas.filter((resData) => {
        resData.pipeline_item_ids = JSON.parse(resData.pipeline_item_ids || '[]');
        resData.host_ids = JSON.parse(resData.host_ids || '[]');
        return resData;
      })
      return resDatas;
    } catch (ex) {
      throw ex;
    }
  }
}