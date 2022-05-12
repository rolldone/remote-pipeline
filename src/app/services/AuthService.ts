import Sqlbricks from "@root/tool/SqlBricks"
import { Knex } from "knex";
import bcrypt from 'bcrypt';

const saltRounds = 10;

declare let db: Knex;


export interface AuthInterface {
  first_name?: string
  last_name?: string
  email?: string
  password?: string
  status?: number
  data?: any
}

export const AuthStatus = {
  ACTIVE: 1,
  DEACTIVATE: 2
}

export default {
  async registerService(props: AuthInterface) {
    try {
      let _hash = await bcrypt.hash(props.password, saltRounds);
      let query = Sqlbricks.insert("users", {
        first_name: props.first_name,
        last_name: props.last_name,
        email: props.email,
        password: _hash,
        status: props.status || AuthStatus.ACTIVE,
        data: JSON.stringify(props.data || {})
      });
      let _query = query.toString();
      let resQueueRecord = await db.raw(_query);
      return true;
    } catch (ex) {
      throw ex;
    }
  },
  async loginService(props: AuthInterface) {
    try {
      let query = Sqlbricks.select().from("users").where("email", props.email);
      let _query = query.limit(1).offset(0).toString();
      let user = await db.raw(_query);
      if (user == null) return null;
      user = user[0];
      let resPassword = await bcrypt.compare(props.password, user.password);
      if (resPassword == false) {
        throw new Error("Wrong password or email address!");
      }
      delete user.password;
      return user;
    } catch (ex) {
      throw ex;
    }
  }
}