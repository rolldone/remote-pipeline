
import Sqlbricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
declare let db: Knex;

export interface ProjectServiceInteface {
  id?: number
  user_id?: number
  name?: string
  description?: string
  ids?: Array<number>
}

export default {
  async addProject(props: ProjectServiceInteface) {
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
  async updateProject(props: ProjectServiceInteface) {
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
  async getProject(props: ProjectServiceInteface) {
    try {
      Sqlbricks.aliasExpansions({});
      let query = Sqlbricks.select("*").from("projects");
      if (props.id) {
        query.where("id", props.id);
      }
      query.limit(1);
      query.offset(0);
      let _query = query.toString();
      let _projects: Array<any> = await db.raw(_query.toString());
      _projects.forEach(el => {
        return el;
      });
      _projects = _projects[0];
      return _projects;
    } catch (ex) {
      throw ex;
    }
  },
  async getProjects(props: ProjectServiceInteface) {
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
      query = query.orderBy("id DESC");
      let resData = await db.raw(query.toString());
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async deleteProject(props: ProjectServiceInteface) {
    try {
      let _in: Array<any> | string = [
        ...props.ids
      ];
      _in = _in.join(',');
      let query = Sqlbricks.delete('projects').where(Sqlbricks.in("id", _in)).where("user_id", props.user_id).toString();
      let deleteData = await db.raw(query.toString());
      return {
        status: 'success',
        status_code: 200,
        return: deleteData
      }
    } catch (ex) {
      throw ex;
    }
  }
}