import SqlBricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
import CreateDate from "../functions/base/CreateDate";
import SqlService from "./SqlService";
declare let db: Knex;

export interface PipelineTaskInterface {
  id?: number
  project_id?: number
  pipeline_id?: number
  pipeline_item_id?: number
  type?: string
  description?: string
  name?: string
  order_number?: number
  temp_id?: string
  parent_order_temp_ids?: Array<string>
  is_active?: boolean | number
  created_at?: string
  updated_at?: string
  data?: {
    parent_condition_type?: string
    condition_values?: string
    command?: string
  }
}

export interface PipelineTaskServiceInterface extends PipelineTaskInterface {
  ids?: Array<number>
  pipeline_item_ids?: Array<number>
  parent?: string
  order_by?: string
  force_deleted?: boolean
  project_ids?: Array<number>
  pipeline_ids?: Array<number>
}

export default {
  async deletePipelineTaskByPipelineItemId(props: PipelineTaskServiceInterface) {
    try {
      let resData = await SqlService.smartDelete(SqlBricks.deleteFrom("pipeline_tasks").where({
        pipeline_item_id: props.pipeline_item_id
      }).toString(), props.force_deleted || false);
      return {
        status: 'success',
        status_code: 200,
        return: resData
      }
    } catch (ex) {
      throw ex;
    }
  },
  async addPipelineTasks(props: Array<PipelineTaskInterface>) {
    try {
      // Delete First
      let resDeleteData = await SqlService.delete(SqlBricks.deleteFrom("pipeline_tasks").where({
        pipeline_item_id: props[0].pipeline_item_id
      }).toString());
      let resData = [];
      for (var a = 0; a < props.length; a++) {
        // Insert again
        let _command_data = props[a];
        let resDataId = await SqlService.insert(SqlBricks.insert("pipeline_tasks", CreateDate({
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
        })).toString());
        // Select the data
        resData.push(await SqlService.selectOne(SqlBricks.select("*").from("pipeline_tasks").where("id", resDataId).toString()));
      }
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getPipelineTask(props: PipelineTaskServiceInterface) {
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
        "pip_task.created_at as created_at",
        "pip_task.updated_at as updated_at",
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

      if (props.pipeline_id != null) {
        query = query.where("pip.id", props.pipeline_id);
      }

      if (props.order_number != null) {
        query = query.where("pip_task.order_number", props.order_number);
      }

      if (props.parent != null) {
        if (props.parent == "NULL") {
          query = query.where(SqlBricks.or(SqlBricks.isNull('pip_task.parent_order_temp_ids'), { "pip_task.parent_order_temp_ids": "[]" }))
        } else {
          query = query.where(SqlBricks("json_array(pip_task.parent_order_temp_ids) LIKE '%" + props.parent + "%'"));
        }
      }

      query = query.where(SqlBricks.isNull("pip_item.deleted_at"));
      query = query.where(SqlBricks.isNull("pip_task.deleted_at"));

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
  async getPipelineTasks(props: PipelineTaskServiceInterface) {
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
        "pip_task.created_at as created_at",
        "pip_task.updated_at as updated_at",
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

      if (props.pipeline_id != null) {
        query = query.where("pip.id", props.pipeline_id);
      }

      if (props.order_number != null) {
        query = query.where("pip_task.order_number", props.order_number);
      }

      if (props.parent != null) {
        if (props.parent == "NULL") {
          query = query.where(SqlBricks.or(SqlBricks.isNull('pip_task.parent_order_temp_ids'), { "pip_task.parent_order_temp_ids": "[]" }))
        } else {
          query = query.where(SqlBricks("json_array(pip_task.parent_order_temp_ids) LIKE '%" + props.parent + "%'"));
        }
      }

      if (props.ids != null) {
        query = query.where(SqlBricks.in("pip_task.id", props.ids || []));
      }

      if (props.pipeline_item_ids != null && props.pipeline_item_ids.length > 0) {
        query = query.where(SqlBricks.in("pip_task.pipeline_item_id", props.pipeline_item_ids || []));
      }

      query = query.where(SqlBricks.isNull("pip_item.deleted_at"));
      query = query.where(SqlBricks.isNull("pip_task.deleted_at"));

      if (props.order_by) {
        query = query.orderBy(props.order_by);
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

  async getPipelineTaskFirsOrderNumberByPipelineId(pipeline_item_id: number) {
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
        "pip_task.created_at as created_at",
        "pip_task.updated_at as updated_at",
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

      query = query.where({
        "pip_task.pipeline_item_id": pipeline_item_id,
        "pip_task.order_number": 0
      })

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
  async deleteFrom(props?: PipelineTaskServiceInterface) {
    try {
      SqlBricks.aliasExpansions({
        "pip_task": "pipeline_tasks",
        "pip": "pipelines",
        "pro": "projects"
      });

      let selectQuery = SqlBricks.select(
        "pip_task.id"
      ).from("pip_task");

      selectQuery = selectQuery.leftJoin("pip").on({
        "pip.id": "pip_task.pipeline_id"
      }).leftJoin("pro").on({
        "pro.id": "pip_task.project_id"
      });

      if (props.project_ids != null) {
        selectQuery = selectQuery.where(SqlBricks.in("pro.id", props.project_ids));
      }

      if (props.pipeline_ids != null) {
        selectQuery = selectQuery.where(SqlBricks.in("pip.id", props.pipeline_ids));
      }

      let resDeleteQuery = await SqlService.delete(`
        DELETE FROM pipeline_tasks WHERE id IN (
          ${selectQuery.toString()}
        )
      `);
      return resDeleteQuery;
    } catch (ex) {
      throw ex;
    }
  }
}