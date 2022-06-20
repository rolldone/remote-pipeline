import OAuth from "@root/config/OAuth";
import axios from "axios";
import querystring from 'querystring';
import FormData from 'form-data';
import Sqlbricks from "@root/tool/SqlBricks";
import SqlService from "./SqlService";
import { randomBytes } from "crypto";
import CreateDate from "../functions/base/CreateDate";

export interface OauthInterface {
  id?: number
  name?: string
  user_id?: number
  oauth_id?: number
  access_token?: string
  refresh_token?: string
  repo_from?: string
  token_type?: string
  scope?: string
  data?: any
}


export default {
  generateOAuthUrl(props: {
    call_query: string
    from_provider: "github" | "gitlab" | "bitbucket",
    code_challenge?: string
    code_challenge_method?: string | "S256"
    state?: string
  }) {
    try {
      let redirect_uri = null;
      let queryProps = null;
      let queryUrl = null;
      let url = null;
      switch (props.from_provider) {
        case 'bitbucket':
          redirect_uri = OAuth.BITBUCKET_REDIRECT_URI + '?' + props.call_query
          queryProps = {
            client_id: OAuth.BITBUCKET_CLIENT_ID,
            redirect_uri: redirect_uri,
            response_type: 'code',
            scope: 'repository'
          }
          queryUrl = new URLSearchParams(queryProps);
          url = 'https://bitbucket.org/site/oauth2/authorize?' + queryUrl;
          return url;
        case 'github':
          redirect_uri = OAuth.GITHUB_REDIRECT_URI + '?' + props.call_query
          queryProps = {
            client_id: OAuth.GITHUB_CLIENT_ID,
            redirect_uri: redirect_uri,
            scope: 'user,email,repo',
          }
          queryUrl = new URLSearchParams(queryProps);
          url = 'https://github.com/login/oauth/authorize?' + queryUrl;
          return url;
        case 'gitlab':
          redirect_uri = OAuth.GITLAB_REDIRECT_URI + '?' + props.call_query
          queryProps = {
            client_id: OAuth.GITLAB_CLIENT_ID,
            redirect_uri: redirect_uri,
            scope: 'api',
            response_type: 'code',
            state: props.state,
            // code_challenge_method: props.code_challenge_method || "S256",
            // code_challenge: props.code_challenge
          }
          queryUrl = new URLSearchParams(queryProps);
          url = 'https://gitlab.com/oauth/authorize?' + queryUrl;
          console.log("url :: ", url);
          return url;
      }
    } catch (ex) {
      throw ex;
    }
  },
  async getOAuthToken(props: {
    code: string
    forward_to: string
    from_provider: "github" | "gitlab" | "bitbucket"
    code_challenge?: string,
    code_verifier?: string
  }) {
    let code = props.code;
    let forward_to = props.forward_to;
    let from_provider = props.from_provider;
    let resData = null;
    let formData = new FormData();
    let parseQuery = null;
    switch (from_provider) {
      case 'github':
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
        parseQuery = querystring.parse(resData.data);
        parseQuery = {
          ...parseQuery,
          forward_to,
          from_provider
        };
        console.log("parseQuery :: ", parseQuery);
        return parseQuery as any;
      case 'gitlab':
        console.log("oauth :: ", OAuth);
        let formDataJSON = {};
        formDataJSON["client_id"] = OAuth.GITLAB_CLIENT_ID;
        formDataJSON["client_secret"] = OAuth.GITLAB_SECRET_ID;
        formDataJSON["code"] = code;
        formDataJSON["grant_type"] = "authorization_code";
        formDataJSON["redirect_uri"] = OAuth.GITLAB_REDIRECT_URI;
        let jsonString = JSON.stringify(formDataJSON);
        resData = await axios.post('https://gitlab.com/oauth/token', jsonString, {
          headers: {
            // Overwrite Axios's automatically set Content-Type
            'Content-Type': 'application/json'
          }
        });
        parseQuery = querystring.parse(resData.data);
        parseQuery = {
          ...parseQuery,
          forward_to,
          from_provider
        };
        console.log("parseQuery :: ", parseQuery);
        return parseQuery as any;
      case 'bitbucket':
        formData.append("client_id", OAuth.BITBUCKET_CLIENT_ID);
        formData.append("client_secret", OAuth.BITBUCKET_SECRET_ID);
        formData.append("code", code);
        formData.append("grant_type", "authorization_code");
        formData.append("redirect_uri", OAuth.BITBUCKET_REDIRECT_URI);
        resData = await axios({
          method: "post",
          auth: {
            username: OAuth.BITBUCKET_CLIENT_ID,
            password: OAuth.BITBUCKET_SECRET_ID
          },
          url: 'https://bitbucket.org/site/oauth2/access_token',
          data: formData,
          headers: {
            // 'Content-Type': `multipart/form-data;`,
          }
        });
        parseQuery = querystring.parse(resData.data);
        parseQuery = {
          ...parseQuery,
          forward_to,
          from_provider
        };
        console.log("parseQuery :: ", parseQuery);
        return parseQuery as any;
    }
  },
  async addOAuthToken(props: OauthInterface) {
    try {
      let id = await SqlService.insert(Sqlbricks.insert("oauth_users", CreateDate({
        user_id: props.user_id,
        oauth_id: props.oauth_id,
        access_token: props.access_token,
        repo_from: props.repo_from,
        token_type: props.token_type,
        refresh_token: props.refresh_token,
        scope: props.scope,
        data: props.data,
      })).toString())
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
      let datStatus = await SqlService.update(Sqlbricks.update("oauth_users", CreateDate({
        access_token: props.access_token
      })).where({
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
        // "user_id": props.user_id,
        "id": props.id
      }).orderBy("id DESC").toString())
      return resData;
    } catch (ex) {
      throw ex;
    }
  }
}