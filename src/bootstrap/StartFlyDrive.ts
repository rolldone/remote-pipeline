
import { StorageManager } from '@slynova/flydrive';
import FlyDriveConfig from "@root/config/FlyDriveConfig";
import upath from 'upath';


/* Share master data */
export default function (next: Function) {
  let promise = () => {
    const storage = new StorageManager({
      default: FlyDriveConfig.FLY_DRIVE_DRIVER,
      disks: {
        local: {
          driver: 'local',
          config: {
            root: FlyDriveConfig.FLY_DRIVE_BASE_PATH,
          },
        },

        s3: {
          driver: 's3',
          config: {
            key: 'AWS_S3_KEY',
            secret: 'AWS_S3_SECRET',
            region: 'AWS_S3_REGION',
            bucket: 'AWS_S3_BUCKET',
          },
        },

        spaces: {
          driver: 's3',
          config: {
            key: 'SPACES_KEY',
            secret: 'SPACES_SECRET',
            endpoint: 'SPACES_ENDPOINT',
            bucket: 'SPACES_BUCKET',
            region: 'SPACES_REGION',
          },
        },

        gcs: {
          driver: 'gcs',
          config: {
            keyFilename: 'GCS_KEY',
            bucket: 'GCS_BUCKET',
          },
        },
      },
    })
    global.storage = storage;
    storage.disk('local').put("test.txt","Hello World");
    next();
  }

  promise();
}