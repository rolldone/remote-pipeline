/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('personal_access_tokens', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.string("name");
    tableBuilder.text("api_key");
    tableBuilder.text("encrypt_key");
    tableBuilder.integer("user_id");
    tableBuilder.dateTime("expired_date");
    tableBuilder.tinyint("status");
    tableBuilder.text("description");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable("personal_access_tokens");
};
