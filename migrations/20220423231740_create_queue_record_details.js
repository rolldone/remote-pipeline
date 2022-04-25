/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('queue_record_details', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.integer('queue_record_id');
    tableBuilder.string("queue_name");
    tableBuilder.integer('job_id');
    tableBuilder.json('data');
    tableBuilder.integer('status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable("queue_record_details")
};
