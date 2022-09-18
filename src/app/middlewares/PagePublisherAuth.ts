import AppConfig from "@root/config/AppConfig";
import { safeJSON } from "@root/tool/Helpers";
import SafeValue from "../functions/base/SafeValue";
import CryptoData from "../functions/CryptoData";
import GetAuthUser from "../functions/GetAuthUser";
import PagePublisherService, { PagePublisherInterface } from "../services/PagePublisherService";
import PagePublisherUserService from "../services/PagePublisherUserService";
import QueueRecordDetailService, { QueueRecordDetailInterface } from "../services/QueueRecordDetailService";
import UserService from "../services/UserService";
import DashboardAuth from "./DashboardAuth";

const checkIncludeString = (pageUrl: string) => {
  let tableName = null;
  let theIdKey = null;
  switch (true) {
    case pageUrl.includes("/queue-record/job"):
      tableName = "queue_records";
      let job_id = pageUrl;
      theIdKey = job_id.substr(job_id.lastIndexOf('/') + 1);
      break;
    case pageUrl.includes("/file2"):
      tableName = "files";
      break;
  }
  return {
    tableName,
    theIdKey
  }
}

export default function (req, res, next) {
  let asyncFUn = async () => {
    try {
      let user = await GetAuthUser(req);
      let share_key = req.query.share_key;
      let dataParse = JSON.parse(SafeValue(await CryptoData.descryptData(share_key), '{}'));
      let identity_value = dataParse.identity_value;
      if (user.id == identity_value && identity_value != null) {
        return next();
      }
      let page_name = dataParse.page_name;
      let table_id = dataParse.table_id;
      let pubPageData: PagePublisherInterface = await PagePublisherService.getPagePublisherByPageNameTableID(page_name, table_id);
      if (pubPageData != null) {

        if (user.id == pubPageData.user_id) {
          return next();
        }

        if (pubPageData.share_mode == "public") {
          return next();
        }

        // For member initialize if open other link
        if (identity_value == null) {
          identity_value = user.id;
        }

        let pubUserPageData = await PagePublisherUserService.getPagePublisherUserByPagePublisherId_ByUserId(pubPageData.id, identity_value);
        if (pubUserPageData != null) {
          return next();
        }

        pubUserPageData = await PagePublisherUserService.getPagePublisherUserByPagePublisherId_ByEmail(pubPageData.id, identity_value);
        if (pubUserPageData != null) {
          return next();
        }
      }
      return res.redirect("/dashboard/login-page-publisher?redirect=" + (AppConfig.APP_PROTOCOL + '://' + req.get('host') + req.originalUrl));
    } catch (ex) {
      return res.status(400).send(ex);
    }
  }
  asyncFUn();
}