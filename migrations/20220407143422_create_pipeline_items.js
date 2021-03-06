/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('pipeline_items', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.bigInteger('pipeline_id');
    tableBuilder.bigInteger('project_id');
    tableBuilder.string('name', 255);
    tableBuilder.boolean('is_active').defaultTo(true);
    tableBuilder.string('type', 255);
    tableBuilder.integer('order_number');
    // Relation
    tableBuilder.foreign("pipeline_id").references("pipelines.id").onDelete('CASCADE');
    tableBuilder.foreign("project_id").references("projects.id").onDelete("CASCADE");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable("pipeline_items")
};
