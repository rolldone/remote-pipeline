import PipelineService from "@root/app/services/PipelineService"
import BaseController from "@root/base/BaseController"

export interface PipelineControllerInterface extends BaseControllerInterface {
  addPipeline: { (req: any, res: any): void }
  updatePipeline: { (req: any, res: any): void }
  deletePipeline: { (req: any, res: any): void }
  getPipelines: { (req: any, res: any): void }
  getPipeline: { (req: any, res: any): void }
}

export default BaseController.extend<PipelineControllerInterface>({
  async addPipeline(req, res) {
    // project_id: int
    // name: string
    // description: string
    // hosts: JSON [{ host : xxx.xxx.xxx.xxx, private_key : ...xxx, password : xxxxxx }, { ...xxx }]
    let props = req.body;
    let resData = await PipelineService.addPipeline(props);
    res.send({
      status: 'success',
      status_code: 200,
      return: resData
    })
  },
  async updatePipeline(req, res) {
    // id: int
    // project_id: int
    // name: string
    // description: text
    // hosts: JSON [{ host : xxx.xxx.xxx.xxx, private_key : ...xxx, password : xxxxxx }, { ...xxx }]
    let props = req.body;
    let resData = await PipelineService.updatePipeline(props);
    res.send({
      status: 'success',
      status_code: 200,
      return: resData
    })
  },
  async deletePipeline(req, res) {
    // ids: Array []
    try {
      // ids: JSON []
      let ids = req.body.ids;
      ids = JSON.parse(ids || '[]');
      let resData = await PipelineService.deletePipelines(ids);
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async getPipelines(req, res) {
    // where_by: string
    // page: int
    // limit: int
    let props = req.query;
    let resData = await PipelineService.getPipelines({
      ...props,
    });
    res.send({
      status: 'success',
      status_code: 200,
      return: resData
    })
  },
  async getPipeline(req, res) {
    // id: int
    let props = req.query;
    let id = req.params.id;
    let resData = await PipelineService.getPipeline({
      ...props,
      id
    });
    res.send({
      status: 'success',
      status_code: 200,
      return: resData
    })
  },
});