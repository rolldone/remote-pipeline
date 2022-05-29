import GetAuthUser from "@root/app/functions/GetAuthUser"
import ProjectService from "@root/app/services/ProjectService"
import BaseController from "@root/base/BaseController"

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
  async addProject(req, res) {
    try {
      // name: string
      // description: text
      // user_id: array [1]
      let user = GetAuthUser(req);
      let props = req.body;
      props.user_id = user.id;
      let resData = await ProjectService.addProject(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);

    }
  },
  /**
   * Update current project
   * @param req 
   * @param res 
   */
  async updateProject(req, res) {
    try {
      // id: int
      // name: string
      // description: text
      // user_id: array [1,2,3]
      // is_active: boolean
      let user = GetAuthUser(req);
      let props = req.body;
      props.user_id = user.id;
      let resData = await ProjectService.updateProject(props);
      res.send({
        status: 'success',
        status_code: 200,
        return: resData
      })
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async deleteProject(req, res) {
    // ids: JSON []
    try {
      // ids: JSON []
      let user = GetAuthUser(req);
      let ids = req.body.ids;
      ids = JSON.parse(ids || '[]');
      let resData = await ProjectService.deleteProject({
        ids,
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
  async getProjects(req, res) {
    try {
      // search: string
      // page: int
      // limit: int
      // where_by: string
      let user = GetAuthUser(req);
      let props = req.query;
      props.user_id = user.id;
      let resData = await ProjectService.getProjects({
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
  async getProject(req, res) {
    // id: int
    try {
      let user = GetAuthUser(req);
      let props = req.query;
      let id = req.params.id;
      props.user_id = user.id;
      let resData = await ProjectService.getProject({
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
});