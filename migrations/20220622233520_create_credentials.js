/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('credentials', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.string("name");
    tableBuilder.string("type");
    tableBuilder.json("data");
    tableBuilder.integer("user_id");
    tableBuilder.text("description");
    tableBuilder.dateTime("deleted_at");
    tableBuilder.dateTime("created_at");
    tableBuilder.dateTime("updated_at");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable("credentials")
};
