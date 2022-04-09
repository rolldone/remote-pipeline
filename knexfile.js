// Update with your config settings.
require('dotenv').config();
/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

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
    useNullAsDefault: process.env.APP_ENV == 'work' ? true : false
  },

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

};
