import Sqlbricks from "@root/tool/SqlBricks"
import { Knex } from "knex";
import BoolearParse from "../functions/base/BoolearParse";
import CreateDate from "../functions/base/CreateDate";
import SafeValue from "../functions/base/SafeValue";
import ExecutionService from "./ExecutionService";
import PipelineItemService, { PipelineItemInterface } from "./PipelineItemService";
import PipelineTaskService, { PipelineTaskInterface } from "./PipelineTaskService";
import QueueRecordDetailService from "./QueueRecordDetailService";
import QueueRecordService from "./QueueRecordService";
import QueueSceduleService from "./QueueSceduleService";
import SqlService from "./SqlService";
import VariableService from "./VariableService";

declare let db: Knex;

export interface PipelineServiceInterface {
  id?: number
  name?: string
  description?: string
  project_id?: number
  oauth_user_id?: number
  connection_type?: string
  repo_data?: {
    credential_id?: number // GIt
    repo_id?: number // Gitlab
    oauth_user_id?: number // Github, Gitlab
    repo_from?: string // All
    repo_name?: string // All
    git_url?: string // All
    [key: string]: any
  }
  // repo_name?: string
  // repo_id?: number
  created_at?: string
  updated_at?: string
  // source_type?: string
  // from_provider?: string
  force_deleted?: boolean
  ids?: Array<number>
  project_ids?: Array<number>

  pipeline_items?: Array<PipelineItemInterface>
  pipeline_tasks?: Array<PipelineTaskInterface>
}

const preSelectQuery = () => {
  Sqlbricks.aliasExpansions({
    'pro': "projects",
    "pip": "pipelines"
  });
  let query = Sqlbricks.select(
    "pip.id as id",
    "pip.connection_type as connection_type",
    "pip.project_id as project_id",
    "pip.oauth_user_id as oauth_user_id",
    "pip.source_type as source_type",
    "pip.repo_name as repo_name",
    "pip.from_provider as from_provider",
    "pip.name as name",
    "pip.repo_data as repo_data",
    "pip.repo_id as repo_id",
    "pip.created_at as created_at",
    "pip.updated_at as updated_at",
    "pro.id as pro_id",
    "pro.name as pro_name"
  ).from("pip");
  return query;
}

const returnFactoryColumn = async (props: PipelineServiceInterface) => {
  props.repo_data = JSON.parse(props.repo_data as any || '{}');
  props.pipeline_items = await PipelineItemService.getPipelineItems({
    pipeline_id: props.id,
    project_id: props.project_id
  });
  props.pipeline_tasks = [];
  for (var a = 0; a < props.pipeline_items.length; a++) {
    let _pipeline_tasks = await PipelineTaskService.getPipelineTasks({
      pipeline_item_id: props.pipeline_items[a].id,
      pipeline_id: props.id
    });
    props.pipeline_tasks = _pipeline_tasks;
    props.pipeline_items[a].pipeline_tasks = _pipeline_tasks;
  }
  return props;
}

export default {
  CONNECTION_TYPE: {
    SSH: 'ssh',
    BASIC: 'basic'
  },
  async addPipeline(props: PipelineServiceInterface): Promise<any> {
    try {
      let resData = await db.raw(Sqlbricks.insert('pipelines', CreateDate({
        name: props.name,
        description: props.description,
        project_id: props.project_id,
        oauth_user_id: props.oauth_user_id,
        connection_type: props.connection_type,
        // repo_name: props.repo_name,
        // repo_id: props.repo_id,
        // from_provider: props.from_provider,
        // source_type: props.source_type,
        repo_data: JSON.stringify(props.repo_data),
      })).toString());
      let id = resData.lastInsertRowid
      resData = await this.getPipeline({
        id
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async updatePipeline(props: PipelineServiceInterface): Promise<any> {
    try {
      let pipelineData: PipelineServiceInterface = await this.getPipeline({
        id: props.id
      })
      if (pipelineData == null) {
        throw new Error("Pipeline not found!");
      }
      let resData = await SqlService.update(Sqlbricks.update('pipelines', CreateDate({
        name: SafeValue(props.name, pipelineData.name),
        connection_type: SafeValue(props.connection_type, pipelineData.connection_type),
        description: SafeValue(props.description, pipelineData.description),
        project_id: SafeValue(props.project_id, pipelineData.project_id),
        oauth_user_id: SafeValue(props.oauth_user_id, pipelineData.oauth_user_id),
        repo_data: JSON.stringify(SafeValue(props.repo_data, pipelineData.repo_data)),
        // repo_name: SafeValue(props.repo_name, pipelineData.repo_name),
        // repo_id: SafeValue(props.repo_id, pipelineData.repo_id),
        // from_provider: SafeValue(props.from_provider, pipelineData.from_provider),
        // source_type: SafeValue(props.source_type, pipelineData.source_type),
        created_at: SafeValue(pipelineData.created_at, null)
      })).where("id", props.id).toString());
      resData = await SqlService.selectOne(Sqlbricks.select("*").from("pipelines").where("id", props.id).toString());
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getPipeline(props: PipelineServiceInterface): Promise<any> {
    try {
      let resData = await SqlService.selectOne(Sqlbricks.select("*").from("pipelines").where("id", props.id).toString());
      if (resData == null) return null;
      resData = returnFactoryColumn(resData);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getPipelines(props: PipelineServiceInterface): Promise<any> {
    try {
      let query = preSelectQuery();
      query = query.leftJoin("pro").on("pro.id", "pip.project_id");
      if (props.project_id != null) {
        query = query.where("pro.id", props.project_id);
      }

      // Required null for project table deleted_at
      query = query.where(Sqlbricks.isNull("pro.deleted_at"));
      query = query.where(Sqlbricks.isNull("pip.deleted_at"));

      query = query.orderBy("pip.id DESC");
      let resData: Array<any> = await SqlService.select(query.toString());
      for (var a = 0; a < resData.length; a++) {
        resData[a] = await returnFactoryColumn(resData[a]);
      }
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async deletePipelines(props: PipelineServiceInterface) {
    try {
      let _in: Array<any> | string = [
        ...props.ids
      ];
      _in = _in.join(',');

      let query = Sqlbricks.delete('pipelines').where(Sqlbricks.in("id", _in)).toString();

      if (BoolearParse(SafeValue(props.force_deleted, "false")) == true) {
        let resDeleteQueueRecordDetail = await QueueRecordDetailService.deleteFrom({
          pipeline_ids: props.ids
        })
        let resDeleteQueueSchedule = await QueueSceduleService.deleteFrom({
          pipeline_ids: props.ids
        })
        let resDeleteQueueRecord = await QueueRecordService.deleteFrom({
          pipeline_ids: props.ids
        })
        let resDeleteExecution = await ExecutionService.deleteFrom({
          pipeline_ids: props.ids
        })
        let resDeletePipelineTask = await PipelineTaskService.deleteFrom({
          pipeline_ids: props.ids
        });
        let resDeleteVariable = await VariableService.deleteFrom({
          pipeline_ids: props.ids
        });
        let resDeletePipelineItem = await PipelineItemService.deleteFrom({
          pipeline_ids: props.ids
        });
      }

      let deleteUser = await SqlService.smartDelete(query.toString(), props.force_deleted || false);

      return null;//deleteUser;
    } catch (ex) {
      throw ex;
    }
  },
  async deleteFrom(props?: PipelineServiceInterface) {
    try {
      Sqlbricks.aliasExpansions({
        "pip": "pipelines",
        'pro': "projects"
      });

      let selectQuery = Sqlbricks.select(
        "pip.id"
      ).from("pip");

      selectQuery = selectQuery.leftJoin("pro").on({
        "pro.id": "pip.project_id"
      });

      if (props.project_ids != null) {
        selectQuery = selectQuery.where(Sqlbricks.in("pro.id", props.project_ids));
      }

      let resDeleteQuery = await SqlService.delete(`
        DELETE FROM pipelines WHERE id IN (
          ${selectQuery.toString()}
        )
      `);
      return resDeleteQuery;
    } catch (ex) {
      throw ex;
    }
  }
}