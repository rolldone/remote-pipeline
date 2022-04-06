import BaseController from "@root/base/BaseController"

export interface SqlQueryControllerInterface extends BaseControllerInterface {
  selectOne: { (req: any, res: any): void }
  select: { (req: any, res: any): void }
  insert: { (req: any, res: any): void }
  update: { (req: any, res: any): void }
  delete: { (req: any, res: any): void }
}

declare let db: any;

export default BaseController.extend<SqlQueryControllerInterface>({
  selectOne(req, res) {
    try {
      db.serialize(async function () {
        let gg = () => {
          return new Promise((resolve: Function, reject: Function) => {
            db.get(req.query.sql, function (err, row) {
              if (err) {
                return reject(err);
              }
              resolve(row);
            });
          })
        }
        let resData = await gg();
        res.send(resData);
      });
      // db.close();
    } catch (ex) {
      res.send(ex);
    }
  },
  select(req, res) {
    try {
      db.serialize(async function () {
        let gg = () => {
          return new Promise((resolve: Function, reject: Function) => {
            db.all(req.query.sql, function (err, row) {
              if (err) {
                return reject(err);
              }
              resolve(row);
            });
          })
        }
        let resData = await gg();
        res.send(resData);
      });
      // db.close();
    } catch (ex) {
      res.send(ex);
    }
  },
  insert(req, res) {
    try {
      db.serialize(async function () {
        let gg = () => {
          return new Promise(function (resolve: Function, reject: Function) {
            db.run(req.body.sql, [], function (this: any, err, data) {
              if (err) {
                return reject(err);
              }
              return resolve(this.lastID);
            });
          })
        }
        let resData = await gg();
        res.send(resData + "");
      });
    } catch (ex) {
      res.send(ex);
    }
  },
  update(req, res) {
    try {
      db.serialize(async function () {
        let gg = () => {
          return new Promise(function (resolve: Function, reject: Function) {
            db.run(req.body.sql, [], function (this: any, err, data) {
              if (err) {
                return reject(err);
              }
              return resolve(this.lastID);
            });
          })
        }
        let resData = await gg();
        res.send(resData + "");
      });
    } catch (ex) {
      res.send(ex);
    }
  },
  delete(req, res) {
    try {
      db.serialize(async function () {
        let gg = () => {
          return new Promise(function (resolve: Function, reject: Function) {
            db.run(req.body.sql, [], function (this: any, err, data) {
              if (err) {
                return reject(err);
              }
              return resolve(this.lastID);
            });
          })
        }
        let resData = await gg();
        res.send(resData + "");
      });
    } catch (ex) {
      res.send(ex);
    }
  },
})