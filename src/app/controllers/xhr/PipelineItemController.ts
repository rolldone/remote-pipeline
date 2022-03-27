import BaseController from "@root/base/BaseController"

export interface PipelineItemControllerInterface extends BaseControllerInterface {
  addPipelineItem: { (req: any, res: any): void }
  updatePipline: { (req: any, res: any): void }
  deletePipeline: { (req: any, res: any): void }
  getPipeline: { (req: any, res: any): void }
  getPipelines: { (req: any, res: any): void }
}

export default BaseController.extend<PipelineItemControllerInterface>({
  addPipelineItem(req, res) {
    // pipeline_id: int
    // project_id: int
    // name: string
    // is_active: boolean
    // type: rsync|command|file
    // value: string|file binary

  },
  updatePipline(req, res) {
    // id: int
    // pipeline_id: int
    // project_id: int
    // name: string
    // is_active: boolean
    // type: rsync|command|file
    // value: string|file binary
  },
  deletePipeline(req, res) {
    // ids: JSON []
  },
  getPipeline(req, res) {
    // id: int
  },
  getPipelines(req, res) {
    // where_by: string
    // page: int
    // limit: int
  },
});