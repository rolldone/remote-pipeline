/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('variables', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.integer('pipeline_id');
    tableBuilder.integer('project_id');
    tableBuilder.integer('user_id');
    tableBuilder.string('name');
    tableBuilder.json('data');
    tableBuilder.json('schema');
    tableBuilder.string('description');

    // Relation
    tableBuilder.foreign("pipeline_id").references("pipelines.id").onDelete("CASCADE");
    tableBuilder.foreign("project_id").references("projects.id").onDelete("CASCADE");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable("variables")
};
