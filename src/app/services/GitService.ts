import axios from "axios"
import { chmodSync, createWriteStream, existsSync, mkdirSync, writeFileSync } from "fs"
import { pipeline } from "stream"
import shelljs from 'shelljs';
import StaticType from "base/StaticType";

export interface GitService {
    id?: number
    private_key?: string,
    passphrase?: string
    repo_name?: string
    git_url?: string
    branch?: string
    download_path?: string
    search?: string
}

export default {

    async getCommit(props: GitService) {
        console.log("props :::: ", props);
        StaticType(props.branch, [String]);
        try {
            // Set the custom private key path
            const privateKeyString = props.private_key;
            const privateKeyPath = props.download_path + "/private-key.pem";

            // Set the clone destination directory
            const destinationDirectory = props.download_path + "/" + props.branch;

            // Clone the Git repository
            try {
                shelljs.ShellString(privateKeyString).to(privateKeyPath);
                // Set the appropriate file permissions for the private key
                chmodSync(privateKeyPath, '600');

                shelljs.exec(`mkdir ${destinationDirectory} || true`);
                shelljs.exec(`ls -a -l ${props.download_path} || true`);
                let _ppp = shelljs.exec(`pwd`, { silent: true });
                const _pwd = _ppp.stdout.trim();
                // Note: Propagating Environment Variables to Subprocesses

                // When using `shelljs` to execute commands, it's important to remember that
                // environment variables set in the parent Node.js process may not be automatically
                // propagated to subprocesses created by `shelljs`.

                // If you set an environment variable, such as `GIT_SSH_COMMAND`, using `process.env`,
                // it will be available only within the current Node.js process and may not be
                // passed to subprocesses.

                // To ensure that environment variables are correctly propagated to subprocesses,
                // you can explicitly include them when executing commands with `shelljs`.
                // Construct the command including the environment variable
                // Set the Git repository URL
                const gitRepositoryUrl = props.git_url;
                const sshCommand = `ssh -i "${_pwd}/${privateKeyPath.replace("./", "")}" -o StrictHostKeyChecking=no`;
                // Run the Git command to get the latest commit SHA
                let _git_pull = `cd ${_pwd}/${destinationDirectory.replace("./", "")} && GIT_SSH_COMMAND="${sshCommand}" git pull ${gitRepositoryUrl} ${props.branch}`;
                shelljs.exec(_git_pull, { silent: true });
                console.log(`GIT FETCH`, _git_pull);
                let _git_head = `cd ${_pwd}/${destinationDirectory.replace("./", "")} && GIT_SSH_COMMAND="${sshCommand}" git rev-parse ${props.branch}`
                const { stdout, stderr, code } = shelljs.exec(_git_head, { silent: true });
                console.log(`GIT HEAD`, _git_head);
                shelljs.exec(`cd ${_pwd}`);
                // Check for errors
                if (code !== 0) {
                    console.error('Failed to get last new commit SHA:', stderr);
                    // Handle the error accordingly
                    return;
                }
                // Get the commit SHA from the command output
                const commitSHA = stdout.trim();
                console.log('Latest commit SHA:', commitSHA);
                return {
                    sha: commitSHA
                }
            } catch (ex) {
                throw ex;
            }
        } catch (ex) {
            throw ex;
        }
    },
    async downloadRepo(props: GitService) {
        try {
            mkdirSync(props.download_path, { recursive: true });
            return new Promise(async (resolve: Function, reject: Function) => {
                let infoJSON = shelljs.cat(props.download_path + "/info.json").stdout;
                try {
                    infoJSON = JSON.parse(infoJSON)
                } catch (ex) {
                    infoJSON = null;
                }
                let commitData = null;
                try {
                    commitData = await this.getCommit(props);
                } catch (ex) {
                    console.log("error - ", ex);
                }
                try {
                    if (infoJSON != null && commitData.sha == infoJSON.sha) {
                        if (existsSync(props.download_path + "/" + props.branch) == true) {
                            console.log("GitService ::: Branch " + props.branch + " is exist");
                            return resolve(props.download_path + "/" + props.branch);
                        }
                    }
                } catch (ex) {
                    return reject(ex);
                }
                // Set the custom private key path
                const privateKeyString = props.private_key;
                const privateKeyPath = props.download_path + "/private-key.pem";

                // Set the Git repository URL
                const gitRepositoryUrl = props.git_url;

                // Set the clone destination directory
                const destinationDirectory = props.download_path + "/" + props.branch;

                // Clone the Git repository
                try {
                    shelljs.ShellString(privateKeyString).to(privateKeyPath);
                    // Set the appropriate file permissions for the private key
                    chmodSync(privateKeyPath, '600');

                    // shelljs.exec(`rm -R ${destinationDirectory} || true`);
                    shelljs.exec(`mkdir ${destinationDirectory} || true`);
                    shelljs.exec(`ls -a -l ${props.download_path} || true`);

                    let _ppp = shelljs.exec(`pwd`, { silent: true });
                    const _pwd = _ppp.stdout.trim();

                    // Note: Propagating Environment Variables to Subprocesses

                    // When using `shelljs` to execute commands, it's important to remember that
                    // environment variables set in the parent Node.js process may not be automatically
                    // propagated to subprocesses created by `shelljs`.

                    // If you set an environment variable, such as `GIT_SSH_COMMAND`, using `process.env`,
                    // it will be available only within the current Node.js process and may not be
                    // passed to subprocesses.

                    // To ensure that environment variables are correctly propagated to subprocesses,
                    // you can explicitly include them when executing commands with `shelljs`.
                    // Construct the command including the environment variable
                    const sshCommand = `ssh -i "${_pwd}/${privateKeyPath.replace("./", "")}" -o StrictHostKeyChecking=no`;
                    const gitCloneCommand = `GIT_SSH_COMMAND="${sshCommand}" git clone --depth=1 --recursive -b ${props.branch} ${gitRepositoryUrl} ${_pwd}/${destinationDirectory.replace("./", "")}`;
                    console.log("gitCloneCommand :: ", gitCloneCommand);
                    let _gitCloneCOmmandResult = shelljs.exec(gitCloneCommand);

                    // Check the result
                    if (_gitCloneCOmmandResult.code !== 0) {
                        console.error('Error: Git clone command failed');
                        console.error(_gitCloneCOmmandResult.stderr);
                        // return reject(_gitCloneCOmmandResult.stderr);
                    } else {
                        console.log('Git clone command successful');
                        console.log(_gitCloneCOmmandResult.stdout);
                    }

                    try {
                        commitData = await this.getCommit(props);
                    } catch (ex) {
                        console.log("error - ", ex);
                    }

                    writeFileSync(props.download_path + "/info.json", JSON.stringify({
                        sha: commitData.sha,
                        branch: props.branch,
                    }));

                    resolve(destinationDirectory);
                } catch (error) {

                    console.error("shelljs err :: ", error);
                    return reject(error);
                }
            })
        } catch (ex) {
            throw ex;
        }
    }
}