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
  db.createTable('pipeline_items', {
    id: { type: 'int', primaryKey: true },
    pipeline_id: 'int',
    project_id: 'int',
    name: 'string',
    is_active: 'string',
    type: 'string',
    value: 'string',
  }, callback);
};

exports.down = function (db) {
  return db.dropTable('pipeline_items');
};

exports._meta = {
  "version": 1
};
