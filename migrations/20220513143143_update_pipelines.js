/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('pipelines', function (table) {
    table.string("source_type");
    table.string("repo_name");
    table.string("from_provider");
    table.integer("oauth_user_id");
    table.json("repo_data");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('pipelines', function (table) {
    table.dropColumn("source_type","from_provider", "repo_name", "oauth_user_id", "repo_data");
  });
};
