import DotEnv from "../tool/DotEnv";

export interface OAuthInterface {
  GITHUB_CLIENT_ID: string
  GITHUB_SECRET_ID: string
  GITHUB_HOMEPAGE_URL: string
  GITHUB_REDIRECT_URI: string
  GITLAB_CLIENT_ID: string
  GITLAB_SECRET_ID: string
  GITLAB_HOMEPAGE_URL: string
  GITLAB_REDIRECT_URI: string
  BITBUCKET_CLIENT_ID: string
  BITBUCKET_SECRET_ID: string
  BITBUCKET_HOMEPAGE_URL: string
  BITBUCKET_REDIRECT_URI: string
}

export default ({
  GITHUB_CLIENT_ID: DotEnv.GITHUB_CLIENT_ID,
  GITHUB_SECRET_ID: DotEnv.GITHUB_SECRET_ID,
  GITHUB_HOMEPAGE_URL: DotEnv.GITHUB_HOMEPAGE_URL,
  GITHUB_REDIRECT_URI: DotEnv.GITHUB_REDIRECT_URI,
  GITLAB_CLIENT_ID: DotEnv.GITLAB_CLIENT_ID,
  GITLAB_SECRET_ID: DotEnv.GITLAB_SECRET_ID,
  GITLAB_HOMEPAGE_URL: DotEnv.GITLAB_HOMEPAGE_URL,
  GITLAB_REDIRECT_URI: DotEnv.GITLAB_REDIRECT_URI,
  BITBUCKET_CLIENT_ID: DotEnv.BITBUCKET_CLIENT_ID,
  BITBUCKET_SECRET_ID: DotEnv.BITBUCKET_SECRET_ID,
  BITBUCKET_HOMEPAGE_URL: DotEnv.BITBUCKET_HOMEPAGE_URL,
  BITBUCKET_REDIRECT_URI: DotEnv.BITBUCKET_REDIRECT_URI
} as OAuthInterface);