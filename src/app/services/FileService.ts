
import fs, { existsSync } from 'fs';
import upath from 'upath';
import { fsyncSync } from "fs";

const FileService = {
  removeFile(delete_path: string) {
    try {
      if (fs.existsSync(delete_path) == false) {
        return ("All ready deleted!");
      }
      fs.unlinkSync(delete_path);
      return "Delete Success!";
    } catch (ex) {
      throw ex;
    }
  },
  moveFile(from_path: string, to_path: string) {
    try {
      let folder = upath.parse(to_path);
      if (fs.existsSync(from_path) == false) {
        return ("Not exist!");
      }
      if (existsSync(folder.dir) == false) {
        fs.mkdirSync(folder.dir, { recursive: true });
      }
      fs.renameSync(from_path, to_path);
      return folder;
    } catch (ex) {
      throw ex;
    }
  },
}

export default FileService;