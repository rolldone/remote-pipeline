import Sqlbricks from "@root/tool/SqlBricks"
import { Knex } from "knex";
import bcrypt from 'bcrypt';
import SqlService from "./SqlService";
import CreateDate from "../functions/base/CreateDate";
import SafeValue from "../functions/base/SafeValue";

declare let db: Knex;
const saltRounds = 10;

export interface UserServiceInterface {
  id?: number
  first_name?: string
  last_name?: string
  email?: string
  password?: string
  status?: number
  data?: any
  orderBy?: string
  groupBy?: string
  limit?: number
  offset?: number
  user_id?: number

  created_at?: string
  updated_at?: string
  deleted_at?: string
}

const preSelectQuery = () => {
  Sqlbricks.aliasExpansions({
    'usr': "users",
    'part': "user_partners",
    'usr_part': "users"
  });
  let query = Sqlbricks.select(
    "usr.id as id",
    "usr.first_name as first_name",
    "usr.last_name as last_name",
    "usr.email as email",
    "usr.password as password",
    "usr.status as status",
    "usr.data as data",
    "usr.created_at as created_at",
    "usr.updated_at as updated_at",
    "usr.deleted_at as deleted_at",
    "part.user_id as part_user_id",
    "part.partner_user_id as part_partner_user_id",
    "part.data as part_data",
    "usr_part.id as usr_part_id",
    "usr_part.first_name as usr_part_first_name",
    "usr_part.last_name as usr_part_last_name",
    "usr_part.email as usr_part_email",
    "usr_part.password as usr_part_password",
    "usr_part.status as usr_part_status",
    "usr_part.data as usr_part_data",
  ).from("usr");
  return query;
}

export default {
  async getUsers(props: UserServiceInterface) {
    try {
      let query = preSelectQuery();
      query.leftJoin("part").on({
        "part.user_id": "usr.id"
      });
      query.leftJoin("usr_part").on({
        "part.partner_user_id": "usr_part.id"
      });
      query.where("part.user_id", props.user_id);
      if (props.email) {
        query.where("usr.email", props.email);
      }
      if (props.status) {
        query.where("usr.status", props.status);
      }
      if (props.orderBy) {
        query.orderBy(props.orderBy);
      }
      query.limit(props.limit || 100);
      query.offset((props.offset * props.limit) || 0);
      let _query = query.toString();
      let _hosts_datas: Array<any> = await SqlService.select(_query.toString());
      _hosts_datas.forEach(el => {
        el.data = JSON.parse(el.data || '{}');
        el.part_data = JSON.parse(el.part_data || '{}');
        el.usr_part_data = JSON.parse(el.usr_part_data || '{}');
        delete el.password;
        return el;
      });
      return _hosts_datas;
    } catch (ex) {
      throw ex;
    }
  },
  async getUser(props: UserServiceInterface) {
    try {
      let query = preSelectQuery();
      query.leftJoin("part").on({
        "part.user_id": "usr.id"
      });
      query.leftJoin("usr_part").on({
        "part.partner_user_id": "usr_part.id"
      });
      if (props.id) {
        query.where("usr.id", props.id);
      }
      if (props.email) {
        query.where("usr.email", props.email);
      }
      if (props.status) {
        query.where("usr.status", props.status);
      }
      query.limit(1);
      query.offset(0);
      let _hosts_data = await SqlService.selectOne(query.toString());
      _hosts_data.data = JSON.parse(_hosts_data.data || '{}');
      delete _hosts_data.password;
      return _hosts_data;
    } catch (ex) {
      throw ex;
    }
  },
  async addUser(props: UserServiceInterface) {
    try {
      let _hash = await bcrypt.hash(props.password, saltRounds);
      let queryInsert = Sqlbricks.insert("users", CreateDate({
        email: props.email,
        first_name: props.first_name,
        last_name: props.last_name,
        status: props.status,
        data: JSON.stringify(props.data),
        password: _hash
      }));
      let resDataId = await SqlService.insert(queryInsert.toString());
      let resData = await this.getUser({
        id: resDataId
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async updateUser(props: UserServiceInterface) {
    try {
      let existData: UserServiceInterface = await this.getUser({
        id: props.id
      });
      if (existData == null) {
        throw new Error("Data not found!");
      }
      let queryInsert = Sqlbricks.update("users", CreateDate({
        email: props.email || existData.email,
        first_name: props.first_name || existData.first_name,
        last_name: props.last_name || existData.last_name,
        status: props.status || existData.status,
        data: JSON.stringify(props.data || existData.data || {}),
        created_at: SafeValue(existData.created_at, null)
      })).where("id", props.id);

      let updateUser = await SqlService.update(queryInsert.toString());

      if (props.password) {
        let _hash = await bcrypt.hash(props.password, saltRounds);
        queryInsert = Sqlbricks.update("users", {
          password: _hash,
        }).where("id", props.id);
        let updatePasword = await SqlService.update(queryInsert.toString());
      }

      return this.getUser({
        id: props.id
      })
    } catch (ex) {
      throw ex;
    }
  },
  async deleteUser(ids: Array<any>) {
    try {
      let _in: Array<any> | string = [
        ...ids
      ];
      _in = _in.join(',');
      let query = Sqlbricks.delete('users').where(Sqlbricks.in("id", _in)).toString();
      let deleteUser = await SqlService.delete(query.toString());
      return deleteUser;
    } catch (ex) {
      throw ex;
    }
  },
  updateSelf(props: UserServiceInterface) {
    try {
      return this.updateUser(props);
    } catch (ex) {
      throw ex;
    }
  }
}