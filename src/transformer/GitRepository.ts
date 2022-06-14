export interface GitRepositoryInterface {
  name?: string
  updated_at?: string
  git_url?: string
  default_branch?: string
  from_provider?: string
}

const GitRepository = (from_provider: string, props: any) => {
  let data: GitRepositoryInterface = null;
  switch (from_provider) {
    case 'github':
      data = {
        ...props,
        from_provider,
        default_branch: props.default_branch,
        git_url: props.git_url,
        name: props.name,
        updated_at: props.updated_at
      }
      break;
    case 'gitlab':
      data = {
        ...props,
        from_provider,
        default_branch: props.default_branch,
        git_url: props.web_url,
        name: props.name,
        updated_at: props.last_activity_at
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

export default GitRepository;