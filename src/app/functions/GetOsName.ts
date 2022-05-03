import SSH2Promise from "ssh2-promise";

export default async function (props: {
  sshPromise: SSH2Promise
}) {
  let {
    sshPromise
  } = props;
  let resData = await sshPromise.exec("cat /etc/*-release");
  switch (resData) {
    case resData.includes("debian"):
      break;
    case resData.includes("redhat"):
      break;
    case resData.includes("suse"):
      break;
  }
  return resData;
}