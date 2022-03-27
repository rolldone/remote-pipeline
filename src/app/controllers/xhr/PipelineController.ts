import BaseController from "@root/base/BaseController"

export interface PipelineControllerInterface extends BaseControllerInterface {
  addPipeline: { (req: any, res: any): void }
  updatePipeline: { (req: any, res: any): void }
  deletePipeline: { (req: any, res: any): void }
  getPipelines: { (req: any, res: any): void }
  getPipeline: { (req: any, res: any): void }
}

export default BaseController.extend<PipelineControllerInterface>({
  addPipeline(req, res) {
    // project_id: int
    // name: string
    // description: string
    // hosts: JSON [{ host : xxx.xxx.xxx.xxx, private_key : ...xxx, password : xxxxxx }, { ...xxx }]
  },
  updatePipeline(req, res) {
    // id: int
    // project_id: int
    // name: string
    // description: text
    // hosts: JSON [{ host : xxx.xxx.xxx.xxx, private_key : ...xxx, password : xxxxxx }, { ...xxx }]
  },
  deletePipeline(req, res) {
    // ids: Array []
  },
  getPipelines(req, res) {
    // where_by: string
    // page: int
    // limit: int
  },
  getPipeline(req, res) {
    // id: int
  },
});