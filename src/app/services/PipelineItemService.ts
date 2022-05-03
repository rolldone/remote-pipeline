import SqlBricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
declare let db: Knex;

const TYPE = {
  ANSIBLE: "ansible",
  BASIC: "basic"
}

export default {
  TYPE,
  async getPipelineItem(props) {
    try {
      SqlBricks.aliasExpansions({
        'pro': "projects",
        'pip': "pipelines",
        'pip_item': "pipeline_items"
      });
      let query = SqlBricks.select(
        "pip_item.name as name",
        "pip_item.id as id",
        "pip_item.description as description",
        "pip_item.is_active as is_active",
        "pip_item.order_number as order_number",
        "pro.name as pro_name",
        "pro.id as pro_id",
        "pro.description as pro_description",
        "pro.user_id as pro_user_id",
        "pip.name as pip_name",
        "pip.id as pip_id",
        "pip.description as pip_description"
      ).from("pip_item").leftJoin("pro").on({
        "pro.id": "pip_item.project_id"
      }).leftJoin("pip").on({
        "pip.id": "pip_item.pipeline_id"
      });
      query = query.where({
        "pip_item.project_id": props.project_id,
        "pip_item.pipeline_id": props.pipeline_id,
        "pip_item.id": props.id
      });
      query = query.limit(1);
      // return query.toString();
      let resData = await db.raw(query.toString());
      resData = resData[0];
      if (resData == null) return;
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getPipelineItems(props) {
    try {
      SqlBricks.aliasExpansions({
        'pro': "projects",
        'pip_item': "pipeline_items",
        'pip': "pipelines"
      });
      let query = SqlBricks.select(
        "pip_item.name as name",
        "pip_item.id as id",
        "pip_item.description as description",
        "pip_item.is_active as is_active",
        "pip_item.order_number as order_number",
        "pro.name as pro_name",
        "pro.id as pro_id",
        "pro.description as pro_description",
        "pro.user_id as pro_user_id",
        "pip.name as pip_name",
        "pip.id as pip_id",
        "pip.description as pip_description"
      ).from("pip_item").leftJoin("pro").on({
        "pro.id": "pip_item.project_id"
      }).leftJoin("pip").on({
        "pip.id": "pip_item.pipeline_id"
      });
      query = query.where({
        "pip_item.project_id": props.project_id,
        "pip_item.pipeline_id": props.pipeline_id,
      });
      if (props.order_by_name != null) {
        query = query.orderBy("pip_item." + props.order_by_name + " " + props.order_by_value);
      }
      // return query.toString();
      let resData = await db.raw(query.toString());
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
}