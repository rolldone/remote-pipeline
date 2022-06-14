import GitRepository, { GitRepositoryInterface } from "./GitRepository";

const GitRepositoryList = (from_provider: string, list: Array<any>) => {
  let datas: Array<GitRepositoryInterface> = [];
  for (var a = 0; a < list.length; a++) {
    datas.push(GitRepository(from_provider, list[a]));
  }
  return datas;
}

export default GitRepositoryList;