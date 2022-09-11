/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('page_publishers', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.string("page_name");
    tableBuilder.integer("table_id");
    tableBuilder.integer("user_id");
    tableBuilder.string("share_mode");
    tableBuilder.json("privileges");
    tableBuilder.json("data");
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
    .dropTable("page_publishers")
};
