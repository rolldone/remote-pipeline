/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('queue_records', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.string('queue_key');
    tableBuilder.integer('execution_id');
    tableBuilder.integer('status');
    tableBuilder.json('data');

    tableBuilder.foreign("execution_id").references("executions.id").onDelete("CASCADE");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTable("queue_records")
};
