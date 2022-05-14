import OAuth from "@root/config/OAuth";
import axios from "axios";
import querystring from 'querystring';
import FormData from 'form-data';
import Sqlbricks from "@root/tool/SqlBricks";
import SqlService from "./SqlService";

export interface OauthInterface {
  id?: number
  user_id?: number
  oauth_id?: number
  access_token?: string
  repo_from?: string
  token_type?: string
  scope?: string
  data?: any
}

export default {
  async getOAuthToken(props) {
    let code = props.code;
    let forward_to = props.forward_to;
    let from = props.from;
    let resData = null;
    switch (props.from) {
      case 'github':
        let formData = new FormData();
        formData.append("client_id", OAuth.GITHUB_CLIENT_ID);
        formData.append("client_secret", OAuth.GITHUB_SECRET_ID);
        formData.append("code", code);
        formData.append("redirect_uri", OAuth.GITHUB_REDIRECT_URI);
        resData = await axios({
          method: "post",
          url: 'https://github.com/login/oauth/access_token',
          data: formData,
          headers: {
            // 'Content-Type': `multipart/form-data;`,
          }
        });
        let parseQuery = querystring.parse(resData.data);
        parseQuery = {
          ...parseQuery,
          forward_to,
          from
        };
        console.log("parseQuery :: ", parseQuery);
        return parseQuery as any;
    }
  },
  async addOAuthToken(props: OauthInterface) {
    try {
      let id = await SqlService.insert(Sqlbricks.insert("oauth_users", {
        user_id: props.user_id,
        oauth_id: props.oauth_id,
        access_token: props.access_token,
        repo_from: props.repo_from,
        token_type: props.token_type,
        scope: props.scope,
        data: props.data,
      }).toString())
      let resData = await SqlService.selectOne(Sqlbricks.select("*").from("oauth_users").where("id", id).toString());
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async addOrUpdateOAuthToken(props: OauthInterface) {
    try {
      let oauthData = await SqlService.selectOne(Sqlbricks.select("*").from("oauth_users").where({
        "oauth_id": props.oauth_id,
        "user_id": props.user_id
      }).toString());
      if (oauthData == null) {
        return this.addOAuthToken(props);
      }
      let datStatus = await SqlService.update(Sqlbricks.update("oauth_users", {
        access_token: props.access_token
      }).where({
        "oauth_id": props.oauth_id,
        "user_id": props.user_id
      }).toString())
      let resData = await SqlService.selectOne(Sqlbricks.select("*").from("oauth_users").where("id", oauthData.id).toString());
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getOauthData(props: OauthInterface) {
    try {
      let resData = await SqlService.selectOne(Sqlbricks.select("*").from("oauth_users").where({
        "user_id": props.user_id,
        "id": props.id
      }).orderBy("id DESC").toString())
      return resData;
    } catch (ex) {
      throw ex;
    }
  }
}