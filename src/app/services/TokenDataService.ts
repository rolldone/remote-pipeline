import SqlBricks from "@root/tool/SqlBricks"
import CreateDate from "../functions/base/CreateDate"
import CreateUUID from "../functions/base/CreateUUID"
import SqlService from "./SqlService"

export const TOPIC = {
  QUEUE_ITEM_PROCESS: 'queue-item-process',
  QUEUE_DISPLAY_RESULT_SHARE: 'queue-display-result_share'
}

export interface TokenDataInterface {
  id?: number
  token?: string
  data?: {
    page_name?: string
    table_id?: number
    identity_value?: any
    user_id?: number
    [key: string]: any
  }
  topic?: string
  created_at?: string
  updated_at?: string
}

export interface TokenDataServiceInterface extends TokenDataInterface {

}

const preSelect = () => {
  SqlBricks.aliasExpansions({
    'td': "token_datas",
  });
  // Get again
  let query = SqlBricks.select(
    'td.id as id',
    'td.token as token',
    'td.data as data',
    'td.topic as topic',
    'td.created_at as created_at',
    'td.updated_at as updated_at'
  ).from("td");

  return query;
}

const returnFactoryColumn = (props: TokenDataInterface) => {
  if (props == null) return;
  let resData = props;
  resData.data = JSON.parse(resData.data as any || '{}');
  return resData;
}

const TokenDataService = {
  TOPIC,
  async getByToken(token: string) {
    try {
      let query = preSelect();
      query.where("td.token", token);
      let resData = await SqlService.selectOne(query.toString());
      resData = await returnFactoryColumn(resData);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async addOrUpdate(props: TokenDataInterface) {
    try {
      let tokenDat = await this.getByToken(props.token);
      if (tokenDat != null) {
        return this.updateByToken(props.token, props.data);
      }
      props.token = props.token || CreateUUID();
      let query = SqlBricks.insert("token_datas", CreateDate({
        token: props.token,
        data: JSON.stringify(props.data),
        topic: props.topic
      }))
      let resData = await SqlService.insert(query.toString());
      resData = await this.getByToken(props.token);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async updateByToken(token: string, data: any) {
    try {
      let query = SqlBricks.update("token_datas", CreateDate({
        data: JSON.stringify(data)
      }))
      query.where("token", token);
      let resData = await SqlService.insert(query.toString());
      resData = await this.getByToken(token);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async deleteByToken(token: string) {
    try {
      let query = SqlBricks.delete("token_datas");
      query.where("token", token);
      let resData = await SqlService.delete(query.toString());
      return true;
    } catch (ex) {
      throw ex;
    }
  }
}

export default TokenDataService;