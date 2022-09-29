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

const TokenDataGuestAuth = function (req, res, next) {
  let asyncFUn = async () => {
    try {
      let token = req.query.token || null;
      let resData: TokenDataInterface = await TokenDataService.getByToken(token);
      if (resData == null) throw new Error("Token is null");
      let data = JSON.parse(resData.data || '{}');
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
      console.log("req.query :: ", req.query);
      next();
    } catch (ex) {
      return res.status(400).send(ex);
    }
  }
  asyncFUn();
}

export default TokenDataGuestAuth;