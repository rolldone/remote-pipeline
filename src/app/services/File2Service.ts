import SqlBricks from "@root/tool/SqlBricks/index"
import { StorageManager } from "@slynova/flydrive"
import CreateDate from "../functions/base/CreateDate"
import SqlService from "./SqlService"
import upath from 'upath';
import { readFileSync, rmdirSync } from "fs";
import FlyDriveConfig from "@root/config/FlyDriveConfig";
import mimeType from 'mime-types';

export interface File2Interface {
  id?: number
  name?: string
  type?: string
  size?: string | number
  status?: string
  path?: string
  user_id?: number
  url_path?: string
  url_origin_path?: string
  created_at?: string
  deleted_at?: string
  updated_at?: string


  temp_name?: string
  temp_path?: string

}


export interface File2InterfaceService extends File2Interface {

  filter?: boolean
  group_by?: string
  search?: string
}

const STATUS = {
  'PRIVATE': 1,
  'PUBLIC': 2,
  'GROUP': 3,
  'GROUP_PUBLIC': 4
}

declare let storage: StorageManager;

const transformData = (props: File2Interface) => {
  props.url_path = upath.normalize(props.user_id + "/" + props.path + "/" + props.name);
  try {
    props.url_origin_path = storage.disk("").getUrl(props.url_path);
  } catch (ex) {
    // Method not support
    props.url_origin_path = props.url_path;
  }
  return props;
}

const preSelectQuery = () => {
  SqlBricks.aliasExpansions({
    'usr': "users",
    'file': "files"
  });
  let query = SqlBricks.select(
    'usr.id as usr_id',
    'usr.first_name as usr_first_name',
    'usr.last_name as usr_last_name',
    'file.id as id',
    'file.name as name',
    'file.type as type',
    'file.size as size',
    'file.status as status',
    'file.path as path',
    'file.user_id as user_id',
    'file.created_at as created_at',
    'file.updated_at as updated_at',
    'file.deleted_at as deleted_at',
  ).from("file");
  return query;
}

export default {
  STATUS,
  // This is create from raw data
  async create(props?: File2Interface, content?: any) {
    try {
      let _ingoreFile = ''
      if (props.type == "directory") {
        _ingoreFile = "_ignore"
      }
      let destPath = upath.normalize(`${props.user_id}/${props.path}/${props.name}/${_ingoreFile}`);
      await storage.disk("").put(destPath, content);

      // Get stats file
      let { size, modified, raw } = await storage.disk("").getStat(destPath);

      props.size = size;

      let resData = await this.getFileByNamePath_UserId(props.name, props.path, props.user_id);

      // If exist update it
      if (resData != null) {
        let query = SqlBricks.update("files", CreateDate({
          name: props.name,
          type: props.type,
          size: props.size,
          status: props.status,
          path: props.path,
          user_id: props.user_id,
        }));
        query.where("id", resData.id);
        let resUpdate = await SqlService.update(query.toString());
        resData = await this.getFileById(resData.id);
      } else {
        // Null create new
        let query = SqlBricks.insert("files", CreateDate({
          name: props.name,
          type: props.type,
          size: props.size,
          status: props.status,
          path: props.path,
          user_id: props.user_id,
        }));
        let resInsertId = await SqlService.insert(query.toString());
        resData = await this.getFileById(resInsertId);
      }

      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  // This is create from url post data
  async uploadFile(props?: File2Interface) {
    try {
      let destPath = upath.normalize(`${props.user_id}/${props.path}/${props.name}`);

      // Delete old file first if exist
      try {
        await storage.disk("").delete(destPath);
      } catch (ex) {
        console.log("uploadFile - storage.disk().delete(destPath) :: ", ex);
      }
      let directory = upath.dirname(upath.normalize(`${props.path}/${props.name}`));
      await this.addDir({
        user_id: props.user_id,
        path: directory,
        name: "",
        type: "directory",
        status: props.status
      });
      // Move the file
      await storage.disk("").move(upath.normalize(props.temp_path + "/" + props.temp_name), destPath);

      // Get stats file
      let { size, modified, raw } = await storage.disk("").getStat(destPath);

      props.size = size;
      props.path = upath.normalize("/" + props.path)
      let resData = await this.getFileByNamePath_UserId(props.name, props.path, props.user_id);
      // If exist update it
      if (resData != null) {
        let query = SqlBricks.update("files", CreateDate({
          name: props.name,
          type: props.type,
          size: props.size,
          status: props.status,
          path: props.path,
          user_id: props.user_id,
        }));
        query.where("id", resData.id);
        let resUpdate = await SqlService.update(query.toString());
        resData = await this.getFileById(resData.id);
      } else {
        // If null create new
        let query = SqlBricks.insert("files", CreateDate({
          name: props.name,
          type: props.type,
          size: props.size,
          status: props.status,
          path: props.path,
          user_id: props.user_id,
        }));
        let resInsertId = await SqlService.insert(query.toString());
        resData = await this.getFileById(resInsertId);
      }
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async addDir(props?: File2Interface) {
    try {
      // Create a directory first
      let arrayPath = props.path.split("/");
      let newPath = "";
      let lastCreated = null;
      for (let a = 0; a < arrayPath.length; a++) {
        newPath = newPath + (arrayPath[a - 1] || '') + "/";
        // if (newPath == "/") {
        //   newPath = "";
        // }
        if (arrayPath[a] == "") { }
        else {
          lastCreated = await this.create({
            name: arrayPath[a],
            type: "directory",
            size: '',
            status: props.status,
            path: upath.normalize(newPath),
            user_id: props.user_id,
          }, "")
        }
      }
      // IF props.name empty just get last created
      if (props.name == "") {
        return lastCreated;
      }
      return this.create({
        name: props.name,
        type: props.type,
        size: props.size,
        status: props.status,
        path: upath.normalize("/" + (upath.normalize(props.path) == "." ? "" : upath.normalize(props.path))),
        user_id: props.user_id,
      }, "")
    } catch (ex) {
      throw ex;
    }
  },
  // This is good if use for get name path and user id without id
  async getFileByNamePath_UserId(name, path, user_id) {
    try {
      let query = preSelectQuery();
      query = query.leftJoin('usr').on({
        "usr.id": "file.user_id"
      });
      query.where("file.name", name);
      query.where("file.path", path);
      query.where("file.user_id", user_id);
      let resData = await SqlService.selectOne(query.toString());
      if (resData == null) return;
      return transformData(resData);
    } catch (ex) {
      throw ex;
    }
  },
  // Must called by system 2 system, Dont use call on controller
  async getFileById(id): Promise<File2Interface> {
    try {
      let query = preSelectQuery();
      query = query.leftJoin('usr').on({
        "usr.id": "file.user_id"
      });
      query.where("file.id", id);
      let resData = await SqlService.selectOne(query.toString());
      if (resData == null) return null;
      return transformData(resData);
    } catch (ex) {
      throw ex;
    }
  },
  async getFileById_UserId(id: number, user_id: number): Promise<File2Interface> {
    try {
      let query = preSelectQuery();
      query = query.leftJoin('usr').on({
        "usr.id": "file.user_id"
      });
      query.where("file.id", id);
      query.where("file.user_id", user_id);
      let resData = await SqlService.selectOne(query.toString());
      return transformData(resData);
    } catch (ex) {
      throw ex;
    }
  },
  async getFiles(props?: File2InterfaceService): Promise<Array<File2Interface>> {
    try {
      let query = preSelectQuery();
      query = query.leftJoin('usr').on({
        "usr.id": "file.user_id"
      });
      query.where("file.user_id", props.user_id);

      if (props.filter != null) {
        let _filter = props.filter as any;
        if (_filter.group_by != null && _filter.group_by == "directory") {
          query.where("file.type", _filter.group_by);
        } else if (_filter.group_by != null && _filter.group_by == "file") {
          query.where(SqlBricks.notEq("file.type", "directory"));
        }
        if (_filter.search != null && _filter.search != "") {
          query.where(SqlBricks.like("file.name", `%${_filter.search}%`));
        } else {
          query.where(SqlBricks.or(
            { "file.path": upath.normalize("/" + props.path) },
            { "file.path": upath.normalize("/" + props.path + "/") },
            { "file.path": upath.normalize(props.path) }
          ));
        }
        //   if (props.search != null && props.search == "") {
        //     query.where(SqlBricks.or({ "file.path": upath.normalize("/" + props.path) }, { "file.path": props.path }));
        //   }
        // } else {
        //   query.where(SqlBricks.or({ "file.path": upath.normalize("/" + props.path) }, { "file.path": props.path }));
      } else {
        query.where(SqlBricks.or({ "file.path": upath.normalize("/" + props.path) }, { "file.path": upath.normalize("/" + props.path + "/") }));
      }

      query.orderBy("file.type <> 'directory'");
      query.orderBy("file.type ASC");
      query.orderBy("file.id DESC");


      let resDatas = await SqlService.select(query.toString());
      for (let i in resDatas) {
        resDatas[i] = transformData(resDatas[i]);
      }
      return resDatas;
    } catch (ex) {
      throw ex;
    }
  },
  async removeByPathLike_UserId(pathLike: string, user_id: number) {
    try {
      let query = SqlBricks.deleteFrom("files");
      query.where(SqlBricks.like('path', `${pathLike}%`));
      query.where("user_id", user_id);
      let resData = await SqlService.delete(query.toString());
    } catch (ex) {
      throw ex;
    }
  },
  async updateByPathLike_UserId(pathLike: string, to: string, user_id: number) {
    try {
      let query = SqlBricks.select("*").from("files");
      query.where(SqlBricks.like('path', upath.normalize(`/${pathLike}%`)));
      query.where("user_id", user_id);
      let resData = await SqlService.select(query.toString());

      for (let a = 0; a < resData.length; a++) {
        resData[a].path = resData[a].path.replace(pathLike, to);
        let exist = await this.getFileByNamePath_UserId(resData[a].name, resData[a].path, user_id);
        if (exist == null) {
          let queryUpdate = SqlBricks.update("files", {
            path: resData[a].path
          });
          queryUpdate.where("id", resData[a].id);
          queryUpdate.where("user_id", user_id);
          await SqlService.update(queryUpdate.toString());
        } else {
          let queryDelete = SqlBricks.deleteFrom("files");
          queryDelete.where("id", exist.id);
          queryDelete.where("user_id", user_id);
          await SqlService.delete(queryDelete.toString());
        }
      }
    } catch (ex) {
      throw ex;
    }
  },
  async insertByPathLike_UserId(pathLike: string, to: string, user_id: number) {
    try {
      let query = SqlBricks.select("*").from("files");
      query.where(SqlBricks.like('path', upath.normalize(`/${pathLike}%`)));
      query.where("user_id", user_id);
      let resData = await SqlService.select(query.toString());
      for (let a = 0; a < resData.length; a++) {
        console.log("before :: ", resData[a].path)
        resData[a].path = resData[a].path.replace(pathLike, to);
        console.log("after :: ", resData[a].path)
        delete resData[a].id;
        let existAtTarget = await this.getFileByNamePath_UserId(resData[a].name, resData[a].path, user_id);
        if (existAtTarget != null) {
          console.log("insertByPathLike_UserId - exist :: ", existAtTarget);
        } else {
          let queryUpdate = SqlBricks.insert("files", {
            ...resData[a],
            path: resData[a].path
          });
          await SqlService.insert(queryUpdate.toString());
        }
      }
    } catch (ex) {
      throw ex;
    }
  },
  async removeById_UserId(id: number, user_id: number) {
    try {
      let resData = await this.getFileById_UserId(id, user_id);
      if (resData == null) {
        throw new Error("The data is not found!");
      }

      let props = resData;

      let plan_destPah = upath.normalize(`${props.path}/${props.name}`)
      let destPath = upath.normalize(`${props.user_id}/${plan_destPah}`);

      if (resData.type == "directory") {
        switch (FlyDriveConfig.FLY_DRIVE_DRIVER) {
          case 'local':
            try {
              rmdirSync(FlyDriveConfig.FLY_DRIVE_BASE_PATH + "/" + destPath, { recursive: true })
            } catch (ex) { }
            break;
          default:
            try {
              storage.disk("").delete(destPath);
            } catch (ex) { }
            break;
        }
        let query = SqlBricks.deleteFrom("files");
        query.where("id", props.id);
        resData = await SqlService.delete(query.toString());
        let resDataDelete = await this.removeByPathLike_UserId(`${plan_destPah}`, props.user_id);
        return resData;
      }

      try {
        await storage.disk("").delete(destPath);
      } catch (ex) { }

      let query = SqlBricks.deleteFrom("files");
      query.where("id", props.id);
      resData = await SqlService.delete(query.toString());
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async moveById_UserId(id: number, to: string, user_id: number) {
    try {
      let resData = await this.getFileById_UserId(id, user_id);
      if (resData == null) {
        throw new Error("Data is not found");
      }

      let plan_fromPath = upath.normalize(`${resData.path}/${resData.name}`)
      let plan_destPah = upath.normalize(`${to}/${resData.name}`)
      let fromPath = upath.normalize(`/${user_id}/${plan_fromPath}`);
      let destPath = upath.normalize(`/${user_id}/${plan_destPah}`);

      if (fromPath == destPath) {
        throw new Error("You cannot move with same path");
      }

      try {
        await storage.disk(FlyDriveConfig.FLY_DRIVE_DRIVER).copy(fromPath, destPath);
        switch (FlyDriveConfig.FLY_DRIVE_DRIVER) {
          case 'local':
            try {
              rmdirSync(upath.normalize(FlyDriveConfig.FLY_DRIVE_BASE_PATH + "/" + fromPath), { recursive: true })
            } catch (ex) { }
            break;
          default:
            try {
              await storage.disk("").delete(fromPath);
            } catch (ex) { }
            break;
        }
      } catch (ex) {
        console.log("Error ignored :: ");
        console.log("storage dist move - ex :: ", ex);
      }

      if (resData.type == "directory") {
        await this.updateByPathLike_UserId(upath.normalize(`${plan_fromPath}`), upath.normalize(`/${plan_destPah}`), user_id);
      }

      let existData = await this.getFileByNamePath_UserId(resData.name, upath.normalize(`/${to}`), user_id);
      if (existData == null) {
      } else {
        // Delete from path id
        let queryDelete = SqlBricks.deleteFrom("files").where("id", resData.id);
        await SqlService.delete(queryDelete.toString());
      }

      let query = SqlBricks.update("files", {
        path: upath.normalize(`/${to}`)
      })
      query.where("id", id);
      resData = await SqlService.update(query.toString());
      return this.getFileById(id);
    } catch (ex) {
      throw ex;
    }
  },
  async copyById_UserId(id: number, to: string, user_id: number) {
    try {
      let resData = await this.getFileById_UserId(id, user_id);
      if (resData == null) {
        throw new Error("Data is not found");
      }

      let plan_fromPath = upath.normalize(`${resData.path}/${resData.name}`)
      let plan_destPah = upath.normalize(`${to}/${resData.name}`)
      let fromPath = upath.normalize(`${user_id}/${plan_fromPath}`);
      let destPath = upath.normalize(`${user_id}/${plan_destPah}`);

      if (fromPath == destPath) {
        throw new Error("You cannot copy with same path");
      }

      try {
        await storage.disk("").copy(fromPath, destPath);
      } catch (ex) {
        console.log("Error ignored :: ");
        console.log("storage dist copy - ex :: ", ex);
      }

      if (resData.type == "directory") {
        await this.insertByPathLike_UserId(upath.normalize(`${plan_fromPath}`), upath.normalize(`/${plan_destPah}`), user_id);
      }

      // Target to copy
      let existData = await this.getFileByNamePath_UserId(resData.name, upath.normalize(`/${to}`), user_id);

      if (existData == null) {
        let query = SqlBricks.insert("files", CreateDate({
          name: resData.name,
          type: resData.type,
          size: resData.size,
          status: resData.status,
          user_id: resData.user_id,
          path: upath.normalize(`/${to}`)
        }))
        resData = await SqlService.insert(query.toString());
      } else {
        // Delete target copy first and update the from to be new target
        // let queryDelete = SqlBricks.deleteFrom("files");
        // queryDelete.where("id", existData.id);
        // resData = await SqlService.delete(queryDelete.toString());
        // await this.removeById_UserId(existData.id, user_id);
        let query = SqlBricks.update("files", CreateDate({
          name: resData.name,
          type: resData.type,
          size: resData.size,
          status: resData.status,
          user_id: resData.user_id,
          path: upath.normalize(`/${to}`)
        }))
        query.where("id", existData.id);
        resData = await SqlService.update(query.toString());
      }
      return this.getFileById(id);
    } catch (ex) {
      throw ex;
    }
  },
  async duplicateById_UserId(id: number, user_id: number) {
    try {
      let resData = await this.getFileById_UserId(id, user_id);
      if (resData == null) {
        throw new Error("Data is not found");
      }
      let randomString = (Math.random() + 1).toString(36).substring(3);
      let plan_name = `${randomString}_${resData.name}`;
      let plan_fromPath = upath.normalize(`${resData.path}/${resData.name}`);
      let plan_desPath = upath.normalize(`${resData.path}/${plan_name}`);
      let fromPath = upath.normalize(`${user_id}/${plan_fromPath}`);
      let destPath = upath.normalize(`${user_id}/${plan_desPath}`);

      if (fromPath == destPath) {
        throw new Error("You cannot copy with same path");
      }

      try {
        await storage.disk("").copy(fromPath, destPath);
      } catch (ex) {
        console.log("Error ignored :: ");
        console.log("storage dist duplicate - ex :: ", ex);
      }

      if (resData.type == "directory") {
        await this.insertByPathLike_UserId(upath.normalize(`${plan_fromPath}`), upath.normalize(`/${plan_desPath}`), user_id);
      }

      // Target to copy
      let query = SqlBricks.insert("files", CreateDate({
        name: plan_name,
        type: resData.type,
        size: resData.size,
        status: resData.status,
        user_id: resData.user_id,
        path: upath.normalize(`/${resData.path}`)
      }));

      resData = await SqlService.insert(query.toString());
      return this.getFileById(id);
    } catch (ex) {
      throw ex;
    }
  },
  async renameById_UserId(newName: string, id: number, user_id: number) {
    try {
      let existData = await this.getFileById_UserId(id, user_id);
      if (existData == null) {
        throw new Error("Data is not found!");
      }

      let plan_name = `${newName}`;
      let plan_fromPath = upath.normalize(`${existData.path}/${existData.name}`);
      let plan_desPath = upath.normalize(`${existData.path}/${plan_name}`);
      let fromPath = upath.normalize(`${user_id}/${plan_fromPath}`);
      let destPath = upath.normalize(`${user_id}/${plan_desPath}`);

      try {
        await storage.disk("").copy(fromPath, destPath);
        switch (FlyDriveConfig.FLY_DRIVE_DRIVER) {
          case 'local':
            try {
              rmdirSync(upath.normalize(FlyDriveConfig.FLY_DRIVE_BASE_PATH + "/" + fromPath), { recursive: true })
            } catch (ex) { }
            break;
          default:
            try {
              await storage.disk("").delete(fromPath);
            } catch (ex) { }
            break;
        }
      } catch (ex) {
        console.log("Error ignored :: ");
        console.log("storage rename copy - ex :: ", ex);
      }

      if (existData.type == "directory") {
        await this.updateByPathLike_UserId(upath.normalize(`${plan_fromPath}`), upath.normalize(`/${plan_desPath}`), user_id);
      }

      let query = SqlBricks.update("files", {
        name: newName
      });

      query.where("id", id);
      query.where("user_id", user_id);

      let resData = await SqlService.update(query.toString());
      return this.getFileById(id);
    } catch (ex) {
      throw ex;
    }
  },
  getFile: async function (file_id: number, user_id: number): Promise<{
    mime: string | boolean
    data: Buffer,
    full_path: string
  }> {
    try {
      let queueDetailData = await this.getFileById_UserId(file_id, user_id);
      if (queueDetailData == null) {
        throw new Error("Job is not found!");
      }
      let path = queueDetailData.url_path;
      // If you prefer, you can also use promises
      let _mimeType = mimeType.lookup(process.cwd() + "/storage/app/files/" + path);
      let _file = readFileSync(process.cwd() + "/storage/app/files/" + path);
      return {
        mime: _mimeType,
        data: _file,
        full_path: process.cwd() + "/storage/app/files/" + path
      }
    } catch (ex) {
      throw ex;
    }
  },
}