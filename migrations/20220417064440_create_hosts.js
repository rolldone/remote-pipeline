/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('hosts', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.integer('name');
    tableBuilder.string('description');
    tableBuilder.integer('user_id');
    tableBuilder.json('data');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable("hosts")
};
