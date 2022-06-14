export interface GitCommitInterface {
  link?: string
  name?: string
  date?: string
  message?: string
  sha?: string
  from_provider?: string
}

const GitCommit = (from_provider: string, props: any) => {
  let data: GitCommitInterface = null;
  switch (from_provider) {
    case 'github':
      data = {
        ...props,
        link: props.commit.link,
        name: props.commit.author.name,
        date: props.commit.committer.date,
        message: props.commit.message,
        sha: props.commit.tree.sha,
        from_provider,
      }
      break;
    case 'gitlab':
      data = {
        ...props,
        link: props.web_url,
        name: props.author_name,
        date: props.committed_date,
        message: props.message,
        sha: props.id,
        from_provider,
      }
      break;
    case 'bitbucket':
      data = {
        from_provider,
        ...props,
      }
      break;
  }
  return data;
}

export default GitCommit;