import SqlBricks from "@root/tool/SqlBricks/sql-bricks"
import { Knex } from "knex";
import bcrypt from 'bcrypt';
import SqlService from "./SqlService";

declare let db: Knex;
const saltRounds = 10;

export interface PersonalAccessTokenInterface {
  id?: number
  name?: string
  api_key?: string
  secret_key?: string
  encrypt_key?: string
  user_id?: number
  expired_date?: string
  status?: number
  description?: string
}

export interface PersonalAccessTokenServiceInterface extends PersonalAccessTokenInterface {
  ids?: Array<number>
}

const defineQuery = () => {
  SqlBricks.aliasExpansions({
    "pstoken": "personal_access_tokens"
  });

  let query = SqlBricks.select(
    "pstoken.id as id",
    "pstoken.name as name",
    "pstoken.user_id as user_id",
    "pstoken.status as status",
    "pstoken.api_key as api_key",
    "pstoken.encrypt_key as encrypt_key",
    "pstoken.description as description",
    "pstoken.expired_date as expired_date"
  );

  return query;
}

export default {
  async addPersonalAccessToken(props: PersonalAccessTokenInterface) {
    try {
      let _hash = await bcrypt.hash(props.secret_key, saltRounds);
      let query = SqlBricks.insert("personal_access_tokens", {
        id: props.id,
        name: props.name,
        encrypt_key: _hash,
        api_key: props.api_key,
        description: props.description,
        user_id: props.user_id,
        status: props.status,
        expired_date: props.expired_date
      });
      let resDataId = await SqlService.insert(query.toString());
      let resData = await this.getPersonalAccessToken({
        id: resDataId,
        user_id: props.user_id
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async updatePersonalAccessToken(props: PersonalAccessTokenInterface) {
    try {
      let existTOkenData: PersonalAccessTokenInterface = await this.getPersonalAccessToken({
        id: props.id,
        user_id: props.user_id
      }) as any;

      if (existTOkenData == null) {
        throw new Error("Data is not found!");
      }


      let updateData: PersonalAccessTokenInterface = {
        name: props.name || existTOkenData.name,
        description: props.description || existTOkenData.description,
        status: props.status || existTOkenData.status,
        expired_date: props.expired_date || existTOkenData.expired_date,
        api_key: props.api_key || existTOkenData.api_key
      };

      let _hash = null;
      if (props.secret_key != null) {
        _hash = await bcrypt.hash(props.secret_key, saltRounds);
        updateData.encrypt_key = _hash;
      }

      let queryUpdate = SqlBricks.update("personal_access_tokens", updateData);

      let resUpdate = await SqlService.update(queryUpdate.toString());

      let tokenData = await this.getPersonalAccessToken({
        id: props.id
      })

      return tokenData;
    } catch (ex) {
      throw ex;
    }
  },
  async deletePersonalAccessToken(ids: Array<number>) {
    try {
      let _in: Array<any> | string = [
        ...ids
      ];
      _in = _in.join(',');
      let query = SqlBricks.delete('personal_access_tokens').where(SqlBricks.in("id", _in)).toString();
      let deleteUser = await SqlService.delete(query.toString());
      return deleteUser;
    } catch (ex) {
      throw ex;
    }
  },
  async getPersonalAccessTokens(props: PersonalAccessTokenServiceInterface) {
    let query = defineQuery();
    query = query.from("pstoken");
    query = query.where({
      "pstoken.user_id": props.user_id
    });
    let resData = await SqlService.select(query.toString());
    return resData;
  },
  async getPersonalAccessToken(props: PersonalAccessTokenServiceInterface) {
    try {
      let query = defineQuery();
      query = query.from("pstoken");
      query = query.where({
        "pstoken.id": props.id
      });
      let resData = await SqlService.selectOne(query.toString());
      if (resData == null) return null;
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getPersonalAccessTokenByApiKey(api_key: string, secret_key: string) {
    try {
      let query = defineQuery();
      query = query.from("pstoken");
      query = query.where({
        "pstoken.api_key": api_key
      });
      let resData: PersonalAccessTokenInterface = await SqlService.selectOne(query.toString());
      if (resData == null) return null;
      console.log(secret_key,resData);
      let resPassword = await bcrypt.compare(secret_key, resData.encrypt_key);
      if (resPassword == false) {
        throw new Error("Wrong secret or api key!");
      }
      return resData;
    } catch (ex) {
      throw ex;
    }
  }
}