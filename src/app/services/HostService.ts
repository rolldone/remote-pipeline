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
  }
}