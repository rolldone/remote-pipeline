import Sqlbricks from "@root/tool/SqlBricks"
import { Knex } from "knex";
import SqlService from "./SqlService";

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
  from?: string
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
        from: props.from,
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
        from: props.from,
        source_type: props.source_type,
      }).where("id", props.id).toString());
      resData = await SqlService.selectOne(Sqlbricks.select("*").from("pipelines").where("id", props.id).toString());
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getPipeline(props): Promise<any> {
    try {
      let resData = await SqlService.selectOne(Sqlbricks.select("*").from("pipelines").where("id", props.id).toString());
      if (resData == null) return null;
      resData.repo_data = JSON.parse(resData.repo_data);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getPipelines(props): Promise<any> {
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
        "pip.name as name",
        "pip.repo_data as repo_data",
        "pro.id as pro_id",
        "pro.name as pro_name"
      ).from("pip");
      query = query.leftJoin("pro").on("pro.id", "pip.project_id");
      if (props.project_id != null) {
        query = query.where("pro.id", props.project_id);
      }
      query = query.orderBy("pip.id DESC");
      let resData: Array<any> = await db.raw(query.toString());
      resData.forEach((el) => {
        el.repo_data = JSON.parse(el.repo_data || '{}');
        return el;
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async deletePipelines(ids: Array<number>) {
    try {
      let _in: Array<any> | string = [
        ...ids
      ];
      _in = _in.join(',');
      let query = Sqlbricks.delete('users').where(Sqlbricks.in("id", _in)).toString();
      let deleteUser = await SqlService.delete(query.toString());
      return deleteUser;
    } catch (ex) {
      throw ex;
    }
  }
}