import SqlBricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
import SqlService from "./SqlService";
declare let db: Knex;

export interface variableInterface {
  id?: number
  pipeline_id?: number
  project_id?: number
  user_id?: number
  name?: string
  data?: any
  schema?: any
  description?: string
}

export interface VariableServiceInterface extends variableInterface {
  project_ids?: Array<number>
  pipeline_ids?: Array<number>
}

export default {
  async addVariable(props: variableInterface): Promise<any> {
    try {
      let query = SqlBricks.insert("variables", {
        id: props.id,
        pipeline_id: props.pipeline_id,
        project_id: props.project_id,
        user_id: props.user_id,
        name: props.name,
        data: JSON.stringify(props.data),
        schema: JSON.stringify(props.schema),
        description: props.description,
      });
      let resDataId = await SqlService.insert(query.toString());
      let resData = await this.getVariable({
        id: resDataId
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async updateVariable(props: variableInterface): Promise<any> {
    try {
      let query = SqlBricks.update("variables", {
        pipeline_id: props.pipeline_id,
        project_id: props.project_id,
        user_id: props.user_id,
        name: props.name,
        data: JSON.stringify(props.data),
        schema: JSON.stringify(props.schema),
        description: props.description,
      });
      query = query.where({
        "id": props.id,
        "user_id": props.user_id
      });
      await SqlService.update(query.toString());
      let resData = await this.getVariable({
        id: props.id,
        user_id: props.user_id
      });
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  getVariable: async function (props: any) {
    try {
      SqlBricks.aliasExpansions({
        "vari": "variables",
        "pip": "pipelines",
        "pro": "projects"
      });

      let query = SqlBricks.select(
        "vari.id as id",
        "vari.name as name",
        "vari.pipeline_id as pipeline_id",
        "vari.project_id as project_id",
        "vari.user_id as user_id",
        "vari.description as description",
        "vari.schema as schema",
        "vari.data as data",
        "pip.id as pip_id",
        "pip.name as pip_name",
        "pip.description as pip_description",
        "pro.id as pro_id",
        "pro.name as pro_name",
        "pro.description as pro_description"
      );

      query = query.from("vari");
      query = query
        .leftJoin("pip").on("pip.id", "vari.pipeline_id")
        .leftJoin("pro").on("pro.id", "pip.project_id");
      query = query.where({
        "vari.id": props.id
      });

      if (props.user_id) {
        query = query.where("vari.user_id", props.user_id);
      }

      // Where segment
      if (props.pipeline_id != null) {
        query = query.where("pip.id", props.pipeline_id);
      }
      let resData = await db.raw(query.toString());
      resData = resData[0];
      if (resData == null) return;
      resData.data = JSON.parse(resData.data || '[]');
      resData.schema = JSON.parse(resData.schema || '[]');
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  getVariables: async function (props: any) {
    try {
      SqlBricks.aliasExpansions({
        "vari": "variables",
        "pip": "pipelines",
        "pro": "projects"
      });

      let query = SqlBricks.select(
        "vari.id as id",
        "vari.name as name",
        "vari.pipeline_id as pipeline_id",
        "vari.project_id as project_id",
        "vari.user_id as user_id",
        "vari.description as description",
        "vari.schema as schema",
        "vari.data as data",
        "pip.id as pip_id",
        "pip.name as pip_name",
        "pip.description as pip_description",
        "pro.id as pro_id",
        "pro.name as pro_name",
        "pro.description as pro_description"
      );

      query = query.from("vari");
      query = query
        .leftJoin("pip").on("pip.id", "vari.pipeline_id")
        .leftJoin("pro").on("pro.id", "pip.project_id");

      // Where segment
      if (props.pipeline_id != null) {
        query = query.where("pip.id", props.pipeline_id);
      }
      let resDatas = await db.raw(query.toString());
      resDatas.filter((resData) => {
        resData.data = JSON.parse(resData.data || '[]');
        resData.schema = JSON.parse(resData.schema || '[]');
        return resData;
      })
      return resDatas
    } catch (ex) {
      throw ex;
    }
  },
  async deleteVariable(ids: Array<number>): Promise<any> {
    try {
      let _in: Array<any> | string = [
        ...ids
      ];
      _in = _in.join(',');
      let resData = await SqlService.delete(SqlBricks.delete('variables').where(SqlBricks.in("id", _in)).toString());
      return {
        status: 'success',
        status_code: 200,
        return: resData
      }
    } catch (ex) {
      throw ex;
    }
  },
  async deleteFrom(props?: VariableServiceInterface) {
    try {
      SqlBricks.aliasExpansions({
        "vari": "variables",
        "pip": "pipelines",
        "pro": "projects"
      });

      let selectQuery = SqlBricks.select(
        "vari.id"
      ).from("vari");

      selectQuery = selectQuery.leftJoin("pip").on({
        "pip.id": "vari.pipeline_id"
      }).leftJoin("pro").on({
        "pro.id": "vari.project_id"
      });

      if (props.project_ids != null) {
        selectQuery = selectQuery.where(SqlBricks.in("pro.id", props.project_ids));
      }

      if (props.pipeline_ids != null) {
        selectQuery = selectQuery.where(SqlBricks.in("pip.id", props.pipeline_ids));
      }

      let resDeleteQuery = await SqlService.delete(`
        DELETE FROM variables WHERE id IN (
          ${selectQuery.toString()}
        )
      `);
      return resDeleteQuery;
    } catch (ex) {
      throw ex;
    }
  }
}