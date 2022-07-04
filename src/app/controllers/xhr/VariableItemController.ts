import GetAuthUser from "@root/app/functions/GetAuthUser"
import FileService from "@root/app/services/FileService"
import VariableItemService from "@root/app/services/VariableItemService"
import VariableService from "@root/app/services/VariableService"
import BaseController from "@root/base/BaseController"
import FileController from "./FileController"

export interface VariableItemControllerInterface extends BaseControllerInterface {
  addVariableItem: { (req: any, res: any): void }
  updateVariableItem: { (req: any, res: any): void }
  deleteVariableItem: { (req: any, res: any): void }
  getVariableItems: { (req: any, res: any): void }
  getVariableItem: { (req: any, res: any): void }
}

export default BaseController.extend<VariableItemControllerInterface>({
  async addVariableItem(req, res) {
    try {
      let props = req.body;
      let user = await GetAuthUser(req);
      props.user_id = user.id;
      props.datas = JSON.parse(props.datas || '[]');
      let resData = await VariableItemService.addVariableItem({
        name: (Math.random() + 1).toString(36).substring(7),
        variable_id: props.variable_id,
        is_permanent: false,
        datas: props.datas,
        is_active: true
      })
      for (let b = 0; b < props.datas.length; b++) {
        let _data = props.datas[b];
        if (_data.attachment_datas != null) {
          for (let c = 0; c < _data.attachment_datas.length; c++) {
            let _item = _data.attachment_datas[c];
            let resMove = FileService.moveFile(_item.file[0].path, "./storage/app/variables/" + props.id + "/" + _item.file[0].name);
            console.log("resMove :: ", resMove);
          }
        }
        if (_data.attachment_datas_deleted != null) {
          for (let c = 0; c < _data.attachment_datas_deleted.length; c++) {
            let _item = _data.attachment_datas_deleted[c];
            FileService.removeFile("./storage/app/variables/" + props.variable_id + "/" + _item.file[0].name)
          }
        }
      }
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  updateVariableItem(req, res) {
    try {

    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  deleteVariableItem(req, res) {
    try {

    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  getVariableItems(req, res) {
    try {

    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  getVariableItem(req, res) {
    try {

    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
})