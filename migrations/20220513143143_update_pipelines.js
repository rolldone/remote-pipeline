/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('pipelines', function (table) {
    table.string("from");
    table.json("repo_data");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('pipelines', function (table) {
    table.dropColumn("from", "repo_data");
  });
};
