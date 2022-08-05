import SqlBricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
import CreateDate from "../functions/base/CreateDate";
import SafeValue from "../functions/base/SafeValue";
import SqlService from "./SqlService";

export interface WebhookHistories {
  id?: number
  webhook_id?: number
  webhook_type?: string
  webhook_item_key?: string
  status?: number
  data?: any
  job_id?: string
  error_message?: string
  deleted_at?: string
  created_at?: string
  updated_at?: string
}

export interface WebhookHistoryServiceInterface extends WebhookHistories {
  ids?: Array<number>
  webhook_user_id?: number

  order_by?: string
  group_by?: string
  limit?: number
  offset?: number
  user_id?: number,
  where?: any
}

const defineQuery = () => {
  SqlBricks.aliasExpansions({
    "whook": "webhooks",
    "whs": "webhook_histories"
  });

  let query = SqlBricks.select(
    "whs.id as id",
    "whs.webhook_id as webhook_id",
    "whs.webhook_type as webhook_type",
    "whs.webhook_item_key as webhook_item_key",
    "whs.status as status",
    "whs.data as data",
    "whs.job_id as job_id",
    "whs.error_message as error_message",
    "whs.deleted_at as deleted_at",
    "whs.created_at as created_at",
    "whs.updated_at as updated_at",
    "whook.id as whook_id",
    "whook.name as whook_name",
    "whook.user_id as whook_user_id",
    "whook.status as whook_status",
    "whook.key as whook_key",
    "whook.description as whook_description",
    "whook.webhook_datas as whook_webhook_datas",
    "whook.data as whook_data",
    "whook.created_at as whook_created_at",
    "whook.updated_at as whook_updated_at",
    "whook.deleted_at as whook_deleted_at",
  ).from("whs");

  return query;
}

const transformColumn = (el) => {
  el.data = JSON.parse(el.data || '{}');
  return el;
}

export default {
  STATUS: {
    'PROCESS': 1,
    'SUCCESS': 2,
    'FAILED': 3
  },
  async addHistory(props: WebhookHistories) {
    try {
      let query = SqlBricks.insert("webhook_histories", CreateDate({
        webhook_id: props.webhook_id,
        webhook_item_key: props.webhook_item_key,
        webhook_type: props.webhook_type,
        data: JSON.stringify(props.data || {}),
        status: props.status,
        job_id: props.job_id,
        error_message: SafeValue(props.error_message, "")
      }));
      let resDataId = await SqlService.insert(query.toString());
      let resData = await this.getWebhookHistory({
        id: resDataId
      })
    } catch (ex) {
      throw ex;
    }
  },
  async updateHistory(props: WebhookHistories) {
    try {
      let webhookHistory: WebhookHistories = await this.getWebhookHistory({
        id: props.id
      })
      if (webhookHistory == null) {
        throw new Error("Webhook not found!");
      }
      let query = SqlBricks.update("webhook_histories", CreateDate({
        webhook_id: SafeValue(props.webhook_id, webhookHistory.webhook_id),
        webhook_item_key: SafeValue(props.webhook_item_key, webhookHistory.webhook_item_key),
        webhook_type: SafeValue(props.webhook_type, webhookHistory.webhook_type),
        data: JSON.stringify(SafeValue(props.data, webhookHistory.data) || {}),
        status: SafeValue(props.status, webhookHistory.status),
        job_id: SafeValue(props.job_id, webhookHistory.job_id),
        error_message: SafeValue(props.error_message, webhookHistory.error_message)
      }));
      query = query.where({
        "id": props.id,
      });
      await SqlService.update(query.toString());
      let resData = await this.getWebhookHistory({
        id: props.id
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async updateHistoryByJobId(jobId: string, props: WebhookHistories) {
    try {
      let webhookHistory: WebhookHistories = await this.getWebhookHistoryByJobId(jobId)
      if (webhookHistory == null) {
        throw new Error("Webhook not found!");
      }
      let resUpdate = await this.updateHistory({
        ...props,
        id: webhookHistory.id
      });
      return resUpdate;
    } catch (ex) {
      throw ex;
    }
  },
  async getWebhookHistory(props: WebhookHistoryServiceInterface) {
    try {
      let query = defineQuery();
      query = query.where({
        "whs.id": props.id,
      });
      if (props.webhook_user_id != null) {
        query = query.where("whook.user_id", props.webhook_user_id)
      }
      query
        .leftJoin("whook").on({
          "whook.id": "whs.webhook_id"
        });
      let resData = await SqlService.selectOne(query.toString());
      resData = transformColumn(resData);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getWebhookHistoryByJobId(job_id: string) {
    try {
      let query = defineQuery();
      query = query.where({
        "whs.job_id": job_id,
      });
      query
        .leftJoin("whook").on({
          "whook.id": "whs.webhook_id"
        });
      let resData = await SqlService.selectOne(query.toString());
      if(resData == null) return;
      resData = transformColumn(resData);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getWebhookHistories(props: WebhookHistoryServiceInterface) {
    try {
      let query = defineQuery();
      query = query.where({
        "whs.webhook_id": props.webhook_id,
        "whook.user_id": props.webhook_user_id
      });
      query
        .leftJoin("whook").on({
          "whook.id": "whs.webhook_id"
        });
      query.limit(props.limit || 50);
      query.offset((props.offset || 0) * (props.limit || 50));
      query.orderBy("whs.id DESC");
      let resDatas = await SqlService.select(query.toString());
      for (var a = 0; a < resDatas.length; a++) {
        resDatas[a] = transformColumn(resDatas[a]);
      }
      return resDatas;
    } catch (ex) {
      throw ex;
    }
  }
}