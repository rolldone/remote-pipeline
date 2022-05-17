import SqlBricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
import SqlService from "./SqlService";
declare let db: Knex;

export interface webhook {
  id?: number
  name?: string
  user_id?: number
  status?: number
  description?: string
  webhook_datas?: Array<any>
  data?: any,
  key?: string
}

export default {
  async addWebHook(props: webhook): Promise<any> {
    try {
      let query = SqlBricks.insert("webhooks", {
        id: props.id,
        name: props.name,
        key: props.key,
        webhook_datas: JSON.stringify(props.webhook_datas || []),
        data: JSON.stringify(props.data || {}),
        description: props.description,
        user_id: props.user_id,
        status: props.status,
      });
      let resDataId = await SqlService.insert(query.toString());
      let resData = await this.getWebHook({
        id: resDataId
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async updateWebHook(props: webhook): Promise<any> {
    try {
      let query = SqlBricks.update("webhooks", {
        id: props.id,
        name: props.name,
        key: props.key,
        webhook_datas: JSON.stringify(props.webhook_datas || []),
        data: JSON.stringify(props.data || {}),
        description: props.description,
        user_id: props.user_id,
        status: props.status,
      });
      query = query.where({
        "id": props.id,
        "user_id": props.user_id
      });
      await SqlService.update(query.toString());
      let resData = await this.getWebHook({
        id: props.id,
        user_id: props.user_id
      });
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  getWebHook: async function (props: any) {
    try {
      SqlBricks.aliasExpansions({
        "whook": "webhooks"
      });

      let query = SqlBricks.select(
        "whook.id as id",
        "whook.name as name",
        "whook.user_id as user_id",
        "whook.status as status",
        "whook.key as key",
        "whook.description as description",
        "whook.webhook_datas as webhook_datas",
        "whook.data as data",
      );

      query = query.from("whook");

      query = query.where({
        "whook.id": props.id
      });

      if (props.user_id) {
        query = query.where("whook.user_id", props.user_id);
      }

      // Where segment
      if (props.pipeline_id != null) {
        query = query.where("pip.id", props.pipeline_id);
      }
      let resData = await SqlService.selectOne(query.toString());
      if (resData == null) return null;
      resData.data = JSON.parse(resData.data || '{}');
      resData.webhook_datas = JSON.parse(resData.webhook_datas || '[]');
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  getWebHooks: async function (props: any) {
    try {
      SqlBricks.aliasExpansions({
        "whook": "webhooks",
      });

      let query = SqlBricks.select(
        "whook.id as id",
        "whook.name as name",
        "whook.user_id as user_id",
        "whook.status as status",
        "whook.key as key",
        "whook.description as description",
        "whook.webhook_datas as webhook_datas",
        "whook.data as data",
      );

      query = query.from("whook");
      query.where("whook.user_id", props.user_id);

      let resDatas = await SqlService.select(query.toString());
      resDatas.filter((resData) => {
        resData.data = JSON.parse(resData.data || '{}');
        resData.webhook_datas = JSON.parse(resData.webhook_datas || '[]');
        return resData;
      })
      return resDatas
    } catch (ex) {
      throw ex;
    }
  },
  async deleteWebHook(ids: Array<number>): Promise<any> {
    try {
      let _in: Array<any> | string = [
        ...ids
      ];
      _in = _in.join(',');
      let resData = await SqlService.delete(SqlBricks.delete('webhooks').where(SqlBricks.in("id", _in)).toString());
      return {
        status: 'success',
        status_code: 200,
        return: resData
      }
    } catch (ex) {
      throw ex;
    }
  },
  async execute(props) {
    try {

    } catch (ex) {
      throw ex;
    }
  }
}