import PagePublisherService, { PagePublisherInterface } from "../services/PagePublisherService";
import PagePublisherUserService, { PagePublisherUserInterface } from "../services/PagePublisherUserService";

export const STATUS_RESPONSE = {
  NOT_ALLOWED: 1,
  IS_PRIVATE: 2,
  ALLOWED: 3,
  COMPARE_WITH_CURRENT_USER_ID: 4
}

const CheckTokenDataAuth = async (page_name: string, table_id: number, identity_value: any) => {
  try {
    let resData: PagePublisherInterface = await PagePublisherService.getPagePublisherByPageNameTableID(page_name, table_id);

    if (resData == null) {
      return STATUS_RESPONSE.IS_PRIVATE;
    }

    resData = await PagePublisherService.getPagePublisherByPageName_TableId_UserId(page_name, table_id, identity_value);
    console.log("resDaa", identity_value);
    if (resData != null) {
      return STATUS_RESPONSE.ALLOWED;
    }

    resData = await PagePublisherService.getPagePublisherByPageNameTableID(page_name, table_id);

    if (resData.share_mode == "private") {
      return STATUS_RESPONSE.IS_PRIVATE;
    }

    if (resData.share_mode == "public") {
      return STATUS_RESPONSE.ALLOWED;
    }

    let resDataUser: PagePublisherUserInterface = null;

    if (resData.share_mode == "specific") {
      console.log("resDaa", resData);
      resDataUser = await PagePublisherUserService.getPagePublisherUserById_UserId(resData.id, identity_value);
      
      console.log("resDataUser", resDataUser);
      if (resDataUser != null) {
        return STATUS_RESPONSE.ALLOWED;
      }
      resDataUser = await PagePublisherUserService.getPagePublisherUserByPagePublisherId_ByEmail(resData.id, identity_value)
      if (resDataUser != null) {
        return STATUS_RESPONSE.ALLOWED;
      }
    }

    return STATUS_RESPONSE.NOT_ALLOWED;
    
  } catch (ex) {
    throw ex;
  }
}

export default CheckTokenDataAuth;