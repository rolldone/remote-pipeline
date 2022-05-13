import axios from "axios"

export interface GithubServiceInterface {
  access_token?: string,
  owner?: string
  orgName?: string
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
  }
}