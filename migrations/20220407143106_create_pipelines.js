/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('pipelines', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.bigInteger('project_id', 255);
    tableBuilder.string('name', 255);
    tableBuilder.string('description', 255);
    // Relation
    tableBuilder.foreign('project_id').references('projects.id').onDelete('CASCADE');
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable("pipelines");
};
