/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('page_publisher_users', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.integer("page_publisher_id");
    tableBuilder.integer("user_id");
    tableBuilder.string("email");
    tableBuilder.text("secret_code");
    tableBuilder.json("privileges");
    tableBuilder.dateTime("deleted_at");
    tableBuilder.dateTime("created_at");
    tableBuilder.dateTime("updated_at");

    tableBuilder.foreign("page_publisher_id").references("page_publishers.id").onDelete("CASCADE");
    tableBuilder.foreign("user_id").references("users.id").onDelete("CASCADE");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable("page_publisher_users")
};
