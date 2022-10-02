import AppConfig from "@root/config/AppConfig";
import CheckTokenDataAuth, { STATUS_RESPONSE } from "../functions/CheckTokenDataAuth";
import GetAuthUser from "../functions/GetAuthUser";
import TokenDataService, { TokenDataInterface } from "../services/TokenDataService";

var stringConstructor = "test".constructor;
var arrayConstructor = [].constructor;
var objectConstructor = ({}).constructor;

function whatIsIt(object) {
  if (object === null) {
    return "null";
  }
  if (object === undefined) {
    return "undefined";
  }
  if (object.constructor === stringConstructor) {
    return "String";
  }
  if (object.constructor === arrayConstructor) {
    return "Array";
  }
  if (object.constructor === objectConstructor) {
    return "Object";
  }
  {
    return "don't know";
  }
}

const convertToReqData = (req, data) => {
  if (req.method == "POST") {
    // do form handling
    for (var key in data) {
      switch (whatIsIt(data[key])) {
        case 'Object':
        case 'Array':
          req.body[key] = JSON.stringify(data[key]);
          break;
        default:
          req.body[key] = data[key];
          break;
      }
    }
  }
  if (req.method == "GET") {
    // do form handling
    for (var key in data) {
      switch (whatIsIt(data[key])) {
        case 'Object':
        case 'Array':
          console.log("")
          req.query[key] = JSON.stringify(data[key]);
          break;
        default:
          req.query[key] = data[key];
          break;
      }
    }
  }
  // For params
  for (var key in data) {
    switch (whatIsIt(data[key])) {
      case 'Object':
      case 'Array':
        req.params[key] = JSON.stringify(data[key]);
        break;
      default:
        req.params[key] = data[key];
        break;
    }
  }
}

export const TOKEN_DATA_GUEST_MODE = {
  WITHOUT_AUTHENTICATION: 1,
  WITH_AUTHENTICATION: 2
  /* Other option mode maybe? */
}

const TokenDataGuestAuth = function (flowMode: number, req, res, next) {
  let asyncFUn = async () => {
    try {
      if(flowMode == null){
        throw new Error("flowMode is null, Check your TokenDataGuestAuth and make sure is filled");
      }
      let token = req.query.token || req.query.share_key || null;
      let resData: TokenDataInterface = await TokenDataService.getByToken(token);
      let data = resData.data; // JSON.parse(resData.data || '{}');
      let userData = await GetAuthUser(req);
      if (resData == null) {
        convertToReqData(req, data);
        throw new Error("Token is null")
      }
      /* It mean setting for not required authentication */
      if (flowMode == TOKEN_DATA_GUEST_MODE.WITHOUT_AUTHENTICATION) {
        convertToReqData(req, data);
        return next();
      }
      if (data.user_id == userData.id) {
        convertToReqData(req, data);
        return next();
      }
      let validTokenDataAuth = await CheckTokenDataAuth(data.page_name, data.table_id, userData.id || data.identity_value);

      if (validTokenDataAuth == STATUS_RESPONSE.IS_PRIVATE) {
        if (req.headers["x-requested-with"] == 'XMLHttpRequest') {
          //is ajax request
          return res.status(400).send("This page is private :(");
        } else {
          return res.redirect("/dashboard/login?redirect=" + (AppConfig.APP_PROTOCOL + '://' + req.get('host') + req.originalUrl));
        }
      }
      if (validTokenDataAuth == STATUS_RESPONSE.NOT_ALLOWED) {
        if (req.headers["x-requested-with"] == 'XMLHttpRequest') {
          //is ajax request
          return res.status(400).send("You are not allowed access this data :(");
        } else {
          return res.redirect("/dashboard/login-page-publisher?redirect=" + (AppConfig.APP_PROTOCOL + '://' + req.get('host') + req.originalUrl));
        }
      }
      convertToReqData(req, data);
      console.log("req.query :: ", req.query);
      next();
    } catch (ex) {
      return res.status(400).send(ex);
    }
  }
  asyncFUn();
}

export default TokenDataGuestAuth;