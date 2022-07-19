import SqlBricks from "@root/tool/SqlBricks";
import CreateDate from "../functions/base/CreateDate";
import SafeValue from "../functions/base/SafeValue";
import PipelineTaskService, { PipelineTaskInterface } from "./PipelineTaskService";
import SqlService from "./SqlService";

const TYPE = {
  ANSIBLE: "ansible",
  BASIC: "basic"
}

export interface PipelineItemInterface {
  project_id?: number
  pipeline_id?: number
  id?: number
  name?: string
  is_active?: boolean
  type?: string
  order_number?: number
  description?: string
  created_at?: string
  updated_at?: string

  pipeline_tasks?: Array<any>
}

const preSelectQuery = () => {
  SqlBricks.aliasExpansions({
    'pro': "projects",
    'pip': "pipelines",
    'pip_item': "pipeline_items",
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
    "pip.description as pip_description",
    "pip.created_at as created_at",
    "pip.updated_at as updated_at",
  ).from("pip_item").leftJoin("pro").on({
    "pro.id": "pip_item.project_id"
  }).leftJoin("pip").on({
    "pip.id": "pip_item.pipeline_id"
  });

  return query;
}

export interface PipelineItemServiceInterface extends PipelineItemInterface {
  ids?: Array<number>
  order_by_name?: string
  order_by_value?: string
  force_deleted?: boolean

  // Relation
  project_ids?: Array<number>
  pipeline_ids?: Array<number>

  // One to many
  pipeline_tasks?: Array<PipelineTaskInterface>
}

const returnFactoryColumn = async (props: PipelineItemServiceInterface) => {
  props.pipeline_tasks = await PipelineTaskService.getPipelineTasks({
    pipeline_item_id: props.id
  });
  return props;
}

export default {
  TYPE,
  async getPipelineItemParents(project_id: number, pipeline_id: number, order_number: number) {
    try {
      let resData = await SqlService.select(SqlBricks.select("*").from("pipeline_items")
        .where({
          "pipeline_id": pipeline_id,
          "project_id": project_id
        }).where(SqlBricks.gtSome("order_number", order_number)).toString());
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getPipelineItem(props: PipelineItemServiceInterface) {
    try {
      SqlBricks.aliasExpansions({
        'pro': "projects",
        'pip': "pipelines",
        'pip_item': "pipeline_items"
      });
      let query = preSelectQuery();

      query = query.where({
        "pip_item.project_id": props.project_id,
        "pip_item.pipeline_id": props.pipeline_id,
        "pip_item.id": props.id
      });

      query = query.where(SqlBricks.isNull("pip_item.deleted_at"));

      query = query.limit(1);
      // return query.toString();
      let resData = await SqlService.selectOne(query.toString());
      if (resData == null) return;
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getPipelineItems(props: PipelineItemServiceInterface) {
    try {
      SqlBricks.aliasExpansions({
        'pro': "projects",
        'pip_item': "pipeline_items",
        'pip': "pipelines"
      });

      let query = preSelectQuery();

      query = query.where({
        "pip_item.project_id": props.project_id,
        "pip_item.pipeline_id": props.pipeline_id,
      });

      if (props.ids != null) {
        query = query.where(SqlBricks.in("pip_item.id", props.ids));
      }

      query = query.where(SqlBricks.isNull("pip_item.deleted_at"));

      if (props.order_by_name != null) {
        query = query.orderBy("pip_item." + props.order_by_name + " " + props.order_by_value);
      }
      // return query.toString();
      let resDatas = await SqlService.select(query.toString());
      for (var i in resDatas) {
        resDatas[i] = await returnFactoryColumn(resDatas[i]);
      }
      return resDatas;
    } catch (ex) {
      throw ex;
    }
  },
  async addPipelineItem(props: PipelineItemServiceInterface) {
    try {
      SqlBricks.aliasExpansions({
        'pro': "projects",
        'pip': "pipelines",
        'pip_item': "pipeline_items"
      });
      let query = SqlBricks.select("*").from("pip_item");
      query = query.where({
        "pip_item.project_id": props.project_id,
        "pip_item.pipeline_id": props.pipeline_id,
        "pip_item.id": props.id
      });
      query = query.limit(1);
      // return query.toString();
      let existData = await SqlService.selectOne(query.toString());
      let resData = null;
      if (existData == "" || existData == null) {
        resData = await SqlService.insert(SqlBricks.insert('pipeline_items', CreateDate({
          pipeline_id: props.pipeline_id,
          project_id: props.project_id,
          name: props.name,
          is_active: props.is_active,
          type: props.type,
          order_number: props.order_number,
          description: props.description
        })).toString());
        resData = await this.getPipelineItem({
          id: resData,
          project_id: props.project_id,
          pipeline_id: props.pipeline_id
        })
        return resData;
      } else {
        return this.updatePipelineItem(props);
      }
    } catch (ex) {
      throw ex;
    }
  },
  async updatePipelineItem(props: PipelineItemServiceInterface) {
    try {
      let pipelineItemData: PipelineItemInterface = await this.getPipelineItem({
        id: props.id,
        project_id: props.project_id,
        pipeline_id: props.pipeline_id
      })
      if (pipelineItemData == null) {
        throw new Error("Pipeline item not found!");
      }
      await SqlService.update(SqlBricks.update('pipeline_items', CreateDate({
        pipeline_id: SafeValue(props.pipeline_id, pipelineItemData.pipeline_id),
        project_id: SafeValue(props.project_id, pipelineItemData.project_id),
        name: SafeValue(props.name, pipelineItemData.name),
        is_active: SafeValue(props.is_active, pipelineItemData.is_active),
        type: SafeValue(props.type, pipelineItemData.type),
        order_number: SafeValue(props.order_number, pipelineItemData.order_number),
        description: SafeValue(props.description, pipelineItemData.description),
        created_at: SafeValue(pipelineItemData.created_at, null)
      })).where("id", props.id).toString());
      let resData = await SqlService.selectOne(SqlBricks.select("*").from("pipeline_items").where("id", props.id).toString());
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async deletePipelineItem(props: PipelineItemServiceInterface) {
    try {
      let _in: Array<any> | string = [
        ...props.ids
      ];
      _in = _in.join(',');
      let resData = await SqlService.smartDelete(SqlBricks.delete('pipeline_items').where(SqlBricks.in("id", _in)).toString(), props.force_deleted || false);

      // Delete tasks
      await SqlService.smartDelete(SqlBricks.delete("pipeline_tasks").where(SqlBricks.in("pipeline_item_id", _in)).toString(), props.force_deleted || false);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async deleteFrom(props?: PipelineItemServiceInterface) {
    try {
      SqlBricks.aliasExpansions({
        'pip_item': "pipeline_items",
        'pip': "pipelines",
        'pro': "projects"
      });

      let selectQuery = SqlBricks.select(
        "pip_item.id"
      ).from("pip_item");

      selectQuery = selectQuery.leftJoin("pip").on({
        "pip.id": "pip_item.pipeline_id"
      }).leftJoin("pro").on({
        "pro.id": "pipeline_items.project_id"
      });

      if (props.project_ids != null) {
        selectQuery = selectQuery.where(SqlBricks.in("pro.id", props.project_ids));
      }

      if (props.pipeline_ids != null) {
        selectQuery = selectQuery.where(SqlBricks.in("pip.id", props.pipeline_ids));
      }

      let resDeleteQuery = await SqlService.delete(`
        DELETE FROM pipeline_items WHERE id IN (
          ${selectQuery.toString()}
        )
      `);
      return resDeleteQuery;
    } catch (ex) {
      throw ex;
    }
  }
}