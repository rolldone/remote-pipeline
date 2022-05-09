/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user_partners', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.integer('user_id').unsigned();
    tableBuilder.integer("partner_user_id").unsigned();
    tableBuilder.json('data');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTable("user_partners")
};
