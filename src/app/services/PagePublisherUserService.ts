import Sqlbricks from "@root/tool/SqlBricks"
import CreateDate from "../functions/base/CreateDate"
import SafeValue from "../functions/base/SafeValue"
import SqlService from "./SqlService"
import bcrypt from 'bcrypt';

export interface PagePublisherUserInterface {
  id?: number
  page_publisher_id?: number
  user_id?: number
  email?: string
  secret_code?: string
  privileges?: string
  deleted_at?: string
  created_at?: string
  updated_at?: string
}

export interface PagePublisherUserServiceInterface extends PagePublisherUserInterface {

}

const returnFactoryColumn = async (props: PagePublisherUserServiceInterface) => {
  return props;
}

const preSelectQuery = () => {
  Sqlbricks.aliasExpansions({
    'pagepub': "page_publishers",
    'pagepub_user': "page_publisher_users",
  });
  let query = Sqlbricks.select(
    "pagepub_user.page_publisher_id as page_publisher_id",
    "pagepub_user.id as id",
    "pagepub_user.user_id as user_id",
    "pagepub_user.email as email",
    "pagepub_user.secret_code as secret_code",
    "pagepub_user.privileges as privileges",
    "pagepub.table_id as pagepub_table_id",
    "pagepub.page_name as pagepub_page_name",
  ).from("pagepub_user").leftJoin("pagepub").on({
    "pagepub.id": "pagepub_user.page_publisher_id"
  });

  return query;
}

const PagePublisherUserService = {
  async addPagePublisherUser(props: PagePublisherUserInterface) {
    try {
      let queryInsert = Sqlbricks.insert("page_publisher_users", CreateDate({
        id: props.id,
        user_id: props.user_id,
        email: props.email,
        page_publisher_id: props.page_publisher_id,
      }));
      let resData = await SqlService.insert(queryInsert.toString());
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async updatePagePublisherUser(props: PagePublisherUserInterface) {

  },
  async registerSecretCodeByPublisherId_ByEmail(page_publisher_id: number, email: string, secret_code: string) {
    try {
      let existPagePub: PagePublisherUserInterface = await this.getPagePublisherUserByPagePublisherId_ByEmail(page_publisher_id, email) as any;

      if (existPagePub == null) {
        throw new Error("Data is not found!");
      }
      let queryUpdate = Sqlbricks.update("page_publisher_users", CreateDate({
        secret_code: SafeValue(secret_code, existPagePub.secret_code)
      }));
      queryUpdate.where("email", email);
      queryUpdate.where("page_publisher_id", page_publisher_id)
      let resData = await SqlService.update(queryUpdate.toString());
      resData = this.getPagePublisherUserById(existPagePub.id);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getPagePublisherUserByPagePublisherId_ByUserId(page_publisher_id: number, id: number) {
    try {
      let querySelect = preSelectQuery();
      querySelect.where("pagepub_user.user_id", id);
      querySelect.where("pagepub_user.page_publisher_id", page_publisher_id);
      let resData = await SqlService.selectOne(querySelect.toString());
      if (resData == null) return;
      resData = await returnFactoryColumn(resData);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getPagePublisherUserById(id: number) {
    try {
      let querySelect = preSelectQuery();
      querySelect.where("pagepub_user.id", id);
      let resData = await SqlService.selectOne(querySelect.toString());
      if (resData == null) return;
      resData = await returnFactoryColumn(resData);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async getPagePublisherUserByPagePublisherId_ByEmail(page_publisher_id: number, email: string) {
    try {
      let querySelect = preSelectQuery();
      querySelect.where("pagepub_user.email", email);
      querySelect.where("pagepub_user.page_publisher_id", page_publisher_id);
      let resData = await SqlService.selectOne(querySelect.toString());
      if (resData == null) return;
      resData = await returnFactoryColumn(resData);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  getPagePublisherUserById_UserId(id: number, user_id: number) {

  },
  async getPagePublisherUsersByPagePublisherId(page_publisher_id: number) {
    try {
      let querySelect = preSelectQuery();
      querySelect.where("pagepub_user.page_publisher_id", page_publisher_id);
      let resData = await SqlService.select(querySelect.toString());
      for (var a = 0; a < resData.length; a++) {
        resData[a] = await returnFactoryColumn(resData[a]);
      }
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  deletesPagePublisherUserById_UserId(ids: Array<number>, user_id: number) {

  },
  clearPagePublisherUserByPublisherId(publisher_id: number) {
    try {
      let queryClear = Sqlbricks.deleteFrom("page_publisher_users");
      queryClear.where("page_publisher_id", publisher_id);
      return SqlService.delete(queryClear.toString());
    } catch (ex) {
      throw ex;
    }
  },
  requestPin: async function () {
    try {
      let pin_code = (Math.random() + 1).toString(36).substring(6);
      let secret_code = await bcrypt.hash(pin_code, 10);
      return {
        pin_code,
        secret_code
      }
    } catch (ex) {
      throw ex;
    }
  },
  validatePin: async function (page_publisher_id: number, email: string, pin_code: string) {
    try {
      let resData = await this.getPagePublisherUserByPagePublisherId_ByEmail(page_publisher_id, email);
      let resPassword = await bcrypt.compare(pin_code, resData.secret_code);
      if (resPassword == false) {
        throw new Error("Wrong pin code or email address!");
      }
      delete resData.secret_code;
      return resData;
    } catch (ex) {
      throw ex;
    }
  }
}

export default PagePublisherUserService;