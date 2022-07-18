import { Moment } from "@root/tool";
import PersonalAccessTokenService, { PersonalAccessTokenInterface } from "../services/PersonalAccessTokenService";
import UserService from "../services/UserService";

export default function (req): Promise<any> {
  if (req.headers.authorization) {
    return new Promise(async (resolve, reject) => {
      try {
        let api_key: string = req.headers.authorization.replace("Bearer ", "");
        api_key = api_key.replace(" ", "");
        let keyCom = api_key.split(";");
        console.log("keyCom :: ", keyCom);
        let psTokenData: PersonalAccessTokenInterface = await PersonalAccessTokenService.getPersonalAccessTokenByApiKey(keyCom[0], keyCom[1]);
        if (psTokenData == null) {
          return reject("The token is not valid or expired");
        }
        
        if(psTokenData.expired_date != null || psTokenData.expired_date != ""){
          console.log("psTokenData.expired_date :: ", Moment(psTokenData.expired_date, "YYYY-MM-DD"))
          if (Moment(psTokenData.expired_date, "YYYY-MM-DD") < Moment()) {
            return reject("The token is expired");
          }
        }

        let user = await UserService.getUser({
          id: psTokenData.user_id
        })
        resolve(user);
      } catch (ex) {
        reject(ex);
      }
    })
  }

  if (req.session.user) {
    return req.session.user;
  }
}