/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('users', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.integer('first_name');
    tableBuilder.integer('last_name');
    tableBuilder.string('email');
    tableBuilder.text('password');
    tableBuilder.integer('status');
    tableBuilder.json('data');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable("users")
};
