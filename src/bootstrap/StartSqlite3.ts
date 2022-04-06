
import Sqlite3 from '@root/config/Sqlite3';
import sqlite from 'sqlite3';

export default function (next: Function) {
  var db = new sqlite.Database('db/' + Sqlite3.DB_NAME);
  global.db = db;
  next();
}