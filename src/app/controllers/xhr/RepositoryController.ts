import GithubService from "@root/app/services/GithubService"
import BaseController from "@root/base/BaseController"
import { Knex } from "knex"

export interface RepositoryControllerInterface extends BaseControllerInterface {
  getRepositories: { (req: any, res: any): void }
  getRepository: { (req: any, res: any): void }
  selectRepository: { (req: any, res: any): void }
}

declare let db: Knex;

export default BaseController.extend<RepositoryControllerInterface>({
  async getRepositories(req, res) {
    try {
      let props = req.query;
      let resData = null;
      switch (props.from) {
        case 'github':
          let githubUser = req.github_user;
          let githubAccessToken = req.github_access_token;
          console.log("vmdkfvm", githubAccessToken);
          resData = await GithubService.getCurrentRepositories({
            owner: githubUser.login,
            access_token: githubAccessToken
          })
          res.send({
            status: "success",
            status_code: 200,
            return: resData
          });
          break;
      }
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async getRepository(req, res) {

  },
  async selectRepository(req, res) {

  },
});