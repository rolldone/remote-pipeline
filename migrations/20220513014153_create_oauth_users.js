/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('oauth_users', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.integer("user_id");
    tableBuilder.string("access_token");
    tableBuilder.string("repo_from");
    tableBuilder.string("token_type");
    tableBuilder.string("scope");
    tableBuilder.json('data');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable("oauth_users")
};
