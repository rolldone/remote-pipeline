import ExecutionService, { Execution } from "../services/ExecutionService";
import GithubService from "../services/GithubService";
import GitlabService from "../services/GitlabService";
import OAuthService, { OauthInterface } from "../services/OAuthService";
import PipelineService, { PipelineServiceInterface } from "../services/PipelineService";

const DownloadRepo = async (props: {
  execution_id: number
  pipeline_id: number
}) => {
  try {
    let {
      execution_id,
      pipeline_id
    } = props;

    let pipeline_data: PipelineServiceInterface = await PipelineService.getPipeline({
      id: pipeline_id
    });

    let execution_data: Execution = await ExecutionService.getExecution({
      id: execution_id
    })

    let oauth_user_data: OauthInterface = await OAuthService.getOauthData({
      id: pipeline_data.repo_data.oauth_user_id
    })

    console.log("execution_data ::: ", execution_data);
    let response = null;
    let oauthGitData = null;
    switch (pipeline_data.repo_data.repo_from) {
      case 'github':
        oauthGitData = await GithubService.getCurrentUser({
          access_token: oauth_user_data.access_token
        })
        response = await GithubService.downloadRepo({
          access_token: oauth_user_data.access_token,
          owner: oauthGitData.login,
          branch: execution_data.branch,
          repo_name: pipeline_data.repo_data.repo_name,
          download_path: "./storage/app/executions/" + execution_data.id + '/repo'
        });
        break;
      case 'gitlab':
        oauthGitData = await GitlabService.getCurrentUser({
          access_token: oauth_user_data.access_token
        })
        response = await GitlabService.downloadRepo({
          id: pipeline_data.repo_data.repo_id,
          access_token: oauth_user_data.access_token,
          owner: oauthGitData.login,
          branch: execution_data.branch,
          repo_name: pipeline_data.repo_data.repo_name,
          download_path: "./storage/app/executions/" + execution_data.id + '/repo'
        });
        break;
      case 'bitbucket':
        break;
      case 'git':
        
        break;
    }
    console.log("file download :: ", response);
  } catch (ex) {
    throw ex;
  }
}

export default DownloadRepo;