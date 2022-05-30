import { Knex } from 'knex';

declare let db: Knex;

export default {
  selectOne: async (sql: string): Promise<any> => {
    try {
      let resData = await db.raw(sql);
      resData = resData[0];
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  select: async (sql: string): Promise<any> => {
    try {
      let resData = await db.raw(sql);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  insert: async (sql) => {
    try {
      let resData = await db.raw(sql);
      return resData.lastInsertRowid;
    } catch (ex) {
      throw ex;
    }
  },
  update: async (sql) => {
    try {
      let resData = await db.raw(sql);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  delete: async (sql) => {
    try {
      let resData = await db.raw(sql);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  smartDelete: async (sql: string, force_deleted: boolean) => {
    try {
      force_deleted = JSON.parse(force_deleted as any || "false");
      if (force_deleted == false) {
        sql = sql.replace("DELETE FROM", "UPDATE");
        sql = sql.replace("WHERE", "set deleted_at = '" + new Date().toISOString().slice(0, 19).replace('T', ' ') + "' WHERE");
      }

      let resData = await db.raw(sql);
      return resData;
    } catch (ex) {
      throw ex;
    }
  }
}