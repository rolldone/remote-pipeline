/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('executions', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.integer('name');
    tableBuilder.string('process_mode');
    tableBuilder.integer('process_limit');
    tableBuilder.integer("pipeline_id");
    tableBuilder.integer("project_id");
    tableBuilder.integer('user_id');
    tableBuilder.integer("variable_id");
    tableBuilder.string("variable_option");
    tableBuilder.json("pipeline_item_ids");
    tableBuilder.json("host_ids");
    tableBuilder.text('description');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable("executions")
};
