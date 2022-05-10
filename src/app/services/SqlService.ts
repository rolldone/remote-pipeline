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
  }
}