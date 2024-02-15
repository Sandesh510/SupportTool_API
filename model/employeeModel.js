const knex = require("knex");
const knexFile = require("../database/knexfile");
const bcrypt = require("bcrypt");
const db = knex(knexFile);

module.exports = {
  db,

  // Define methods for interacting with the 'employee_details' table
  findAllEmployees() {
    return db("employee_details").select("*");
  },

  findEmployeeById(id) {
    return db("employee_details").where("empid", id).select("*");
  },

  createEmployee(employeeData) {
    return db("employee_details").insert(employeeData);
  },

  updateEmployee(id, updatedEmployeeData) {
    return db("employee_details")
      .where("EmpID", id)
      .update(updatedEmployeeData);
  },

  updateEmployeeRole(id, rmid, updatedEmployeeRole) {
    if (
      typeof updatedEmployeeRole === "object" &&
      updatedEmployeeRole !== null
    ) {
      return db("role_mapping")
        .where("empid", id)
        .where("map_id", rmid)
        .update(updatedEmployeeRole);
    } else {
      throw new Error("Invalid or missing updatedEmployeeRole");
    }
  },

  deleteEmployee(id) {
    return db("employee_details").where("EmpID", id).del();
  },

  whoami(id, modules) {
    return db("role_mapping")
      .join("role_details", "role_mapping.role_id", "role_details.role_id")
      .select(
        "role_mapping.empid",
        "role_details.role_module",
        "role_details.roles"
      )
      .where({
        "role_mapping.empid": id,
        "role_details.role_module": modules,
      });
  },

  whichMenus(id) {
    return db("role_mapping")
      .join("role_details", "role_mapping.role_id", "role_details.role_id")
      .select("role_details.role_module")
      .where({
        "role_mapping.empid": id,
      });
  },

  async checkCredentials(empid, password) {
    // Retrieve the user with the given email from the database
    const user = await db("employee_details").where({ empid }).first();

    if (!user) {
      // User with the given email doesn't exist
      return null;
    }

    // Compare the provided password with the hashed password stored in the database
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      // Passwords match, return the user data without the password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } else {
      // Passwords don't match
      return null;
    }
  },

  getEmployeeRoles: async (empid) => {
    try {
      const result = await db("employee_details as a")
        .select("a.empid", "c.roles", "c.role_module", "b.map_id")
        .join("role_mapping as b", "a.empid", "b.empid")
        .join("role_details as c", "b.role_id", "c.role_id")
        .where("a.empid", empid);

      return result;
    } catch (error) {
      console.error("Error fetching employee roles:", error);
      throw error;
    }
  },

  getRoleDetails: async () => {
    try {
      return db("role_details").select("*");
    } catch (error) {
      console.error("Error fetching  roles:", error);
      throw error;
    }
  },

  addRoleToUser: async (empid, role_id) => {
    try {
      return db("role_mapping").insert({
        empid,
        role_id,
      });
    } catch (error) {
      console.error("Error processing:", error);
    }
  },

  deleteRoleOfUser: async (map_id) => {
    try {
      return db("role_mapping").where("map_id", map_id).del();
    } catch (error) {
      console.error("Error processing:", error);
    }
  },
};
