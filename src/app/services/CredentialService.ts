import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import SqlBricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
import BoolearParse from "../functions/base/BoolearParse";
import CreateDate from "../functions/base/CreateDate";
import SafeValue from "../functions/base/SafeValue";
import CreateQueue from "../functions/CreateQueue";
import HostService, { Host } from "./HostService";
import PipelineItemService, { PipelineItemInterface } from "./PipelineItemService";
import QueueRecordDetailService from "./QueueRecordDetailService";
import QueueRecordService from "./QueueRecordService";
import QueueSceduleService from "./QueueSceduleService";
import SqlService from "./SqlService";

declare let db: Knex;
declare let masterData: MasterDataInterface;

const PROCESS_MODE = {
  SEQUENTIAL: 'sequential',
  PARALLEL: 'parallel'
}

export interface CredentialInterface {
  id?: number
  name?: string
  type?: string
  data?: any
  user_id?: number
  description?: string
}

export interface CredentialServiceInterface extends CredentialInterface {
  ids?: Array<number>
  types?: Array<string>
  force_deleted?: boolean
}

const defineQuery = () => {
  SqlBricks.aliasExpansions({
    "cre": "credentials",
    "usr": "users"
  });

  let query = SqlBricks.select(
    "cre.id as id",
    "cre.name as name",
    "cre.user_id as user_id",
    "cre.data as data",
    "cre.description as description",
    "cre.type as type",
    "usr.email as usr_email"
  ).from("cre");

  return query;
}

const returnFactoryColumn = (props: CredentialServiceInterface) => {
  props.data = JSON.parse(props.data || '{}');
  return props;
}

export default {
  PROCESS_MODE,
  async addCredential(props: CredentialInterface) {
    try {
      let resDataId = await SqlService.insert(SqlBricks.insert('credentials', CreateDate({
        name: props.name,
        type: props.type,
        user_id: props.user_id,
        data: JSON.stringify(props.data),
        description: props.description
      })).toString());
      let resData = await this.getCredential({
        id: resDataId
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async updateCredential(props: CredentialInterface) {
    try {
      let exeData: CredentialInterface = await this.getCredential({
        id: props.id
      });
      if (exeData == null) {
        throw new Error("Credential data not found!");
      }
      let resData = await SqlService.update(SqlBricks.update('credentials', CreateDate({
        name: SafeValue(props.name, exeData.name),
        type: SafeValue(props.type, exeData.type),
        user_id: SafeValue(props.user_id, exeData.user_id),
        data: JSON.stringify(SafeValue(props.data, exeData.data)),
        description: SafeValue(props.description, exeData.description)
      })).where("id", props.id).toString());
      resData = await this.getCredential({
        id: props.id
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async deleteCredentials(props: CredentialServiceInterface) {
    try {
      let _in: Array<any> | string = [
        ...props.ids
      ];
      _in = _in.join(',');

      let _force_deleted = BoolearParse(SafeValue(props.force_deleted, "false"));

      if (_force_deleted == true) {
        // let resDeleteQueueRecordDetail = await QueueRecordDetailService.deleteFrom({
        //   execution_ids: props.ids
        // })
        // let resDeleteQueueSchedule = await QueueSceduleService.deleteFrom({
        //   execution_ids: props.ids
        // })
        // let resDeleteQueueRecord = await QueueRecordService.deleteFrom({
        //   execution_ids: props.ids
        // })
      }

      let resData = await SqlService.smartDelete(SqlBricks.delete('credentials').where(SqlBricks.in("id", _in)).toString(), _force_deleted);

      return null;//resData;
    } catch (ex) {
      throw ex;
    }
  },
  getCredential: async function (props: CredentialServiceInterface) {
    try {
      let query = defineQuery();
      query = query.leftJoin("usr").on({
        "usr.id": "cre.user_id"
      });
      if (props.user_id != null) {
        query = query.where("usr.id", props.user_id);
      }
      query = query.where("cre.id", props.id);

      // Need table project deleted_at null
      query = query.where(SqlBricks.isNull("cre.deleted_at"));

      query = query.orderBy("cre.id DESC");
      query = query.limit(1);
      let resData = await db.raw(query.toString());
      resData = resData[0];
      if (resData == null) return;
      resData = returnFactoryColumn(resData);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  getCredentials: async function (props: CredentialServiceInterface) {
    try {
      let query = defineQuery();
      query = query.leftJoin("usr").on({
        "usr.id": "cre.user_id"
      });

      if (props.user_id != null) {
        query = query.where("usr.id", props.user_id);
      }
      
      if (SafeValue(props.types, []).length > 0) {
        query = query.where(SqlBricks.in("cre.type", props.types))
      }

      // Need table project deleted_at null
      query = query.where(SqlBricks.isNull("cre.deleted_at"));

      query = query.orderBy("cre.id DESC");
      let resDatas: Array<any> = await db.raw(query.toString());
      for (let a = 0; a < resDatas.length; a++) {
        let resData: CredentialInterface = resDatas[a];
        resDatas[a] = returnFactoryColumn(resData);
      }
      return resDatas;
    } catch (ex) {
      throw ex;
    }
  },
  async deleteFrom(props?: CredentialServiceInterface) {
    try {
      SqlBricks.aliasExpansions({
        'cre': "credentials",
      });

      let selectQuery = SqlBricks.select(
        "cre.id"
      ).from("cre");

      let resDeleteQuery = await SqlService.delete(`
        DELETE FROM credentials WHERE id IN (
          ${selectQuery.toString()}
        )
      `);
      return resDeleteQuery;
    } catch (ex) {
      throw ex;
    }
  }
}