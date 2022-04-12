import BaseController from "@root/base/BaseController"
import { Knex } from "knex"

export interface SqlQueryControllerInterface extends BaseControllerInterface {
  selectOne: { (req: any, res: any): void }
  select: { (req: any, res: any): void }
  insert: { (req: any, res: any): void }
  update: { (req: any, res: any): void }
  delete: { (req: any, res: any): void }
}

declare let db: Knex;

export default BaseController.extend<SqlQueryControllerInterface>({
  async selectOne(req, res) {
    try {
      let resData = await db.raw(req.query.sql);
      if (resData.length > 0) {
        resData = resData[0];
      } else {
        resData = null;
      }
      res.send(resData);
    } catch (ex) {
      res.send(ex).status(400);
    }
  },
  async select(req, res) {
    try {
      console.log('req.query.sql', req.query.sql);
      let resData = await db.raw(req.query.sql);
      res.send(resData);
    } catch (ex) {
      res.status(400).send(ex);
    }
  },
  async insert(req, res) {
    try {
      let resData = await db.raw(req.body.sql);
      res.send(resData.lastInsertRowid+"");
    } catch (ex) {
      res.status(400).send(ex);
    }
  },
  async update(req, res) {
    try {
      let resData = await db.raw(req.body.sql);
      res.send(resData.lastInsertRowid+"");
    } catch (ex) {
      res.status(400).send(ex);
    }
  },
  async delete(req, res) {
    try {
      let resData = await db.raw(req.body.sql);
      res.send(resData);
    } catch (ex) {
      res.status(400).send(ex);
    }
  }
})