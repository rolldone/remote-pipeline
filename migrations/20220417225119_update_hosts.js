/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('hosts', function (table) {
    table.string("auth_type");
    table.string("username");
    table.text("password");
    table.text("private_key");
    // Relation
    table.foreign("user_id").references("users.id").onDelete("CASCADE");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('hosts', function (table) {
    table.dropColumn("auth_type");
    table.dropColumn("username");
    table.dropColumn("password");
    table.dropColumn("private_key");
    table.dropForeign("user_id");
  });
};
