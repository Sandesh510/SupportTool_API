/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("employee_details", function (table) {
    table.increments("empid").primary();
    table.string("empname");
    table.string("department");
    table.string("designation");
    table.string("manager_name");
    table.string("location");
    table.string("email");
    table.string("password");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("employee_details");
};
