/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('queue_schedules', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.integer('queue_record_id');
    tableBuilder.integer("execution_id");
    tableBuilder.string('schedule_type');
    tableBuilder.json('data');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTable("queue_schedules")
};
