import Sqlbricks from "@root/tool/SqlBricks"
import { Knex } from "knex";
import bcrypt from 'bcrypt';

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
}

export default {
  async getUsers(props: UserServiceInterface) {
    try {
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
      let _hosts_datas: Array<any> = await db.raw(_query.toString());
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
      Sqlbricks.aliasExpansions({
        'usr': "users",
      });
      let query = Sqlbricks.select(
        "usr.id as id",
        "usr.first_name as first_name",
        "usr.last_name as last_name",
        "usr.email as email",
        "usr.password as password",
        "usr.status as status",
        "usr.data as data"
      ).from("usr");
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
      let _query = query.toString();
      let _hosts_datas: Array<any> = await db.raw(_query.toString());
      _hosts_datas.forEach(el => {
        el.data = JSON.parse(el.data || '{}');
        delete el.password;
        return el;
      });
      _hosts_datas = _hosts_datas[0];
      return _hosts_datas;
    } catch (ex) {
      throw ex;
    }
  },
  async addUser(props: UserServiceInterface) {
    try {
      let _hash = await bcrypt.hash(props.password, saltRounds);
      let queryInsert = Sqlbricks.insert("users", {
        email: props.email,
        first_name: props.first_name,
        last_name: props.last_name,
        status: props.status,
        data: JSON.stringify(props.data),
        password: _hash
      });
      let _query = queryInsert.toString();
      let resData = await db.raw(_query.toString());
      let id = resData.lastInsertRowid;
      resData = await this.getUser({
        id
      })
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async updateUser(props: UserServiceInterface) {
    try {
      let queryInsert = Sqlbricks.update("users", {
        email: props.email,
        first_name: props.first_name,
        last_name: props.last_name,
        status: props.status,
        data: JSON.stringify(props.data),
      }).where("id", props.id);
      let _query = queryInsert.toString();
      let updateUser = await db.raw(_query.toString());
      if (props.password) {
        let _hash = await bcrypt.hash(props.password, saltRounds);
        queryInsert = Sqlbricks.update("users", {
          password: props.password,
        }).where("id", props.id);
        _query = queryInsert.toString();
        let updatePasword = await db.raw(_query.toString());
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
      let deleteUser = await db.raw(query.toString());
      return {
        status: 'success',
        status_code: 200,
        return: deleteUser
      }
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