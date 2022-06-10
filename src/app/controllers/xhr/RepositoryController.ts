import GithubService from "@root/app/services/GithubService"
import BaseController from "@root/base/BaseController"
import { Knex } from "knex"

export interface RepositoryControllerInterface extends BaseControllerInterface {
  getRepositories: { (req: any, res: any): void }
  getRepository: { (req: any, res: any): void }
  selectRepository: { (req: any, res: any): void }
  getBranchRepository: { (req: any, res: any): void }
  getOwner: { (req: any, res: any): void }
  getCommits: { (req: any, res: any): void }
}

declare let db: Knex;

export default BaseController.extend<RepositoryControllerInterface>({
  async getRepositories(req, res) {
    try {
      let props = req.query;
      let resData = null;
      switch (props.from_provider) {
        case 'github':
          let githubUser = req.github_user;
          let githubAccessToken = req.github_access_token;
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
        case 'gitlab':

          break;
      }
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async getRepository(req, res) {
    try {
      let props = req.query;
      props.repo_name = req.params.repo_name;
      if (props.repo_name == null) {
        res.send({
          status: "success",
          status_code: 200,
          return: []
        });
        return;
      }
      let resData = null;
      switch (props.from_provider) {
        case 'github':
          let githubUser = req.github_user;
          let githubAccessToken = req.github_access_token;
          resData = await GithubService.getCurrentRepository({
            owner: githubUser.login,
            access_token: githubAccessToken,
            repo_name: props.repo_name
          })
          res.send({
            status: "success",
            status_code: 200,
            return: resData
          });
          break;
        case 'gitlab':

          break;
      }
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async selectRepository(req, res) {

  },
  async getBranchRepository(req, res) {
    try {
      let props = req.query;
      let resData = null;
      switch (props.from_provider) {
        case 'github':
          let githubUser = req.github_user;
          let githubAccessToken = req.github_access_token;
          resData = await GithubService.getCurrentBranchRepository({
            owner: githubUser.login,
            access_token: githubAccessToken,
            repo_name: props.repo_name
          })
          res.send({
            status: "success",
            status_code: 200,
            return: resData
          });
          break;
        case 'gitlab':

          break;
      }
      return res.send({
        status: "success",
        status_code: 200,
        return: resData
      });
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async getOwner(req, res) {
    try {
      let props = req.query;
      let resData = null;
      switch (props.from_provider) {
        case 'github':
          let githubUser = req.github_user;
          let githubAccessToken = req.github_access_token;
          resData = await GithubService.getCurrentUser({
            owner: githubUser.login,
            access_token: githubAccessToken,
            repo_name: props.repo_name
          })
          res.send({
            status: "success",
            status_code: 200,
            return: resData
          });
          break;
        case 'gitlab':

          break;
      }
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async getCommits(req, res) {
    try {
      let props = req.query;
      let resData = null;
      switch (props.from_provider) {
        case 'github':
          let githubUser = req.github_user;
          let githubAccessToken = req.github_access_token;
          resData = await GithubService.getCommits({
            owner: githubUser.login,
            access_token: githubAccessToken,
            repo_name: props.repo_name
          })
          res.send({
            status: "success",
            status_code: 200,
            return: resData
          });
          break;
        case 'gitlab':

          break;
      }
    } catch (ex) {
      return res.status(400).send(ex);
    }
  }
});