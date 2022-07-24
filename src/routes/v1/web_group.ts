import multer from 'multer';
import { FlydriveStorageEngine, MulterFlydriveOptionsFunction } from 'multer-flydrive-engine';
import { StorageManager } from "@slynova/flydrive";
import GetAuthUser from "@root/app/functions/GetAuthUser";

declare let storage: StorageManager;

const storageTempUseFlyDrive = new FlydriveStorageEngine({
  async disk(req, file) {
    return storage.disk();// req.query.dest === 's3' ? storage.disk('s3') : storage.disk('local');
  },
  async destination(req, file) {
    let user = await GetAuthUser(req);
    let path = user.id+"/[your-group-name]/"
    return '';
  },
  filename(req, file) {
    let gg = file.originalname as any;
    req.file = file;
    return gg; // file.fieldname + '-' + Date.now();
  }
})

const upload2 = multer({
  storage: storageTempUseFlyDrive
})

export default {}