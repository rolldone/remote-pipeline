// Update with your config settings.
require('dotenv').config();

const config = {
  work: {
    client: 'sqlite3',
    connection: {
      filename: './db/work.db'
    },
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
    useNullAsDefault: true
  }
  // staging: {
  //   client: 'mysql',
  //   connection: {
  //     database: 'my_db',
  //     user:     'username',
  //     password: 'password'
  //   },
  //   pool: {
  //     min: 2,
  //     max: 10
  //   },
  //   migrations: {
  //     tableName: 'knex_migrations'
  //   }
  // },

  // production: {
  //   client: 'sqlite3',
  //   connection: {
  //     // database: 'my_db',
  //     // user:     'username',
  //     // password: 'password'
  //     filename: './db/work.db'
  //   },
  //   migrations: {
  //     directory: './migrations',
  //   },
  //   seeds: {
  //     directory: './seeds',
  //   },
  //   // pool: {
  //   //   min: 2,
  //   //   max: 10
  //   // },
  //   // migrations: {
  //   //   tableName: 'knex_migrations'
  //   // }
  // }
}
/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = config[process.env.APP_ENV];
