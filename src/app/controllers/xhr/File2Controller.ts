import SafeValue from "@root/app/functions/base/SafeValue";
import GetAuthUser from "@root/app/functions/GetAuthUser";
import File2Service from "@root/app/services/File2Service";
import { StorageManager } from "@slynova/flydrive";
import BaseController from "base/BaseController";
import upath from 'upath';
const marked = require("marked");

export interface File2ControllerInterface extends BaseControllerInterface {
  getFiles: { (req: any, res: any): void }
  getFile: { (req: any, res: any): void }
  addFile: { (req: any, res: any): void }
  addDir: { (req: any, res: any): void }
  remove: { (req: any, res: any): void }
  removeByIds: { (req: any, res: any): void }
  move: { (req: any, res: any): void }
  copy: { (req: any, res: any): void }
  duplicated: { (req: any, res: any): void }
  rename: { (req: any, res: any): void }
  display: { (req: any, res: any): void }
}

declare let storage: StorageManager;

const File2Controller = BaseController.extend<File2ControllerInterface>({
  async getFiles(req, res) {
    try {
      let user = await GetAuthUser(req);
      let props = this.getBaseQuery(req);
      let resDatas = await File2Service.getFiles({
        ...props,
        user_id: user.id,
        path: SafeValue(props.path, ""),
      });
      res.send({
        status: 'success',
        status_code: 200,
        return: resDatas,
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async getFile(req, res) {
    try {
      let user = await GetAuthUser(req);
      let resDatas = await File2Service.getFileById_UserId(req.params.id, user.id);
      res.send({
        status: 'success',
        status_code: 200,
        return: resDatas,
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async addFile(req, res) {
    try {
      let user = await GetAuthUser(req);
      let props = req.body;
      let file = req.files[0];
      console.log("file ;: file ",file);
      props = {
        user_id: user.id,
        path: SafeValue(req.body.path, ""),
        name: file.originalname,
        type: file.mimetype,
        status: File2Service.STATUS.PRIVATE
      };

      let resData = await File2Service.uploadFile({
        ...props,
        temp_name: file.temp_name,
        temp_path: "temp/"
      });

      res.send({
        status: 'success',
        status_code: 200,
        return: resData,
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async addDir(req, res) {
    try {
      let user = await GetAuthUser(req);
      let props = req.body;
      props = {
        user_id: user.id,
        path: SafeValue(req.body.path, ""),
        name: req.body.name,
        type: "directory",
        status: File2Service.STATUS.PRIVATE
      };
      let resData = await File2Service.addDir(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  remove(req, res) {
    try {

    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async removeByIds(req, res) {
    try {
      let user = await GetAuthUser(req);
      let props = req.body;
      props.ids = JSON.parse(SafeValue(props.ids, '[]'));
      for (var a = 0; a < props.ids.length; a++) {
        await File2Service.removeById_UserId(props.ids[a], user.id)
      }
      res.send({
        status: 'success',
        status_code: 200,
        return: true
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async move(req, res) {
    try {
      let user = await GetAuthUser(req);
      let props = req.body;
      props.ids = JSON.parse(SafeValue(props.ids, '[]'));
      for (var a = 0; a < props.ids.length; a++) {
        await File2Service.moveById_UserId(props.ids[a], props.to, user.id);
      }
      res.send({
        status: 'success',
        status_code: 200,
        return: true
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async copy(req, res) {
    try {
      let user = await GetAuthUser(req);
      let props = req.body;
      props.ids = JSON.parse(SafeValue(props.ids, '[]'));
      for (var a = 0; a < props.ids.length; a++) {
        await File2Service.copyById_UserId(props.ids[a], props.to, user.id);
      }
      res.send({
        status: 'success',
        status_code: 200,
        return: true
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async duplicated(req, res) {
    try {
      let user = await GetAuthUser(req);
      let props = req.body;
      props.ids = JSON.parse(SafeValue(props.ids, '[]'));
      for (var a = 0; a < props.ids.length; a++) {
        await File2Service.duplicateById_UserId(props.ids[a], user.id);
      }
      res.send({
        status: 'success',
        status_code: 200,
        return: true
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async rename(req, res) {
    try {
      let user = await GetAuthUser(req);
      let props = req.body;
      let resData = await File2Service.renameById_UserId(props.name, props.id, user.id);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async display(req, res) {
    try {
      let user = await GetAuthUser(req);
      let file_id = req.params.id;
      let resData = await File2Service.getFile(file_id, user.id);
      if (resData.mime != false) {
        res.contentType(resData.mime);
      } else {
        res.contentType(resData.full_path);
      }
      console.log(marked);
      switch (resData.mime) {
        case 'text/markdown':
          res.contentType("text/html");
          return res.send(marked.parse(resData.data.toString()));
      }
      res.send(resData.data);
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
});

export default File2Controller;