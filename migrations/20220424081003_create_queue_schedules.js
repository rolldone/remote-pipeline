/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('queue_schedules', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.integer('queue_record_id');
    tableBuilder.integer("execution_id");
    tableBuilder.string('schedule_type');
    tableBuilder.json('data');

    // Relation
    tableBuilder.foreign("queue_record_id").references("queue_records.id").onDelete("CASCADE");
    tableBuilder.foreign("execution_id").references("executions.id").onDelete("CASCADE");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable("queue_schedules")
};
