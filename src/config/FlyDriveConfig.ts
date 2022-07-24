import DotEnv from "../tool/DotEnv";

export interface FlyDriveInterface {
  FLY_DRIVE_DRIVER: string
  FLY_DRIVE_BASE_PATH: string
}

export default ({
  FLY_DRIVE_DRIVER: DotEnv.FLY_DRIVE_DRIVER,
  FLY_DRIVE_BASE_PATH: process.cwd() + '/storage/app/files'
} as FlyDriveInterface);