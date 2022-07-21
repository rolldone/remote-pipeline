/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('queue_record_details', function (table) {
    table.json("variable");
    table.json("variable_extra");
    table.json("execution");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('queue_record_details', function (table) {
    table.dropColumn("variable", "variable_extra", "execution");
  });
};
