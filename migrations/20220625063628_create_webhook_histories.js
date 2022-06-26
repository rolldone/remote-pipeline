/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('webhook_histories', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.integer("webhook_id");
    tableBuilder.string("webhook_type");
    tableBuilder.string("webhook_item_key");
    tableBuilder.integer("status");
    tableBuilder.json("data");
    tableBuilder.string("job_id");
    tableBuilder.text("error_message");
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
    .dropTable("webhook_histories")
};
