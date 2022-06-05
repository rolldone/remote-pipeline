import Sqlbricks from "@root/tool/SqlBricks"
import { Knex } from "knex";
import BoolearParse from "../functions/base/BoolearParse";
import SafeValue from "../functions/base/SafeValue";
import ExecutionService from "./ExecutionService";
import PipelineItemService from "./PipelineItemService";
import PipelineTaskService from "./PipelineTaskService";
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
  repo_data?: any
  repo_name?: string
  source_type?: string
  from_provider?: string
  force_deleted?: boolean
  ids?: Array<number>
  project_ids?: Array<number>
}

const returnFactoryColumn = (props: PipelineServiceInterface) => {
  props.repo_data = JSON.parse(props.repo_data || '{}');
  return props;
}

export default {
  async addPipeline(props: PipelineServiceInterface): Promise<any> {
    try {
      let resData = await db.raw(Sqlbricks.insert('pipelines', {
        name: props.name,
        description: props.description,
        project_id: props.project_id,
        oauth_user_id: props.oauth_user_id,
        repo_name: props.repo_name,
        from_provider: props.from_provider,
        source_type: props.source_type,
        repo_data: JSON.stringify(props.repo_data),
      }).toString());
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
      let resData = await SqlService.update(Sqlbricks.update('pipelines', {
        name: props.name,
        description: props.description,
        project_id: props.project_id,
        oauth_user_id: props.oauth_user_id,
        repo_data: JSON.stringify(props.repo_data),
        repo_name: props.repo_name,
        from_provider: props.from_provider,
        source_type: props.source_type,
      }).where("id", props.id).toString());
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
      Sqlbricks.aliasExpansions({
        'pro': "projects",
        "pip": "pipelines"
      });
      let query = Sqlbricks.select(
        "pip.id as id",
        "pip.project_id as project_id",
        "pip.oauth_user_id as oauth_user_id",
        "pip.source_type as source_type",
        "pip.repo_name as repo_name",
        "pip.from_provider as from_provider",
        "pip.name as name",
        "pip.repo_data as repo_data",
        "pro.id as pro_id",
        "pro.name as pro_name"
      ).from("pip");
      query = query.leftJoin("pro").on("pro.id", "pip.project_id");
      if (props.project_id != null) {
        query = query.where("pro.id", props.project_id);
      }

      // Required null for project table deleted_at
      query = query.where(Sqlbricks.isNull("pro.deleted_at"));
      query = query.where(Sqlbricks.isNull("pip.deleted_at"));

      query = query.orderBy("pip.id DESC");
      let resData: Array<any> = await SqlService.select(query.toString());
      resData.forEach((el) => {
        return returnFactoryColumn(el);
      })
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