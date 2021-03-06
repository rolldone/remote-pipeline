import sqlbricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
import CreateDate from "../functions/base/CreateDate";
import SafeValue from "../functions/base/SafeValue";
import SqlService from "./SqlService";
declare let db: Knex;

export interface Host {
  id?: number,
  name?: string,
  description?: string,
  data?: Array<any> | any
  auth_type?: string
  password?: string
  username?: string
  private_key?: string
  user_id?: number
  created_at?: string
  updated_at?: string
  credential_id?: number
}

export interface HostServiceInterface extends Host {
  ids?: Array<number>
  force_deleted?: boolean
}

const defineQuery = () => {
  sqlbricks.aliasExpansions({
    'usr': "users",
    'hos': "hosts"
  });
  let query = sqlbricks.select(
    'usr.id as usr_id',
    'usr.first_name as usr_first_name',
    'usr.last_name as usr_last_name',
    'hos.id as id',
    'hos.name as name',
    'hos.data as data',
    'hos.description as description',
    'hos.username as username',
    'hos.password as password',
    'hos.auth_type as auth_type',
    'hos.private_key as private_key',
    'hos.created_at as created_at',
    'hos.updated_at as updated_at',
    'hos.credential_id as credential_id'
  ).from("hos");
  return query;
}

const transformField = (props: Host) => {
  props.data = JSON.parse(props.data);
  return props;
}

export default {
  async getAllHosts_GroupAddressPort() {
    try {
      let query = defineQuery();
      query = query.leftJoin('usr').on({
        "usr.id": "hos.user_id"
      });
      query = query.where(sqlbricks.isNull("hos.deleted_at"));
      let resData = await SqlService.select(query.toString());
      for (var a = 0; a < resData.length; a++) {
        resData[a] = transformField(resData[a]);
      }
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getHosts(props: HostServiceInterface) {
    try {
      let query = defineQuery();
      query = query.leftJoin('usr').on({
        "usr.id": "hos.user_id"
      });
      if (props.user_id != null) {
        query = query.where("usr.id", props.user_id);
      }
      if (props.ids != null) {
        query.where(sqlbricks.in("hos.id", props.ids))
      }

      query = query.where(sqlbricks.isNull("hos.deleted_at"));

      query = query.orderBy("usr.id DESC");
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
  async getHost(props) {
    try {
      let query = defineQuery();
      query = query.leftJoin('usr').on({
        "usr.id": "hos.user_id"
      });
      if (props.user_id != null) {
        query = query.where("usr.id", props.user_id);
      }
      query = query.where("hos.id", props.id);

      query = query.where(sqlbricks.isNull("hos.deleted_at"));

      query = query.orderBy("usr.id DESC");
      query = query.limit(1);
      let resData = await SqlService.selectOne(query.toString());
      if (resData == null) return null;
      resData.data = JSON.parse(resData.data);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async addHost(props: Host): Promise<any> {
    try {
      let resDataId = await SqlService.insert(sqlbricks.insert('hosts', CreateDate({
        name: props.name,
        description: props.description,
        data: JSON.stringify(props.data),
        auth_type: props.auth_type,
        private_key: props.private_key,
        username: props.username,
        password: props.password,
        user_id: props.user_id,
        credential_id: props.credential_id
      })).toString());
      let resData = await this.getHost({
        id: resDataId
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async updateHost(props: Host): Promise<any> {
    try {
      let hostData: Host = await this.getHost({
        id: props.id
      });
      if (hostData == null) {
        throw new Error("Host Data not found!");
      }
      let resData = await SqlService.update(sqlbricks.update('hosts', CreateDate({
        name: SafeValue(props.name, hostData.name),
        description: SafeValue(props.description, hostData.description),
        data: JSON.stringify(SafeValue(props.data, hostData.data)),
        auth_type: SafeValue(props.auth_type, hostData.auth_type),
        private_key: SafeValue(props.private_key, null),
        username: SafeValue(props.username, null),
        password: SafeValue(props.password, null),
        user_id: SafeValue(props.user_id, null),
        credential_id: SafeValue(props.credential_id, null),
        created_at: SafeValue(hostData.created_at, null)
      })).where("id", props.id).toString());
      resData = await this.getHost({
        id: props.id
      });
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async deleteHost(props: HostServiceInterface): Promise<any> {
    try {
      let _in: Array<any> | string = [
        ...props.ids
      ];
      _in = _in.join(',');
      let resData = await SqlService.smartDelete(sqlbricks.delete('hosts').where(sqlbricks.in("id", _in)).toString(), props.force_deleted || false);
      return resData;
    } catch (ex) {
      throw ex;
    }
  }
}