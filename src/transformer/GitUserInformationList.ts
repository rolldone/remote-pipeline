import GitUserInformation, { GitUserInformationInterface } from "./GitUserInformation";

const GitUserInformationList = (from_provider: string, list: Array<any>) => {
  let datas: Array<GitUserInformationInterface> = [];
  for (var a = 0; a < list.length; a++) {
    datas.push(GitUserInformation(from_provider, list[a]));
  }
  return datas;
}

export default GitUserInformationList;