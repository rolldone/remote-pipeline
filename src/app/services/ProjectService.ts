
import Sqlbricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
import ExecutionService from "./ExecutionService";
import PipelineItemService from "./PipelineItemService";
import PipelineService from "./PipelineService";
import PipelineTaskService from "./PipelineTaskService";
import QueueRecordDetailService from "./QueueRecordDetailService";
import QueueRecordService from "./QueueRecordService";
import QueueSceduleService from "./QueueSceduleService";
import SqlService from "./SqlService";
import VariableService from "./VariableService";
declare let db: Knex;

export interface ProjectInterface {
  id?: number
  user_id?: number
  name?: string
  description?: string
}

export interface ProjectServiceInterface extends ProjectInterface {
  ids?: Array<number>
  force_deleted?: boolean
  with_deleted?: boolean
}

export default {
  async addProject(props: ProjectInterface) {
    try {
      let resInsert = await db.raw(Sqlbricks.insert('projects', {
        name: props.name,
        description: props.description,
        user_id: props.user_id
      }).toString());
      let id = resInsert.lastInsertRowid;
      let resData = await this.getProject({
        id
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async updateProject(props: ProjectInterface) {
    try {
      let res = await db.raw(Sqlbricks.update('projects', {
        name: props.name,
        description: props.description
      }).where("id", props.id).where("user_id", props.user_id).toString());
      let resData = await this.getProject({
        id: props.id
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getProject(props: ProjectServiceInterface) {
    try {
      Sqlbricks.aliasExpansions({});
      let query = Sqlbricks.select("*").from("projects");
      if (props.id) {
        query.where("id", props.id);
      }
      query.limit(1);
      query.offset(0);
      let _projects = await SqlService.selectOne(query.toString());
      return _projects;
    } catch (ex) {
      throw ex;
    }
  },
  async getProjects(props: ProjectServiceInterface) {
    try {
      Sqlbricks.aliasExpansions({
        "pip_task": "pipeline_tasks",
        "pip_item": "pipeline_items",
        "pip": "pipelines",
        "pro": "projects"
      });
      let query = Sqlbricks.select("*").from("pro");
      query = query.where({
        user_id: props.user_id
      })
      if (props.with_deleted == null) {
        query.where(Sqlbricks.isNull("pro.deleted_at"));
      }
      query = query.orderBy("id DESC");
      let resData = await db.raw(query.toString());
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async deleteProject(props: ProjectServiceInterface) {
    try {
      let _in: Array<any> | string = [
        ...props.ids
      ];
      _in = _in.join(',');

      let query = Sqlbricks.delete('projects').where(Sqlbricks.in("id", _in)).where("user_id", props.user_id);

      if (props.force_deleted == true) {
        let resDeleteQueueRecordDetail = await QueueRecordDetailService.deleteFrom({
          project_ids: props.ids
        })
        let resDeleteQueueSchedule = await QueueSceduleService.deleteFrom({
          project_ids: props.ids
        })
        let resDeleteQueueRecord = await QueueRecordService.deleteFrom({
          project_ids: props.ids
        })
        let resDeleteExecution = await ExecutionService.deleteFrom({
          project_ids: props.ids
        })
        let resDeletePipelineTask = await PipelineTaskService.deleteFrom({
          project_ids: props.ids
        });
        let resDeleteVariable = await VariableService.deleteFrom({
          project_ids: props.ids
        });
        let resDeletePipelineItem = await PipelineItemService.deleteFrom({
          project_ids: props.ids
        });
        let pipeLineExecution = await PipelineService.deleteFrom({
          project_ids: props.ids
        })
      }

      let resData = await SqlService.smartDelete(query.toString(), props.force_deleted || false);
      return {
        status: 'success',
        status_code: 200,
        return: []
      }
    } catch (ex) {
      throw ex;
    }
  }
}