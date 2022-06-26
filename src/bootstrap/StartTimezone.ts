import AppConfig from "@root/config/AppConfig";


export default function (next: Function) {
  process.env.TZ = AppConfig.TIMEZONE;
  next();
}