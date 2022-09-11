import Sqlbricks from "@root/tool/SqlBricks"
import CreateDate from "../functions/base/CreateDate"
import SafeValue from "../functions/base/SafeValue"
import SqlService from "./SqlService"

export interface PagePublisherUserInterface {
  id?: number
  page_publisher_id?: number
  user_id?: number
  email?: string
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
    "pagepub_user.privileges as privileges"
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
  }
}

export default PagePublisherUserService;