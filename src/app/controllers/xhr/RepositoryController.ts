import GithubService from "@root/app/services/GithubService"
import GitlabService from "@root/app/services/GitlabService"
import BaseController from "@root/base/BaseController"
import GitCommit from "@root/transformer/GitCommit"
import GitCommitList from "@root/transformer/GitCommitList"
import GitRepository from "@root/transformer/GitRepository"
import GitRepositoryList from "@root/transformer/GitRepositoryList"
import GitUserInformation from "@root/transformer/GitUserInformation"
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
      let oauthRepoUser = null;
      let repoAccessToken = null;
      switch (props.from_provider) {
        case 'github':
          oauthRepoUser = req.repo_auth_user;
          repoAccessToken = req.repo_auth_access_token;
          resData = await GithubService.getCurrentRepositories({
            owner: oauthRepoUser.login,
            access_token: repoAccessToken,
            search: props.search
          });
          break;
        case 'gitlab':
          oauthRepoUser = req.repo_auth_user;
          repoAccessToken = req.repo_auth_access_token;
          resData = await GitlabService.getCurrentRepositories({
            owner: oauthRepoUser.login,
            access_token: repoAccessToken,
            search: props.search
          });
          break;
      }
      resData = GitRepositoryList(props.from_provider, resData)
      res.send({
        status: "success",
        status_code: 200,
        return: resData
      });
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
      let oauthRepoUser = null;
      let repoAccessToken = null;
      switch (props.from_provider) {
        case 'github':
          oauthRepoUser = req.repo_auth_user;
          repoAccessToken = req.repo_auth_access_token;
          resData = await GithubService.getCurrentRepository({
            owner: oauthRepoUser.login,
            access_token: repoAccessToken,
            repo_name: props.repo_name
          })
          break;
        case 'gitlab':
          oauthRepoUser = req.repo_auth_user;
          repoAccessToken = req.repo_auth_access_token;
          resData = await GitlabService.getCurrentRepository({
            access_token: repoAccessToken,
            id: props.id
          })
          break;
      }
      resData = GitRepository(props.from_provider, resData);
      res.send({
        status: "success",
        status_code: 200,
        return: resData
      });
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
      let oauthRepoUser = null;
      let repoAccessToken = null;
      switch (props.from_provider) {
        case 'github':
          oauthRepoUser = req.repo_auth_user;
          repoAccessToken = req.repo_auth_access_token;
          resData = await GithubService.getCurrentBranchRepository({
            owner: oauthRepoUser.login,
            access_token: repoAccessToken,
            repo_name: props.repo_name
          })
          break;
        case 'gitlab':
          oauthRepoUser = req.repo_auth_user;
          repoAccessToken = req.repo_auth_access_token;
          resData = await GitlabService.getCurrentBranchRepository({
            access_token: repoAccessToken,
            id: props.id
          })
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
      let oauthRepoUser = null;
      let repoAccessToken = null;
      switch (props.from_provider) {
        case 'github':
          oauthRepoUser = req.repo_auth_user;
          repoAccessToken = req.repo_auth_access_token;
          resData = await GithubService.getCurrentUser({
            owner: oauthRepoUser.login,
            access_token: repoAccessToken,
            repo_name: props.repo_name
          })
          break;
        case 'gitlab':
          oauthRepoUser = req.repo_auth_user;
          repoAccessToken = req.repo_auth_access_token;
          resData = await GitlabService.getCurrentUser({
            access_token: repoAccessToken
          })
          break;
      }
      resData = GitUserInformation(props.from_provider, resData);
      res.send({
        status: "success",
        status_code: 200,
        return: resData
      });
    } catch (ex) {
      return res.status(400).send(ex);
    }
  },
  async getCommits(req, res) {
    try {
      let props = req.query;
      let resData = null;
      let oauthRepoUser = null;
      let repoAccessToken = null;
      switch (props.from_provider) {
        case 'github':
          oauthRepoUser = req.repo_auth_user;
          repoAccessToken = req.repo_auth_access_token;
          resData = await GithubService.getCommits({
            owner: oauthRepoUser.login,
            access_token: repoAccessToken,
            repo_name: props.repo_name
          })
          break;
        case 'gitlab':
          oauthRepoUser = req.repo_auth_user;
          repoAccessToken = req.repo_auth_access_token;
          resData = await GitlabService.getCommits({
            access_token: repoAccessToken,
            id: props.id
          })
          break;
      }
      resData = GitCommitList(props.from_provider, resData);
      res.send({
        status: "success",
        status_code: 200,
        return: resData
      });
    } catch (ex) {
      return res.status(400).send(ex);
    }
  }
});