import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import SqlBricks from "@root/tool/SqlBricks";
import { Queue, Worker } from "bullmq";
import { Knex } from "knex";
import CreateDate from "../functions/base/CreateDate";
import SafeValue from "../functions/base/SafeValue";
import WebhookQueue from "../queues/WebhookQueue";
import SqlService from "./SqlService";
import WebhookHistoryService from "./WebhookHistoryService";
declare let db: Knex;

export interface webhook {
  id?: number
  webhook_id?: number // Alias of id webhook
  name?: string
  user_id?: number
  status?: number
  description?: string
  webhook_datas?: Array<any>
  data?: any,
  key?: string

  created_at?: string
  updated_at?: string
  deleted_at?: string
}

export interface SubmitExecuteInterfaceTest {
  data?: {
    subject?: string
    message?: string
  }
  type?: string
  webhook_id?: number
  key?: string
}

export interface SubmitExecuteInterface {
  data?: {
    subject?: string
    message?: string
  }
  key?: string
}

const defineQuery = () => {
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
    "whook.created_at as created_at",
    "whook.updated_at as updated_at",
    "whook.deleted_at as deleted_at",
  );

  return query;
}

declare let masterData: MasterDataInterface

export default {
  async addWebHook(props: webhook): Promise<any> {
    try {
      let query = SqlBricks.insert("webhooks", CreateDate({
        name: props.name,
        key: props.key,
        webhook_datas: JSON.stringify(props.webhook_datas || []),
        data: JSON.stringify(props.data || {}),
        description: props.description,
        user_id: props.user_id,
        status: props.status,
      }));
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
      let webhookData: webhook = await this.getWebHook({
        id: props.id
      })
      if (webhookData == null) {
        throw new Error("Webhook not found!");
      }
      let query = SqlBricks.update("webhooks", CreateDate({
        name: SafeValue(props.name, webhookData.name),
        key: SafeValue(props.key, webhookData.key),
        webhook_datas: JSON.stringify(SafeValue(props.webhook_datas, webhookData.webhook_datas)),
        data: JSON.stringify(SafeValue(props.data, webhookData.data)),
        description: SafeValue(props.description, webhookData.description),
        user_id: SafeValue(props.user_id, webhookData.user_id),
        status: SafeValue(props.status, webhookData.status),
        created_at: SafeValue(webhookData.created_at, null)
      }));
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
  getWebHookByKey: async function (key: string) {
    try {
      let query = defineQuery();
      query = query.from("whook");
      query = query.where({
        "whook.key": key
      });
      let resData = await SqlService.selectOne(query.toString());
      if (resData == null) return null;
      resData.data = JSON.parse(resData.data || '{}');
      resData.webhook_datas = JSON.parse(resData.webhook_datas || '[]');
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  getWebHook: async function (props: webhook) {
    try {
      let query = defineQuery();
      query = query.from("whook");
      query = query.where({
        "whook.id": props.id
      });
      if (props.user_id) {
        query = query.where("whook.user_id", props.user_id);
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
  getWebHooks: async function (props: webhook) {
    try {
      let query = defineQuery();
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
  execute(props: SubmitExecuteInterface) {
    return new Promise((resolve: Function, rejected: Function) => {
      try {
        let {
          data,
          key
        } = props;
        let queue_name = "webhook_queue_execute";
        masterData.saveData("queue.webhook.execute", {
          queue_name,
          callback: async (worker: Worker) => {
            if (worker.isRunning() == false) {
              worker.resume();
            }

            /**
             * Get the webhook data first
             */
            let webhook_data: webhook = await this.getWebHookByKey(key);

            /* Generate webhook queue */
            let _queue = WebhookQueue({
              queue_name
            });

            /* Loop the all webhook */
            for (var a = 0; a < webhook_data.webhook_datas.length; a++) {
              let hook_data = webhook_data.webhook_datas[a];
              console.log("hook_data ::: " + a, hook_data);
              let idJObInstant = (Math.random() + (1 + a)).toString(36).substring(7);
              let job_name = hook_data.key + "_" + hook_data.type;
              _queue.add(job_name, {
                data,
                type: hook_data.webhook_type,
                item_info: hook_data
              }, {
                jobId: idJObInstant,
                delay: 2000
              });
            }

            resolve(worker.name + " :: start running!");
            return;
          }
        });
      } catch (ex) {
        throw ex;
      }
    });
  },
  executeTestItem(props: SubmitExecuteInterfaceTest) {
    return new Promise((resolve: Function, rejected: Function) => {
      try {
        let {
          data,
          type,
          webhook_id,
          key
        } = props;
        let queue_name = "webhook_queue_execute_test";
        masterData.saveData("queue.webhook.execute.item.test", {
          queue_name,
          callback: async (worker: Worker) => {
            if (worker.isRunning() == false) {
              worker.resume();
            }
            /**
             * Get the webhook data first
             */
            let webhook_data = await this.getWebHook({
              id: webhook_id
            })

            /**
             * Loop the webhook datas to get the right use
             */
            let webHookItems = webhook_data.webhook_datas;
            console.log("wehookItems :: ", webHookItems, ' == ', props);
            let isFound = false;
            for (var a = 0; a < webHookItems.length; a++) {
              if (webHookItems[a].key == key) {
                let idJObInstant = (Math.random() + 1).toString(36).substring(7);
                let _queue = WebhookQueue({
                  queue_name,
                });
                let job_name = key + "_" + type;
                await _queue.add(job_name, {
                  data,
                  type,
                  item_info: webHookItems[a]
                }, {
                  jobId: idJObInstant,
                  delay: 2000
                });
                isFound = true;

                WebhookHistoryService.addHistory({
                  data: data,
                  status: WebhookHistoryService.STATUS.PROCESS,
                  webhook_id: webhook_id,
                  job_id: idJObInstant,
                  webhook_type: webHookItems[a].webhook_type,
                  webhook_item_key: webHookItems[a].key
                });

                break;
              }
            }
            if (isFound == false) {
              return resolve(worker.name + " :: Not found the item key and cant start the queue!");
            }
            return resolve(worker.name + " :: The queue is running.");
          }
        });
      } catch (ex) {
        rejected(ex);
      }
    });
  }
}