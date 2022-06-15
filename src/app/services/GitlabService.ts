import axios from "axios"
import { createWriteStream, existsSync, mkdirSync, writeFileSync } from "fs"
import { pipeline } from "stream"
import shelljs from 'shelljs';
import StaticType from "base/StaticType";

export interface GitlabServiceInterface {
  id?: number
  access_token?: string,
  owner?: string
  orgName?: string
  repo_name?: string
  branch?: string
  download_path?: string
  sha?: string
}

export default {
  async getCurrentUser(props: GitlabServiceInterface) {
    try {
      let resData = await axios.get("https://gitlab.com/api/v4/user", {
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
  async getCurrentRepositories(props: GitlabServiceInterface) {
    try {
      let resData = await axios.get(`https://gitlab.com/api/v4/projects?owned=true`, {
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
  async getCurrentRepository(props: GitlabServiceInterface) {
    StaticType(props.id, [Number, String]);
    StaticType(props.access_token, [String]);
    try {
      let resData = await axios.get(`https://gitlab.com/api/v4/projects/${props.id}`, {
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
  async getCurrentOrgRepositories(props: GitlabServiceInterface) {
    try {
      let resData = await axios.get(`https://gitlab.com/api/v4/projects`, {
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
  async getCurrentBranchRepository(props: GitlabServiceInterface) {
    StaticType(props.id, [Number, String]);
    StaticType(props.access_token, [String]);
    try {
      let resData = await axios.get(`https://gitlab.com/api/v4/projects/${props.id}/repository/branches`, {
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
  async getCommits(props: GitlabServiceInterface) {
    StaticType(props.id, [Number, String]);
    StaticType(props.access_token, [String]);
    try {
      let resData = await axios.get(`https://gitlab.com/api/v4/projects/${props.id}/repository/commits`, {
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
  async getCommit(props: GitlabServiceInterface) {
    console.log("props :::: ", props);
    StaticType(props.id, [Number, String]);
    StaticType(props.branch, [String]);
    StaticType(props.access_token, [String]);
    try {
      let resData = await axios.get(`https://gitlab.com/api/v4/projects/${props.id}/repository/commits/${props.branch}`, {
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
  async downloadRepo(props: GitlabServiceInterface) {
    try {
      mkdirSync(props.download_path, { recursive: true });
      return new Promise(async (resolve: Function, reject: Function) => {
        let infoJSON = shelljs.cat(props.download_path + "/info.json").stdout;
        try {
          infoJSON = JSON.parse(infoJSON)
        } catch (ex) {
          infoJSON = null;
        }
        console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaa", props);
        let commitData = null;
        try {
          commitData = await this.getCommit(props);
        } catch (ex) {
          console.log("error - ", ex);
        }
        if (infoJSON != null && commitData.sha == infoJSON.sha) {
          if (existsSync(props.download_path + "/" + props.branch) == true) {
            console.log("GitlabService ::: Branch " + props.branch + " is exist");
            return resolve(props.download_path + "/" + props.branch);
          }
        }
        let url = `https://gitlab.com/api/v4/repos/${props.owner}/${props.repo_name}/zipball/${props.branch}`;
        axios.get(url, {
          headers: {
            "Accept": "application/vnd.github.v3+json",
            'Authorization': 'Bearer ' + props.access_token,
          },
          responseType: 'arraybuffer'
        }).then(async (response: any) => {
          let file_zip = props.branch + ".zip";
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
          shelljs.exec("mv " + props.download_path + "/" + (props.repo_name.split(" ").join("_").toLowerCase()) + "* " + props.download_path + "/" + props.branch);
          console.log("GitlabService ::: Shelljs is done");
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