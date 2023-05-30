import axios from "axios"
import { chmodSync, createWriteStream, existsSync, mkdirSync, writeFileSync } from "fs"
import { pipeline } from "stream"
import shelljs from 'shelljs';
import StaticType from "base/StaticType";

export interface GitlabServiceInterface {
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

    async downloadRepo(props: GitlabServiceInterface) {
        try {
            mkdirSync(props.download_path, { recursive: true });
            return new Promise(async (resolve: Function, reject: Function) => {
                let infoJSON = shelljs.cat(props.download_path + "/info.json").stdout;
                try {
                    infoJSON = JSON.parse(infoJSON)
                } catch (ex) {
                    infoJSON = null;
                }
                // console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaa", props);
                let commitData = null;
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

                    shelljs.exec(`rm -R ${destinationDirectory} || true`);
                    shelljs.exec(`mkdir ${destinationDirectory} || true`);
                    shelljs.exec(`ls -a -l ${props.download_path} || true`);

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
                    const sshCommand = `ssh -i "$(pwd)/${privateKeyPath.replace("./", "")}" -o StrictHostKeyChecking=no`;
                    const gitCloneCommand = `GIT_SSH_COMMAND="${sshCommand}" git clone --depth=1 --recursive -b ${props.branch} ${gitRepositoryUrl} ${destinationDirectory}`;
                    console.log("gitCloneCommand :: ",gitCloneCommand);
                    shelljs.exec(gitCloneCommand);

                    resolve(destinationDirectory);
                } catch (error) {

                    console.error("shelljs err :: ", error);
                    return reject(error);
                }
                // try {
                //     commitData = await this.getCommit(props);
                // } catch (ex) {
                //     console.log("error - ", ex);
                // }
                // try {
                //     if (existsSync(props.download_path + "/" + props.branch) == true) {
                //         shelljs.exec(`rm -R ${props.download_path}/${props.branch} || true`);
                //     }
                //     // Set the custom private key path
                //     const privateKeyPath = props.private_key;

                //     // Set the Git repository URL
                //     const gitRepositoryUrl = props.;

                //     // Set the clone destination directory
                //     const destinationDirectory = '/home/donny/test';

                //     // Set the environment variable for the private key
                //     process.env.GIT_SSH_COMMAND = `ssh -i ${privateKeyPath}`;

                //     // Clone the Git repository
                //     shelljs.exec(`git clone ${gitRepositoryUrl} ${destinationDirectory}`);
                // } catch (ex) {
                //     return reject(ex);
                // }

            })
        } catch (ex) {
            throw ex;
        }
    }
}