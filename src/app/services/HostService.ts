import sqlbricks from "@root/tool/SqlBricks";
import { Knex } from "knex";
declare let db: Knex;

export default {
  async getHosts(props) {
    try {
      let _hosts_query = sqlbricks.select("*")
        .from("hosts");
      if (props.ids != null) {
        _hosts_query.where(sqlbricks.in("id", props.ids))
      }
      let _hosts_datas: Array<any> = await db.raw(_hosts_query.toString());
      _hosts_datas.filter((el) => {
        el.data = JSON.parse(el.data);
        return el;
      })
      return _hosts_datas;
    } catch (ex) {
      throw ex;
    }
  },
  async getHost(props) {
    try {
      let _hosts_query = sqlbricks.select("*")
        .from("hosts");
      _hosts_query.where("id", props.id);
      _hosts_query.limit(1);
      let _hosts_datas: Array<any> = await db.raw(_hosts_query.toString());
      _hosts_datas.filter((el) => {
        el.data = JSON.parse(el.data);
        return el;
      })
      if (_hosts_datas.length == 0) return null;
      _hosts_datas = _hosts_datas[0];
      return _hosts_datas as any;
    } catch (ex) {
      throw ex;
    }
  }
}