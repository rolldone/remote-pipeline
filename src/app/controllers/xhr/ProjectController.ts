import BaseController from "base/BaseController"

export interface ProjectControllerInterface extends BaseControllerInterface {
  addProject: { (req: any, res: any): void }
  updateProject: { (req: any, res: any): void }
  deleteProject: { (req: any, res: any): void }
  getProjects: { (req: any, res: any): void }
  getProject: { (req: any, res: any): void }
}

export default BaseController.extend<ProjectControllerInterface>({
  /**
   * Add new project
   * @param req 
   * @param res 
   */
  addProject(req, res) {
    // name: string
    // description: text
    // user_id: array [1]
  },
  /**
   * Update current project
   * @param req 
   * @param res 
   */
  updateProject(req, res) {
    // id: int
    // name: string
    // description: text
    // user_id: array [1,2,3]
    // is_active: boolean
  },
  deleteProject(req, res) {
    // ids: JSON []
  },
  getProjects(req, res) {
    // search: string
    // page: int
    // limit: int
    // where_by: string
  },
  getProject(req, res) {
    // id: int
  },
});