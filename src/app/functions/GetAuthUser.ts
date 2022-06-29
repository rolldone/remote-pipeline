import { Moment } from "@root/tool";
import PersonalAccessTokenService, { PersonalAccessTokenInterface } from "../services/PersonalAccessTokenService";
import UserService from "../services/UserService";

export default function (req): Promise<any> {
  if (req.headers.authorization) {
    return new Promise(async (resolve, reject) => {
      let api_key: string = req.headers.authorization.replace("Bearer ", "");
      api_key = api_key.replace(" ", "");
      let keyCom = api_key.split(";");
      console.log(keyCom);
      let psTokenData: PersonalAccessTokenInterface = await PersonalAccessTokenService.getPersonalAccessTokenByApiKey(keyCom[0], keyCom[1]);
      console.log("dsdd :: ", Moment(psTokenData.expired_date, "YYYY-MM-DD"))
      if (Moment(psTokenData.expired_date, "YYYY-MM-DD") < Moment()) {
        return reject("The token is expired");
      }
      let user = await UserService.getUser({
        id: psTokenData.id
      })
      resolve(user);
    })
  }

  if (req.session.user) {
    return req.session.user;
  }
}