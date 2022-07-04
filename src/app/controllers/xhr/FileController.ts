import BaseController from "@root/base/BaseController"
import fs from 'fs';
import upath from 'upath';
import { fsyncSync } from "fs";
export interface FileControllerInterface extends BaseControllerInterface {
  addFile: { (req: any, res: any): void }
  removeFile: { (req: any, res: any): void }
  moveFile: { (req: any, res: any): void }
}

export default BaseController.extend<FileControllerInterface>({
  addFile(req, res) {
    try {
      console.log('addFile :: ', req.body);
      console.log('files :: ', req.files);
      let _files_datas_exist = req.body.files || [];
      let _files_datas_new = req.files;
      _files_datas_exist = [
        ..._files_datas_exist,
        ..._files_datas_new
      ]
      res.send(_files_datas_exist);
    } catch (ex) {
      res.send(ex);
    }
  },
  removeFile(req, res) {
    try {
      let delete_path = req.body.delete_path;
      if (fs.existsSync(delete_path) == false) {
        return res.send("Allready deleted!");
      }
      fs.unlinkSync(delete_path);
      return res.send("Delete Success!");
    } catch (ex) {
      res.send(ex);
    }
  },
  moveFile(req, res) {
    try {
      let from_path = req.body.from_path;
      let to_path = req.body.to_path;
      let folder = upath.parse(to_path);
      if (fs.existsSync(from_path) == false) {
        res.send("Not exist!");
        return;
      }
      fs.mkdirSync(folder.dir, { recursive: true });
      fs.renameSync(from_path, to_path);
      res.send(folder);
    } catch (ex) {
      res.status(400).send(ex);
    }
  }
})