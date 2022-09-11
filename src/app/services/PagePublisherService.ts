import Sqlbricks from "@root/tool/SqlBricks";
import CreateDate from "../functions/base/CreateDate";
import SafeValue from "../functions/base/SafeValue";
import PagePublisherUserService from "./PagePublisherUserService";
import SqlService from "./SqlService";

export interface PagePublisherInterface {
  id?: number
  page_name?: string
  table_id?: string
  user_id?: number
  share_mode?: string
  privileges?: any
  data?: any
  deleted_at?: string
  created_at?: string
  updated_at?: string
}

export interface PagePublisherServiceInterface extends PagePublisherInterface {

  users?: Array<any>
}

const returnFactoryColumn = async (props: PagePublisherServiceInterface) => {
  props.users = await PagePublisherUserService.getPagePublisherUsersByPagePublisherId(props.id);
  return props;
}

const preSelectQuery = () => {
  Sqlbricks.aliasExpansions({
    'pagepub': "page_publishers",
    'user': "users",
  });
  let query = Sqlbricks.select(
    "pagepub.page_name as page_name",
    "pagepub.id as id",
    "pagepub.table_id as table_id",
    "pagepub.share_mode as share_mode",
    "pagepub.privileges as privileges",
    "pagepub.data as data",
    "pagepub.created_at as created_at",
    "pagepub.updated_at as updated_at",
    "user.email as user_email"
  ).from("pagepub").leftJoin("user").on({
    "user.id": "pagepub.user_id"
  });

  return query;
}

const PagePublisherService = {
  async addPagePublisher(props: PagePublisherInterface) {
    try {
      let queryInsert = Sqlbricks.insert("page_publishers", CreateDate({
        id: props.id,
        page_name: props.page_name,
        table_id: props.table_id,
        share_mode: props.share_mode,
        privileges: JSON.stringify(SafeValue(props.privileges, [])),
        user_id: props.user_id,
        data: JSON.stringify(SafeValue(props.data, {})),
      }));
      let resDataid = await SqlService.insert(queryInsert.toString());
      let resData = await this.getPagePublisherById(resDataid);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async updatePagePublisher(props: PagePublisherInterface) {
    try {
      let existPagePub: PagePublisherInterface = await this.getPagePublisherById_UserId(props.id, props.user_id) as any;

      if (existPagePub == null) {
        throw new Error("Data is not found!");
      }

      let queryInsert = Sqlbricks.update("page_publishers", CreateDate({
        id: props.id,
        page_name: props.page_name,
        table_id: props.table_id,
        share_mode: props.share_mode,
        privileges: JSON.stringify(SafeValue(props.privileges, [])),
        user_id: props.user_id,
        data: JSON.stringify(SafeValue(props.data, {})),
      }));

      queryInsert.where("id", props.id);
      let resData = await SqlService.update(queryInsert.toString());
      resData = await this.getPagePublisherById(props.id);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getPagePublisherByPageNameTableID(page_name: string, table_id: number) {
    try {
      let querySelect = preSelectQuery();
      querySelect.where("pagepub.page_name", page_name);
      querySelect.where("pagepub.table_id", table_id);
      let resData = await SqlService.selectOne(querySelect.toString());
      if (resData == null) {
        return;
      }
      resData = await returnFactoryColumn(resData);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getPagePublisherById(id: number) {
    try {
      let querySelect = preSelectQuery();
      querySelect.where("pagepub.id", id);
      let resData = await SqlService.selectOne(querySelect.toString());
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getPagePublisherById_UserId(id: number, user_id: number) {
    try {
      let querySelect = preSelectQuery();
      querySelect.where("pagepub.id", id);
      querySelect.where("pagepub.user_id", user_id);
      let resData = await SqlService.selectOne(querySelect.toString());
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  getPagePublishers(props: PagePublisherServiceInterface) {

  },
  deletesPagePublishersByIds_UserId(ids: Array<number>, user_id: number) {

  }
}

export default PagePublisherService;