import PipelineItemService from "@root/app/services/PipelineItemService"
import PipelineTaskService from "@root/app/services/PipelineTaskService";
import BaseController from "@root/base/BaseController"

export interface PipelineTaskControllerInterface extends BaseControllerInterface {
  getPipelineTask: { (req: any, res: any): void }
  getPipelineTasks: { (req: any, res: any): void }
  addPipelineTask: { (req: any, res: any): void }
  updatePipelineTask: { (req: any, res: any): void }
  deletePipelineTask: { (req: any, res: any): void }
  deletePipelineTaskByPipelineItemId: { (req: any, res: any): void }
}

export default BaseController.extend<PipelineTaskControllerInterface>({
  async getPipelineTasks(req, res) {
    try {
      let props = req.query;
      let resData = await PipelineTaskService.getPipelineTasks({
        ...props,
      });
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async getPipelineTask(req, res) {
    // id: int
    try {
      let props = req.query;
      let id = req.params.id;
      let resData = await PipelineTaskService.getPipelineTask({
        ...props,
        id
      });
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async addPipelineTask(req, res) {
    try {
      let user = req.session.user;
      let props = req.body;
      let command_datas = JSON.parse(props.command_datas || '[]');
      let resData = await PipelineTaskService.addPipelineTasks(command_datas);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  updatePipelineTask(req, res) {
    try { } catch (ex) { }
  },
  deletePipelineTask(req, res) {
    try { } catch (ex) { }
  },
  async deletePipelineTaskByPipelineItemId(req, res) {
    try {
      let props = req.body;
      let resData = await PipelineTaskService.deletePipelineTaskByPipelineItemId(props.pipeline_item_id);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  }
});