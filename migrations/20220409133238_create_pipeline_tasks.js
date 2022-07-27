/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('pipeline_tasks', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.bigInteger('pipeline_id');
    tableBuilder.bigInteger('project_id');
    tableBuilder.bigInteger('pipeline_item_id');
    tableBuilder.string('name', 255);
    tableBuilder.string('temp_id', 255);
    tableBuilder.json("parent_order_temp_ids");
    tableBuilder.string('type', 255);
    tableBuilder.text('description');
    tableBuilder.integer('order_number', 10);
    tableBuilder.boolean('is_active').defaultTo(true);
    tableBuilder.json("data");

    // Relation
    tableBuilder.foreign("pipeline_id").references("pipelines.id").onDelete("CASCADE");
    tableBuilder.foreign("project_id").references("projects.id").onDelete("CASCADE");
    tableBuilder.foreign("pipeline_item_id").references("pipeline_items.id").onDelete("CASCADE");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable("pipeline_tasks")
};
