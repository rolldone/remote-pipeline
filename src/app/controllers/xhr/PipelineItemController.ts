import PipelineItemService from "@root/app/services/PipelineItemService"
import BaseController from "@root/base/BaseController"

export interface PipelineItemControllerInterface extends BaseControllerInterface {
  getPipelineItemParents: { (req: any, res: any): void }
  addPipelineItem: { (req: any, res: any): void }
  updatePipline: { (req: any, res: any): void }
  deletePipeline: { (req: any, res: any): void }
  getPipeline: { (req: any, res: any): void }
  getPipelines: { (req: any, res: any): void }
}

export default BaseController.extend<PipelineItemControllerInterface>({
  async getPipelineItemParents(req, res) {
    try {
      // project_id: int
      // pipeline_id: int
      // order_number: int
      let props = req.query;
      let resData = await PipelineItemService.getPipelineItemParents(props.project_id, props.pipeline_id, props.order_number);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async addPipelineItem(req, res) {
    // pipeline_id: int
    // project_id: int
    // name: string
    // is_active: boolean
    // type: rsync|command|file
    // value: string|file binary
    try {
      let user = req.session.user;
      let props = req.body;
      let resData = await PipelineItemService.addPipelineItem(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);

    }
  },
  async updatePipline(req, res) {
    // id: int
    // pipeline_id: int
    // project_id: int
    // name: string
    // is_active: boolean
    // type: rsync|command|file
    // value: string|file binary
    try {
      let props = req.body;
      let resData = await PipelineItemService.updatePipelineItem(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);

    }
  },
  async deletePipeline(req, res) {
    // ids: JSON []
    try {
      // ids: JSON []
      let ids = req.body.ids;
      ids = JSON.parse(ids || '[]');
      let resData = await PipelineItemService.deletePipelineItem({
        ids,
        force_deleted: req.body.force_deleted || false
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
  async getPipeline(req, res) {
    // id: int
    try {
      // id: int
      let props = req.query;
      let id = req.params.id;
      let resData = await PipelineItemService.getPipelineItem({
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
  async getPipelines(req, res) {
    // where_by: string
    // page: int
    // limit: int
    try {
      // where_by string
      // page: int
      // limit: int
      let user = req.session.user;
      let props = req.query;
      let resData = await PipelineItemService.getPipelineItems({
        ...props,
        user_id: user.id
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
});