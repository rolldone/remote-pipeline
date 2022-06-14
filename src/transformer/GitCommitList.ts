import GitCommit, { GitCommitInterface } from "./GitCommit";

const GitCommitList = (from_provider: string, list: Array<any>) => {
  let datas: Array<GitCommitInterface> = [];
  for (var a = 0; a < list.length; a++) {
    datas.push(GitCommit(from_provider, list[a]));
  }
  return datas;
}

export default GitCommitList;