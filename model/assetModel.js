const knex = require("knex");
const knexFile = require("../database/knexfile");
const db = knex(knexFile);

module.exports = {
  db,

  findAllAssets() {
    // Fetch all assets and include employee name and department from the employee_details table
    return db("asset_inventory")
      .select(
        "asset_inventory.*",
        "employee_details.empname as employee_name",
        "employee_details.department"
      )
      .leftJoin(
        "employee_details",
        "asset_inventory.empid",
        "employee_details.empid"
      );
  },

  getCNTofDepartment() {
    return db("employee_details")
      .select("employee_details.department", db.raw("count(1) as total"))
      .rightJoin(
        "asset_inventory",
        "employee_details.empid",
        "asset_inventory.empid"
      )
      .groupBy("employee_details.department");
  },

  updateAsset: async (serialNo, updatedFields) => {
    try {
      const result = await db("asset_inventory")
        .where("serial_no", serialNo)
        .update(updatedFields);

      return result;
    } catch (error) {
      console.error("Error updating asset:", error);
      throw error;
    }
  },
  deleteAssetBySerialNumber(serialNumber) {
    return db("asset_inventory").where("serial_no", serialNumber).del();
  },
  createAsset(assetData) {
    return db("asset_inventory").insert(assetData);
  },
  getDistinctItems() {
    return db("asset_inventory")
      .select("asset_type", db.raw("count(1) as total"))
      .groupBy("asset_type");
  },
  getDistinctLocations() {
    return db("asset_inventory")
      .select("location", db.raw("count(1) as Count"))
      .groupBy("location");
  },
  // getMakeModelLocationCNT() {
  //   return db("dynamic_pivot_query()").select("*");
  // },
  getMakeModelLocationCNT() {
    return db.raw("SELECT * FROM dynamic_pivot_query()");
  },

  findAssetById(id) {
    return db("asset_inventory").where("empid", id).select("*");
  },

  createExcel(jsonArray) {
    console.log("Excel Uploaded======");
    try {
      db("asset_inventory").insert(jsonArray);
      return "CSV data inserted successfully!";
    } catch (error) {
      console.error("Error inserting data into the database:", error);
      throw "Error inserting CSV data. Please try again.";
    }
  },

  // Additional methods for asset CRUD operations can be added here...
};
