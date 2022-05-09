import Sqlbricks from '@root/tool/SqlBricks';
import bcrypt from 'bcrypt';
import { Knex } from 'knex';

declare let db: Knex;

export interface UserPartnerInterface {
  id?: number
  user_id?: number
  partner_user_id?: number
  data?: any
}
export default {
  async addUserPartner(props: UserPartnerInterface) {
    let queryInsert = Sqlbricks.insert("user_partners", {
      user_id: props.user_id,
      partner_user_id: props.partner_user_id,
      data: JSON.stringify(props.data || {}),
    });
    let _query = queryInsert.toString();
    let resData = await db.raw(_query.toString());
    let id = resData.lastInsertRowid;
    resData = await this.getUserPartner({
      id
    })
    return resData;
  },
  async getUserPartner(props: UserPartnerInterface) {
    try {
      Sqlbricks.aliasExpansions({
        'part': "user_partners",
        "usr": "users",
        "usr_part": "users"
      });
      let query = Sqlbricks.select(
        "part.user_id as user_id",
        "part.partner_user_id as partner_user_id",
        "part.data as data",
        "usr.id as usr_id",
        "usr.first_name as usr_first_name",
        "usr.last_name as usr_last_name",
        "usr.email as usr_email",
        "usr.status as usr_status",
        "usr.data as usr_data",
        "usr_part.id as usr_part_id",
        "usr_part.first_name as usr_part_first_name",
        "usr_part.last_name as usr_part_last_name",
        "usr_part.email as usr_part_email",
        "usr_part.status as usr_part_status",
        "usr_part.data as usr_part_data",
      ).from("part");
      query.leftJoin("usr").on({
        "part.user_id": "usr.id"
      });
      query.leftJoin("usr_part").on({
        "part.partner_user_id": "usr_part.id"
      });
      if (props.id) {
        query.where("part.id", props.id);
      }
      query.limit(1);
      query.offset(0);
      let _query = query.toString();
      let _hosts_datas: Array<any> = await db.raw(_query.toString());
      _hosts_datas.forEach(el => {
        el.data = JSON.parse(el.data || '{}');
        el.usr_data = JSON.parse(el.usr_data || '{}');
        el.usr_part_data = JSON.parse(el.usr_part_data || '{}');
        return el;
      });
      _hosts_datas = _hosts_datas[0];
      return _hosts_datas;
    } catch (ex) {
      throw ex;
    }
  },
  async getUserPartners(props: UserPartnerInterface) {
    try {
      Sqlbricks.aliasExpansions({
        'part': "user_partners",
        "usr": "users",
        "usr_part": "users"
      });
      let query = Sqlbricks.select(
        "part.user_id as user_id",
        "part.partner_user_id as partner_user_id",
        "part.data as data",
        "usr.id as usr_id",
        "usr.first_name as usr_first_name",
        "usr.last_name as usr_last_name",
        "usr.email as usr_email",
        "usr.status as usr_status",
        "usr.data as usr_data",
        "usr_part.id as usr_part_id",
        "usr_part.first_name as usr_part_first_name",
        "usr_part.last_name as usr_part_last_name",
        "usr_part.email as usr_part_email",
        "usr_part.status as usr_part_status",
        "usr_part.data as usr_part_data",
      ).from("part");
      query.leftJoin("usr").on({
        "part.user_id": "usr.id"
      });
      query.leftJoin("usr_part").on({
        "part.partner_user_id": "usr_part.id"
      });
      if (props.user_id) {
        query.where("part.user_id", props.user_id);
      }
      // query.limit(1);
      // query.offset(0);
      let _query = query.toString();
      let _hosts_datas: Array<any> = await db.raw(_query.toString());
      _hosts_datas.forEach(el => {
        el.data = JSON.parse(el.data || '{}');
        el.usr_data = JSON.parse(el.usr_data || '{}');
        el.usr_part_data = JSON.parse(el.usr_part_data || '{}');
        return el;
      });
      return _hosts_datas;
    } catch (ex) {
      throw ex;
    }
  }
}