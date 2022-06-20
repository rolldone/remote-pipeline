import sqlbricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
import CreateDate from "../functions/base/CreateDate";
import SafeValue from "../functions/base/SafeValue";
import { OauthInterface } from "./OAuthService";
import SqlService from "./SqlService";
declare let db: Knex;

export interface OAuthUserServiceInterface extends OauthInterface {
  ids?: Array<number>
  force_deleted?: boolean
}

const preSelectQuery = () => {
  sqlbricks.aliasExpansions({
    'ouser': "oauth_users",
    'usr': "users"
  });
  let query = sqlbricks.select(
    'ouser.id as id',
    'ouser.name as name',
    'ouser.user_id as user_id',
    'ouser.oauth_id as oauth_id',
    'ouser.access_token as access_token',
    'ouser.repo_from as repo_from',
    'ouser.token_type as token_type',
    'ouser.scope as scope',
    'ouser.data as data',
    'ouser.refresh_token as refresh_token',
    'usr.id as usr_id',
    'usr.first_name as usr_first_name',
    'usr.last_name as usr_last_name'
  ).from("ouser");
  return query;
}

/**
 * This is special for personal access token, manual input
*/
export default {
  async getOAuthUsers(props: OAuthUserServiceInterface) {
    try {
      let query = preSelectQuery();
      query = query.leftJoin('usr').on({
        "usr.id": "ouser.user_id"
      });

      if (props.user_id != null) {
        query = query.where("usr.id", props.user_id);
      }

      if (props.ids != null) {
        query.where(sqlbricks.in("ouser.id", props.ids))
      }

      if (props.repo_from != null) {
        query.where("ouser.repo_from", props.repo_from);
      }

      query = query.orderBy("ouser.id DESC");
      let resData = await SqlService.select(query.toString());
      resData.filter((el) => {
        el.data = JSON.parse(el.data);
        return el;
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getOAuthUser(props: OAuthUserServiceInterface) {
    try {
      let query = preSelectQuery();
      query = query.leftJoin('usr').on({
        "usr.id": "ouser.user_id"
      });

      if (props.user_id != null) {
        query = query.where("usr.id", props.user_id);
      }

      if (props.id != null) {
        query = query.where("ouser.id", props.id);
      }

      query = query.orderBy("ouser.id DESC");
      query = query.limit(1);

      let resData = await SqlService.selectOne(query.toString());
      if (resData == null) return null;
      resData.data = JSON.parse(resData.data);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async addOAuthUser(props: OauthInterface): Promise<any> {
    try {
      let resDataId = await SqlService.insert(sqlbricks.insert('oauth_users', CreateDate({
        user_id: props.user_id,
        name: props.name,
        oauth_id: props.oauth_id,
        access_token: props.access_token,
        repo_from: props.repo_from,
        token_type: props.token_type,
        scope: props.scope,
        data: JSON.stringify(props.data),
        refresh_token: props.refresh_token,
      })).toString());
      let resData = await this.getOAuthUser({
        id: resDataId
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async updateOAuthUser(props: OauthInterface): Promise<any> {
    try {
      let oauthUserData: OauthInterface = await this.getOAuthUser({
        id: props.id,
        user_id: props.user_id
      });
      if (oauthUserData == null) {
        throw new Error("Data is not found!");
      }
      let resData = await SqlService.update(sqlbricks.update('oauth_users', CreateDate({
        user_id: SafeValue(props.user_id, oauthUserData.user_id),
        name: SafeValue(props.name, oauthUserData.name),
        oauth_id: SafeValue(props.oauth_id, oauthUserData.oauth_id),
        access_token: SafeValue(props.access_token, oauthUserData.access_token),
        repo_from: SafeValue(props.repo_from, oauthUserData.repo_from),
        token_type: SafeValue(props.token_type, oauthUserData.token_type),
        scope: SafeValue(props.scope, oauthUserData.scope),
        data: SafeValue(JSON.stringify(props.data || {}), oauthUserData.data),
        refresh_token: SafeValue(props.refresh_token, oauthUserData.refresh_token),
      })).where("id", props.id).toString());
      resData = await this.getOAuthUser({
        id: props.id
      });
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async deleteOAuthUser(props: OAuthUserServiceInterface): Promise<any> {
    try {
      let _in: Array<any> | string = [
        ...props.ids
      ];
      _in = _in.join(',');
      let resData = await SqlService.smartDelete(sqlbricks.delete('oauth_users').where(sqlbricks.in("id", _in)).toString(), true);
      return resData;
    } catch (ex) {
      throw ex;
    }
  }
}