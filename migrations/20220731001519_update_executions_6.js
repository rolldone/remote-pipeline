/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('executions', function (table) {
    table.integer("parent_id").nullable();
    table.foreign('parent_id').references('executions.id').onDelete('CASCADE');

    table.dropForeign('user_id');
    table.dropForeign('pipeline_id');
    table.dropForeign('project_id');
    table.dropForeign('variable_id');

    table.integer('user_id').nullable().alter();
    table.integer('pipeline_id').nullable().alter();
    table.integer('project_id').nullable().alter();
    table.integer('variable_id').nullable().alter();

    table.foreign("user_id").references("users.id").onDelete("CASCADE");
    table.foreign("pipeline_id").references("pipelines.id").onDelete("CASCADE");
    table.foreign("project_id").references("projects.id").onDelete("CASCADE");
    table.foreign("variable_id").references("variables.id").onDelete("CASCADE");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('executions', function (table) {
    table.dropForeign("parent_id");
    table.dropColumn('parent_id');
  });
};
