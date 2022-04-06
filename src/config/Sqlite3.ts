import DotEnv from "../tool/DotEnv";

export interface SqliteConfig{
  DB_NAME : string
}

export default ({
  DB_NAME : DotEnv.DB_NAME
} as SqliteConfig);