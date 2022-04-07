
import Sqlite3 from '@root/config/Sqlite3';
import { knex } from 'knex';

export default function (next: Function) {
  const dbknex = knex({
    client: 'better-sqlite3', // or 'better-sqlite3'
    connection: {
      filename: 'db/' + Sqlite3.DB_NAME
    }
  });
  global.db = dbknex;
  next();
}