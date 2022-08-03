/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('executions', async function (table) {
    table.string("execution_type");
    table.integer("parent_id").nullable();
    table.foreign('parent_id').references('executions.id').onDelete('CASCADE');

    await table.dropForeign('user_id');
    await table.dropForeign('pipeline_id');
    await table.dropForeign('project_id');
    await table.dropForeign('variable_id');

    table.integer('pipeline_id').nullable().alter();
    table.integer('user_id').nullable().alter();
    table.integer('variable_id').nullable().alter();
    table.integer('project_id').nullable().alter();

    table.foreign("pipeline_id").references("pipelines.id").onDelete("CASCADE");
    table.foreign("user_id").references("users.id").onDelete("CASCADE");
    table.foreign("variable_id").references("variables.id").onDelete("CASCADE");
    table.foreign("project_id").references("projects.id").onDelete("CASCADE");
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
    table.dropColumn('execution_type');
  });
};
