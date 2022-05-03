import SqlBricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
declare let db: Knex;

export default {
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
      console.log("aaaaaaaaaaaaaaaaaaa :: ", props);
      query = query.where({
        "vari.id": props.id,
        "vari.user_id": props.user_id
      });
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
  }
}