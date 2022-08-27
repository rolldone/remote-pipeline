/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = function (knex) {
  return knex.schema.alterTable('pipelines', function (table) {
    table.string("connection_type").defaultTo("ssh");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('pipelines', function (table) {
    table.dropColumn("connection_type");
  });
};
