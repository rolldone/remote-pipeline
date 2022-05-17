/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('webhooks', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.string("name");
    tableBuilder.text("key");
    tableBuilder.text("description");
    tableBuilder.json("webhook_datas");
    tableBuilder.integer("user_id");
    tableBuilder.integer("status");
    tableBuilder.json('data');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable("webhooks")
};
