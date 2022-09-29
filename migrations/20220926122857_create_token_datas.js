/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('token_datas', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.text("token");
    tableBuilder.json("data");
    tableBuilder.string("topic");
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
    .dropTable("token_datas")
};
