import sqlbricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
import SqlService from "./SqlService";
declare let db: Knex;

export interface Host {
  id?: number,
  name?: string,
  description?: string,
  data?: Array<any>
  auth_type?: string
  password?: string
  username?: string
  private_key?: string
  user_id?: number
}

export interface HostServiceInterface extends Host {
  ids?: Array<number>
}

export default {
  async getHosts(props: HostServiceInterface) {
    try {
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
        'hos.private_key as private_key'
      ).from("hos");
      query = query.leftJoin('usr').on({
        "usr.id": "hos.user_id"
      });
      if (props.user_id != null) {
        query = query.where("usr.id", props.user_id);
      }
      if (props.ids != null) {
        query.where(sqlbricks.in("hos.id", props.ids))
      }
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
        'hos.private_key as private_key'
      ).from("hos");
      query = query.leftJoin('usr').on({
        "usr.id": "hos.user_id"
      });
      if (props.user_id != null) {
        query = query.where("usr.id", props.user_id);
      }
      query = query.where("hos.id", props.id);
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
      let resData = await SqlService.insert(sqlbricks.insert('hosts', {
        name: props.name,
        description: props.description,
        data: JSON.stringify(props.data),
        auth_type: props.auth_type,
        private_key: props.private_key,
        username: props.username,
        password: props.password,
        user_id: props.user_id
      }).toString());
      resData = await this.getHost({
        id: resData.id
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async updateHost(props: Host): Promise<any> {
    try {
      let resData = await SqlService.update(sqlbricks.update('hosts', {
        name: props.name,
        description: props.description,
        data: JSON.stringify(props.data),
        auth_type: props.auth_type,
        private_key: props.private_key,
        username: props.username,
        password: props.password,
        user_id: props.user_id
      }).where("id", props.id).toString());
      resData = await this.getHost({
        id: props.id
      });
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async deleteHost(ids: Array<number>): Promise<any> {
    try {
      let _in: Array<any> | string = [
        ...ids
      ];
      _in = _in.join(',');
      let resData = await SqlService.delete(sqlbricks.delete('hosts').where(sqlbricks.in("id", _in)).toString());
      return resData;
    } catch (ex) {
      throw ex;
    }
  }
}