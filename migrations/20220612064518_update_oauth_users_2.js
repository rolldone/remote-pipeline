/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('oauth_users', function (table) {
    table.dateTime("created_at");
    table.dateTime("updated_at");
    table.string("name");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('oauth_users', function (table) {
    table.dropColumn("created_at", "updated_at","name");
  });
};
