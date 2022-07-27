/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('files', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.string("name");
    tableBuilder.string("type");
    tableBuilder.integer("user_id");
    tableBuilder.decimal("size", 10, 2);
    tableBuilder.integer("status");
    tableBuilder.string("path");
    tableBuilder.dateTime("deleted_at");
    tableBuilder.dateTime("created_at");
    tableBuilder.dateTime("updated_at");

    tableBuilder.foreign("user_id").references("users.id").onDelete("CASCADE");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable("files")
};
