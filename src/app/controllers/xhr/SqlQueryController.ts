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
      if(resData.length > 0){
        resData = resData[0];
      }else{
        resData = null;
      }
      res.send(resData);

      // db.serialize(async function () {
      //   let gg = () => {
      //     return new Promise((resolve: Function, reject: Function) => {
      //       db.get(req.query.sql, function (err, row) {
      //         if (err) {
      //           return reject(err);
      //         }
      //         resolve(row);
      //       });
      //     })
      //   }
      //   let resData = await gg();
      //   res.send(resData);
      // });
      // db.close();
    } catch (ex) {
      res.send(ex);
    }
  },
  async select(req, res) {
    try {
      console.log('req.query.sql',req.query.sql);
      let resData = await db.raw(req.query.sql);
      
      res.send(resData);
      // db.serialize(async function () {
      //   let gg = () => {
      //     return new Promise((resolve: Function, reject: Function) => {
      //       db.all(req.query.sql, function (err, row) {
      //         if (err) {
      //           return reject(err);
      //         }
      //         resolve(row);
      //       });
      //     })
      //   }
      //   let resData = await gg();
      //   res.send(resData);
      // });
      // db.close();
    } catch (ex) {
      res.send(ex);
    }
  },
  async insert(req, res) {
    try {
      let resData = await db.raw(req.query.sql);
      res.send(resData);
      // db.serialize(async function () {
      //   let gg = () => {
      //     return new Promise(function (resolve: Function, reject: Function) {
      //       db.run(req.body.sql, [], function (this: any, err, data) {
      //         if (err) {
      //           return reject(err);
      //         }
      //         return resolve(this.lastID);
      //       });
      //     })
      //   }
      //   let resData = await gg();
      //   res.send(resData + "");
      // });
    } catch (ex) {
      res.send(ex);
    }
  },
  async update(req, res) {
    try {
      let resData = await db.raw(req.query.sql);
      res.send(resData);
      // db.serialize(async function () {
      //   let gg = () => {
      //     return new Promise(function (resolve: Function, reject: Function) {
      //       db.run(req.body.sql, [], function (this: any, err, data) {
      //         if (err) {
      //           return reject(err);
      //         }
      //         return resolve(this.lastID);
      //       });
      //     })
      //   }
      //   let resData = await gg();
      //   res.send(resData + "");
      // });
    } catch (ex) {
      res.send(ex);
    }
  },
  async delete(req, res) {
    try {
      let resData = await db.raw(req.query.sql);
      res.send(resData);
      // db.serialize(async function () {
      //   let gg = () => {
      //     return new Promise(function (resolve: Function, reject: Function) {
      //       db.run(req.body.sql, [], function (this: any, err, data) {
      //         if (err) {
      //           return reject(err);
      //         }
      //         return resolve(this.lastID);
      //       });
      //     })
      //   }
      //   let resData = await gg();
      //   res.send(resData + "");
      // });
    } catch (ex) {
      res.send(ex);
    }
  }
})