import axios from "axios"
import { createWriteStream, existsSync, mkdirSync, writeFileSync } from "fs"
import { pipeline } from "stream"
import shelljs from 'shelljs';

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
  async getCommit(props: GithubServiceInterface) {
    try {
      let resData = await axios.get(`https://api.github.com/repos/${props.owner}/${props.repo_name}/commits/${props.branch}`, {
        headers: {
          "Accept": "application/vnd.github.v3+sha",
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
      return new Promise(async (resolve: Function, reject: Function) => {
        let infoJSON = shelljs.cat(props.download_path + "/info.json").stdout;
        try {
          infoJSON = JSON.parse(infoJSON)
        } catch (ex) {
          infoJSON = null;
        }
        let commitData = await this.getCommit(props);
        if (infoJSON != null && commitData.sha == infoJSON.sha) {
          if (existsSync(props.download_path + "/" + props.branch) == true) {
            console.log("GithubService ::: Branch " + props.branch + " is exist");
            return resolve(props.download_path + "/" + props.branch);
          }
        }
        let url = `https://api.github.com/repos/${props.owner}/${props.repo_name}/zipball/${props.branch}`;
        axios.get(url, {
          headers: {
            "Accept": "application/vnd.github.v3+json",
            'Authorization': 'Bearer ' + props.access_token,
          },
          responseType: 'arraybuffer'
        }).then(async (response: any) => {
          let file_zip = props.owner + '-' + props.repo_name + ".zip";
          let place_save_file = props.download_path + '/' + file_zip;
          // First delete all data and folder on target 
          // ! attempts to expand history event. In BASH you can enable extglob using:
          shelljs.exec("shopt -s extglob");
          // Then use this rm command to delete all but these 2 listed files:
          shelljs.exec("rm -R " + props.download_path + "/!(info.json)");
          // Then save new file
          writeFileSync(place_save_file, response.data);
          writeFileSync(props.download_path + "/info.json", JSON.stringify({
            sha: commitData.sha,
            branch: props.branch,
          }));
          // Then unzip the file from root project path as point
          shelljs.exec("unzip -o " + props.download_path + "/" + file_zip + " -d " + props.download_path + " && rm " + props.download_path + "/" + file_zip);
          shelljs.exec("mv " + props.download_path + "/" + props.owner + "* " + props.download_path + "/" + props.branch);
          console.log("GithubService ::: Shelljs is done");
          resolve(place_save_file);
        }).catch((err) => {
          console.log("downloadRepo - ex :: ", err);
          reject(err);
        })
      })
    } catch (ex) {
      throw ex;
    }
  }
}