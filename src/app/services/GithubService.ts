import axios from "axios"
import { createWriteStream, mkdirSync, writeFileSync } from "fs"
import { pipeline } from "stream"

export interface GithubServiceInterface {
  access_token?: string,
  owner?: string
  orgName?: string
  repo_name?: string
  branch?: string
  download_path?: string
}

export default {
  async getCurrentUser(props: GithubServiceInterface) {
    try {
      let resData = await axios.get("https://api.github.com/user", {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          'Authorization': 'Bearer ' + props.access_token
        }
      })
      return resData.data;
    } catch (ex) {
      throw ex;
    }
  },
  async getCurrentRepositories(props: GithubServiceInterface) {
    try {
      let resData = await axios.get(`https://api.github.com/users/${props.owner}/repos`, {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          'Authorization': 'Bearer ' + props.access_token
        }
      })
      return resData.data;
    } catch (ex) {
      throw ex;
    }
  },
  async getCurrentRepository(props: GithubServiceInterface) {
    try {
      let resData = await axios.get(`https://api.github.com/repos/${props.owner}/${props.repo_name}`, {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          'Authorization': 'Bearer ' + props.access_token
        }
      })
      return resData.data;
    } catch (ex) {
      throw ex;
    }
  },
  async getCurrentOrgRepositories(props: GithubServiceInterface) {
    try {
      let resData = await axios.get(`https://api.github.com/org/${props.orgName}/repos`, {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          'Authorization': 'Bearer ' + props.access_token
        }
      })
      return resData.data;
    } catch (ex) {
      throw ex;
    }
  },
  async getCurrentBranchRepository(props: GithubServiceInterface) {
    try {
      let resData = await axios.get(`https://api.github.com/repos/${props.owner}/${props.repo_name}/branches`, {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          'Authorization': 'Bearer ' + props.access_token
        }
      });
      return resData.data;
    } catch (ex) {
      throw ex;
    }
  },
  async getCommits(props: GithubServiceInterface) {
    try {
      let resData = await axios.get(`https://api.github.com/repos/${props.owner}/${props.repo_name}/commits`, {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          'Authorization': 'Bearer ' + props.access_token
        }
      });
      return resData.data;
    } catch (ex) {
      throw ex;
    }
  },
  async downloadRepo(props: GithubServiceInterface) {
    try {
      mkdirSync(props.download_path, { recursive: true });
      return new Promise((resolve: Function, reject: Function) => {
        let url = `https://api.github.com/repos/${props.owner}/${props.repo_name}/zipball/${props.branch}`;
        console.log("urlllllllllllll :: ", url)
        axios.get(url, {
          headers: {
            "Accept": "application/vnd.github.v3+json",
            'Authorization': 'Bearer ' + props.access_token,
          },
          responseType: 'arraybuffer'
        }).then(async (response: any) => {
          let file_name = props.download_path + '/' + props.branch + ".zip"
          writeFileSync(file_name, response.data);
          resolve(file_name);
        }).catch((err) => {
          reject(err);
        })
        // resData.data.pipe(createWriteStream(file_name));
      })
    } catch (ex) {
      throw ex;
    }
  }
}