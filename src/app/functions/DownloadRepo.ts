import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import ExecutionService, { Execution } from "../services/ExecutionService";
import GithubService from "../services/GithubService";
import GitlabService from "../services/GitlabService";
import OAuthService, { OauthInterface } from "../services/OAuthService";
import PipelineService, { PipelineServiceInterface } from "../services/PipelineService";
import WaitingTimeout from "./WaitingTimeout";

declare let masterData: MasterDataInterface;

const DownloadRepo = (props: {
  execution_id: number
  pipeline_id: number
  job_id: string
}) => {
  return new Promise(async (resolve: Function, reject: Function) => {
    let {
      execution_id,
      pipeline_id,
      job_id
    } = props;
    try {
      let pipeline_data: PipelineServiceInterface = await PipelineService.getPipeline({
        id: pipeline_id
      });

      let execution_data: Execution = await ExecutionService.getExecution({
        id: execution_id
      })

      let oauth_user_data: OauthInterface = await OAuthService.getOauthData({
        id: pipeline_data.repo_data.oauth_user_id
      })


      let isBooking: boolean = masterData.getData("repo_execution_" + execution_id, false) as any;
      console.log("isBooking ::: ", isBooking);
      while (isBooking == true) {
        isBooking = masterData.getData("repo_execution_" + execution_id, false) as any;
        console.log("isBooking second ::: ", isBooking);
        await WaitingTimeout(2000);
      }

      masterData.saveData("repo_execution_" + execution_id, true);

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
            download_path: "./storage/app/executions/" + execution_data.id + '/repo' //"./storage/app/jobs/" + job_id + '/repo' // 
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
            download_path: "./storage/app/executions/" + execution_data.id + '/repo' //"./storage/app/jobs/" + job_id + '/repo' // 
          });
          break;
        case 'bitbucket':
          break;
        case 'git':

          break;
      }
      masterData.saveData("repo_execution_" + execution_id, false);
      masterData.removeListener("repo_execution_" + execution_id);
      console.log("file download :: ", response);
      resolve();
    } catch (ex) {
      masterData.saveData("repo_execution_" + execution_id, false);
      masterData.removeListener("repo_execution_" + execution_id);
      reject(ex);
    }
  })
}

export default DownloadRepo;