export interface GitUserInformationInterface {
  id?: number
  name?: string
  email?: string
  avatar_url?: string
  web_url?: string
  username?: string
  from_provider?: string
}

const GitUserInformation = (from_provider: string, props: any) => {
  let data: GitUserInformationInterface = null;
  switch (from_provider) {
    case 'github':
      data = {
        ...props,
        from_provider,
        id: props.id,
        avatar_url: props.avatar_url,
        email: props.email,
        name: props.name || '-',
        username: props.login,
        web_url: props.html_url
      }
      break;
    case 'gitlab':
      data = {
        ...props,
        from_provider,
        id: props.id,
        avatar_url: props.avatar_url,
        email: props.email,
        name: props.name || '-',
        username: props.username,
        web_url: props.web_url
      }
      break;
    case 'bitbucket':
      data = {
        ...props,
        from_provider,
        id: props.id,
        avatar_url: props.avatar_url,
        email: props.email,
        name: props.name,
        username: props.username,
        web_url: props.web_url
      }
      break;
  }
  return data;
}

export default GitUserInformation;