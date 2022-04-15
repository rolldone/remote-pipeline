import BaseController from "@root/base/BaseController"

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
      res.send(req.files);
    } catch (ex) {
      res.send(ex);
    }
  },
  removeFile(req, res) {
    try {
      
    } catch (ex) {
      res.send(ex);
    }
  },
  moveFile(req, res) {
    try {

    } catch (ex) {
      res.send(ex);
    }
  }
})