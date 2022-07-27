/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('variable_items', function (tableBuilder) {
    tableBuilder.increments('id');
    tableBuilder.integer("variable_id");
    tableBuilder.string("name");
    tableBuilder.json("datas");
    tableBuilder.boolean("is_active").defaultTo(true);
    tableBuilder.dateTime("deleted_at");
    tableBuilder.dateTime("created_at");
    tableBuilder.dateTime("updated_at");

    tableBuilder.foreign("variable_id").references("variables.id").onDelete("CASCADE");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable("variable_items")
};
