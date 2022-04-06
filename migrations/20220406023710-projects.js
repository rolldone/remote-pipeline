'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db, callback) {
  db.createTable('projects', {
    id: { type: 'int', primaryKey: true },
    name: 'string',
    description: 'text',
    user_id: 'int',
  }, callback);
};

exports.down = function (db) {
  return db.dropTable('projects');
};

exports._meta = {
  "version": 1
};
