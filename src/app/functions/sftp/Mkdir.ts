import path from "path"
import SFTP from "ssh2-promise/lib/sftp"
import upath from "upath";
/**
 * Recursively create a remote directory if no such directory exists
 *
 * @param sftp SFTP connection
 * @param path Directory to create
 */
const MkdirReqursive = async (sftp: SFTP, pathString: string): Promise<void> => {
  // https://stackoverflow.com/a/60922162/132319
  await pathString.split('/').reduce(async (promise, dir) => {
    return promise.then(async (parent) => {
      let ret = path.join(parent, dir)
      ret = upath.normalize("/" + ret);
      console.log("MkdirReqursive - stat ::: ", upath.normalize("/" + ret));
      try {
        await sftp.stat(ret)
      } catch (e: any) {
        console.log("MkdirReqursive - ex ::: ", e);
        if (e.code === 2) {
          // path not found
          try {
            console.log("MkdirReqursive - mkdir ::: ", ret);
            await sftp.mkdir(ret)
          } catch (e) {
            throw e
          }
        } else {
          throw e
        }
      }
      return ret
    })
  }, Promise.resolve(''))
}

export default MkdirReqursive;