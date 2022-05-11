import SqlBricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
import SqlService from "./SqlService";
declare let db: Knex;

export interface command_data {
  project_id?: number
  pipeline_id?: number
  pipeline_item_id?: number
  type: string
  description?: string
  name?: string
  order_number?: number
  temp_id?: string
  parent_order_temp_ids?: Array<string>
  is_active?: boolean | number
  data?: {
    parent_condition_type?: string
    condition_values?: string
    command?: string
  }
}

export default {
  async deletePipelineTaskByPipelineItemId(pipeline_item_id: number) {
    try {
      let resData = await SqlService.delete(SqlBricks.deleteFrom("pipeline_tasks").where({
        pipeline_item_id: pipeline_item_id
      }).toString());
      return {
        status: 'success',
        status_code: 200,
        return: resData
      }
    } catch (ex) {
      throw ex;
    }
  },
  async addPipelineTasks(props: Array<command_data>) {
    try {
      // Delete First
      let resDeleteData = await SqlService.delete(SqlBricks.deleteFrom("pipeline_tasks").where({
        pipeline_item_id: props[0].pipeline_item_id
      }).toString());
      let resData = [];
      for (var a = 0; a < props.length; a++) {
        // Insert again
        let _command_data = props[a];
        let resDataId = await SqlService.insert(SqlBricks.insert("pipeline_tasks", {
          pipeline_id: _command_data.pipeline_id,
          project_id: _command_data.project_id,
          pipeline_item_id: _command_data.pipeline_item_id,
          name: _command_data.name,
          description: _command_data.description,
          type: _command_data.type,
          order_number: _command_data.order_number,
          temp_id: _command_data.temp_id,
          parent_order_temp_ids: _command_data.parent_order_temp_ids == null ? null : JSON.stringify(_command_data.parent_order_temp_ids),
          is_active: _command_data.is_active,
          data: JSON.stringify(_command_data.data)
        }).toString());
        // Select the data
        resData.push(await SqlService.selectOne(SqlBricks.select("*").from("pipeline_tasks").where("id", resDataId).toString()));
      }
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getPipelineTask(props: any) {
    try {

      SqlBricks.aliasExpansions({
        "pip_task": "pipeline_tasks",
        "pip_item": "pipeline_items",
        "pip": "pipelines",
        "pro": "projects"
      });

      let query = SqlBricks.select(
        "pip_task.id as id",
        "pip_task.name as name",
        "pip_task.pipeline_id as pipeline_id",
        "pip_task.project_id as project_id",
        "pip_task.pipeline_item_id as pipeline_item_id",
        "pip_task.type as type",
        "pip_task.description as description",
        "pip_task.order_number as order_number",
        "pip_task.temp_id as temp_id",
        "pip_task.is_active as is_active",
        "pip_task.data as data",
        "pip_item.id as pip_item_id",
        "pip_item.name as pip_item_name",
        "pip_item.is_active as pip_item_is_active",
        "pip_item.type as pip_item_type",
        "pip_item.order_number as pip_item_order_number",
        "pip_item.description as pip_item_description",
        "pip.id as pip_id",
        "pip.name as pip_name",
        "pip.description as pip_description",
        "pro.id as pro_id",
        "pro.name as pro_name",
        "pro.description as pro_description"
      )

      query = query.from("pip_task");
      query = query.leftJoin("pip_item").on("pip_item.id", "pip_task.pipeline_item_id")
        .leftJoin("pip").on("pip.id", "pip_item.pipeline_id")
        .leftJoin("pro").on("pro.id", "pip.project_id");

      if (props.id != null) {
        query = query.where("pip_task.id", props.id);
      };

      if (props.order_number != null) {
        query = query.where("pip_task.order_number", props.order_number);
      }

      if (props.parent != null) {
        query = query.where(SqlBricks("json_extract(json_each.value,'$') = " + props.parent));
      }

      query = query.orderBy("pip_task.id ASC");
      query = query.limit(1);

      let resData = await db.raw(query.toString());
      resData = resData[0];
      if (resData == null) return;
      resData.data = JSON.parse(resData.data);
      resData.parent_order_temp_ids = resData.parent_order_temp_ids == null ? [] : JSON.parse(resData.parent_order_temp_ids);
      return resData;

    } catch (ex) {
      throw ex;
    }
  },
  async getPipelineTasks(props: any) {
    try {

      SqlBricks.aliasExpansions({
        "pip_task": "pipeline_tasks",
        "pip_item": "pipeline_items",
        "pip": "pipelines",
        "pro": "projects"
      });

      let query = SqlBricks.select(
        "pip_task.id as id",
        "pip_task.name as name",
        "pip_task.pipeline_id as pipeline_id",
        "pip_task.project_id as project_id",
        "pip_task.pipeline_item_id as pipeline_item_id",
        "pip_task.type as type",
        "pip_task.description as description",
        "pip_task.order_number as order_number",
        "pip_task.temp_id as temp_id",
        "pip_task.parent_order_temp_ids as parent_order_temp_ids",
        "pip_task.is_active as is_active",
        "pip_task.data as data",
        "pip_item.id as pip_item_id",
        "pip_item.name as pip_item_name",
        "pip_item.is_active as pip_item_is_active",
        "pip_item.type as pip_item_type",
        "pip_item.order_number as pip_item_order_number",
        "pip_item.description as pip_item_description",
        "pip.id as pip_id",
        "pip.name as pip_name",
        "pip.description as pip_description",
        "pro.id as pro_id",
        "pro.name as pro_name",
        "pro.description as pro_description"
      );

      query = query.from("pip_task");
      query = query.leftJoin("pip_item").on("pip_item.id", "pip_task.pipeline_item_id")
        .leftJoin("pip").on("pip.id", "pip_item.pipeline_id")
        .leftJoin("pro").on("pro.id", "pip.project_id");

      if (props.pipeline_item_id != null) {
        query = query.where("pip_item.id", props.pipeline_item_id);
      };

      if (props.order_by) {
        query = query.orderBy(props.order_by + " " + (props.order_by_value || "ASC"));
      }

      if (props.order_number != null) {
        query = query.where("pip_task.order_number", props.order_number);
      }

      if (props.parent != null) {
        if (props.parent == "NULL") {
          query = query.where(SqlBricks.isNull('pip_task.parent_order_temp_ids'));
        } else {
          query = query.where(SqlBricks("json_array(pip_task.parent_order_temp_ids) LIKE '%" + props.parent + "%'"));
        }
      }

      let gg = query.toString();
      let resDatas = await db.raw(gg);

      resDatas.filter((resData) => {
        resData.data = JSON.parse(resData.data);
        resData.parent_order_temp_ids = resData.parent_order_temp_ids == null ? [] : JSON.parse(resData.parent_order_temp_ids);
        return resData;
      })

      return resDatas;
    } catch (ex) {
      throw ex;
    }
  },
}