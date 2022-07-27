/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('projects', function (table) {
    table.dateTime("deleted_at");
    table.dateTime("created_at");
    table.dateTime("updated_at");

    // Relation
    table.foreign("user_id").references("users.id").onDelete("CASCADE");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('projects', function (table) {
    table.dropColumn("deleted_at", "created_at", "updated_at");
    table.dropForeign("user_id");
  });
};
