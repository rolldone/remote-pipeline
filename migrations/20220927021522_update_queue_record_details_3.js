/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('queue_record_details', function (table) {
    table.integer("token_data_id");

    // Relation
    table.foreign("token_data_id").references("token_datas.id");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('queue_record_details', function (table) {
    table.dropColumn("token_data_id");
  });
};
