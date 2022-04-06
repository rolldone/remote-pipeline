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
  db.createTable('pipelines', {
    id: { type: 'int', primaryKey: true },
    project_id: 'int',
    name: 'string',
    description: 'string'
  }, callback);
};

exports.down = function (db) {
  return db.dropTable('pipelines');
};

exports._meta = {
  "version": 1
};
