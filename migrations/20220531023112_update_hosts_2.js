/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('hosts', function (table) {
    table.dateTime("deleted_at");
    table.dateTime("created_at");
    table.dateTime("updated_at");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('hosts', function (table) {
    table.dropColumn("deleted_at", "created_at", "updated_at");
  });
};
