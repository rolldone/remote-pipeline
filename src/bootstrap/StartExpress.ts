import AppConfig from "config/AppConfig";
import Express from "tool/Express";
import http from 'http';

var session = require("express-session");
var FileStore = require('session-file-store')(session);
var nunjucks = require("nunjucks");
var cors = require('cors')
var multer = require('multer');
var upload = multer();
var BodyParser = require("body-parser");
var redis = require("redis");


var fileStoreOptions = {
  reapInterval: -1,
  // ttl: 10
  // retries: 0,
};

export default function (next: Function) {
  try {
    console.log('Bootstrap -> Start Express');
    const app = Express();
    /* Request Type  */
    /* application/json */
    app.use(cors());
    app.use(BodyParser.json());
    /* application-x-www-form-urlencoded */
    app.use(BodyParser.urlencoded({ extended: true }));
    app.use((req, res, next) => {
      if (req.headers.authorization) {
        return next();
      }
      let sess = session({
        secret: 'ssshhhhh',
        store: new FileStore(fileStoreOptions),
        resave: false,
        saveUninitialized: false,
        cookie  : {
          expires: (1000 * 60) * 60
        }
        // cookie: {
        //   secure: false, // if true only transmit cookie over https
        //   httpOnly: true, // if true prevent client side JS from reading the cookie 
        //   maxAge: 1000 * 60 * 10 // session max age in miliseconds
        // }
      })
      return sess(req, res, next);
    });
    app.use("/public", Express.static('dist/public'));
    app.use("/public/dashboard", Express.static('dashboard/dist'));
    /* Multipart/form-data */
    // app.use(upload.any());
    global.app = app;
    /* Note / Catatan */
    /* Perbedaan antara  global.Server.listen dan global.app.Listen
     - global.Server.listen -> Ini bisa di integrasikan dengan modul lain seperti socket io
     - global.app.listen -> Ini hanya untuk express saja */
    global.Server = http.createServer(app);
    global.Server.listen(AppConfig.PORT, () => {
      console.log(`Example app listening}`)
    });
    nunjucks.configure('src/views', {
      autoescape: true,
      express: app
    });
    return next(null);
  } catch (ex) {
    throw ex;
  }
}