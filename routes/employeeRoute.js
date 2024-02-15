const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const verifyToken = require("../middleware/verifyToken");

const employeeModel = require("../model/employeeModel");

const knex = require("knex");
const knexFile = require("../database/knexfile");
const db = knex(knexFile);

// const MANAGE_EMPLOYEE_PROCEDURE = "manage_employee";

// Get all employees
router.get("/", async (req, res) => {
  const employees = await employeeModel.db("employee_details").select("*");

  const employeesWithoutPassword = employees.map((employee) => {
    const { password, ...employeeWithoutPassword } = employee;
    return employeeWithoutPassword;
  });

  res.json(employeesWithoutPassword);
});

// Get employee by ID
router.get("/empSearch/:id", async (req, res) => {
  const empid = req.params.id;
  try {
    const employee = await employeeModel.findEmployeeById(empid);

    if (employee.length === 0) {
      res.status(404).send("Employee not found");
      return;
    }

    const employeesWithoutPassword = employee.map((employee) => {
      const { password, ...employeeWithoutPassword } = employee;
      return employeeWithoutPassword;
    });

    res.json(employeesWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/whoami/:id/:modules", async (req, res) => {
  try {
    const empid = req.params.id;
    const modules = req.params.modules;

    // Use the whoami method from employeeModel
    const result = await employeeModel.whoami(empid, modules);

    if (!result || result.length === 0) {
      return res.status(404).json({
        error: "User not found or doesn't have access to the specified module",
      });
    }

    // Return the result
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/whichMenu/:id", async (req, res) => {
  try {
    const empid = req.params.id;

    const result = await employeeModel.whichMenus(empid);

    if (!result || result.length === 0) {
      return res.status(404).json({
        error: "user Not found or doesnt have access to any of the menus",
      });
    }
    // return results
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// register new user
router.post("/register", async (req, res) => {
  try {
    const {
      empid,
      empname,
      department,
      designation,
      manager_name,
      location,
      email,
      password,
      mobile,
    } = req.body; // Collect all information

    // Validate if all data exists
    if (
      !(
        empid &&
        empname &&
        department &&
        designation &&
        manager_name &&
        location &&
        email &&
        password &&
        mobile
      )
    ) {
      res.status(401).send("All fields are requ");
      return;
    }

    // Check if user exists using Knex
    const existingUser = await db("employee_details").where("email", email); // Query for existing user

    if (existingUser.length !== 0) {
      res.status(401).send("User already exists in the database");
      return;
    }

    // Encrypt the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10); // Encrypt password
    // const newEmpId = (await db("employee_details").max("empid")) + 1;
    // Create a new user entry in the database using Knex
    const newUser = {
      empid,
      empname,
      department,
      designation,
      manager_name,
      location,
      email,
      password: hashedPassword, // Replace with encrypted password
      mobile,
    };

    await db("employee_details").insert(newUser); // Insert new user into 'users' table

    // Generate a JWT token using the user's ID and email
    const token = jwt.sign(
      {
        id: newUser.id, // Use generated ID from Knex insert
        email,
      },
      process.env.SECRET,
      { expiresIn: "2h" }
    );

    // Create a response object with the user information and token
    const response = {
      ...newUser, // Spread existing user data
      token, // Add generated token
    };

    // Remove the password from the response object
    delete response.password;

    res.status(201).json(response); // Send successful response with user data and token
  } catch (error) {
    console.error(error);
    console.error("Error in register route");
    res.status(500).send("Internal Server Error"); // Handle errors
  }
});

//update employee
router.put("/update/:id", async (req, res) => {
  try {
    const {
      empid,
      empname,
      department,
      designation,
      manager_name,
      location,
      email,
      password,
    } = req.body; // Collect all information

    // Validate if empid exists
    if (!empid) {
      res.status(400).send("empid is required for updating user");
      return;
    }

    // Check if user exists using Knex
    const existingUser = await db("employee_details")
      .where("empid", empid)
      .first(); // Query for existing user

    if (!existingUser) {
      res.status(404).send("User not found");
      return;
    }

    // Update only the provided fields
    const updatedUser = {
      empid: existingUser.empid,
      empname: empname || existingUser.empname,
      department: department || existingUser.department,
      designation: designation || existingUser.designation,
      manager_name: manager_name || existingUser.manager_name,
      location: location || existingUser.location,
      email: email || existingUser.email,
      password: password
        ? await bcrypt.hash(password, 10)
        : existingUser.password, // Encrypt password if provided
    };

    // Perform the update using Knex
    await db("employee_details").where("empid", empid).update(updatedUser);

    // Generate a JWT token using the updated user's ID and email
    const token = jwt.sign(
      {
        id: updatedUser.id, // Use generated ID from Knex update
        email: updatedUser.email,
      },
      process.env.SECRET,
      { expiresIn: "2h" }
    );

    // Create a response object with the updated user information and token
    const response = {
      ...updatedUser, // Spread updated user data
      token, // Add generated token
    };

    // Remove the password from the response object
    delete response.password;

    res.status(200).json(response); // Send successful response with updated user data and token
  } catch (error) {
    console.error(error);
    console.error("Error in update user route");
    res.status(500).send("Internal Server Error"); // Handle errors
  }
});

router.put("/updateEmployeeRole/:empid/:map_id", async (req, res) => {
  try {
    const { empid, map_id } = req.params;
    const updatedEmployeeRole = req.body; // Assuming the updated data is in the request body

    if (!empid || !map_id || !updatedEmployeeRole) {
      return res.status(400).json({
        error: "empid, map_id, and updatedEmployeeRole are required.",
      });
    }

    const result = await employeeModel.updateEmployeeRole(
      empid,
      map_id,
      updatedEmployeeRole
    );

    if (result === 1) {
      // If one row is updated, it means the update was successful
      res.json({
        success: true,
        message: "Employee role updated successfully.",
      });
    } else {
      res
        .status(404)
        .json({ success: false, error: "Employee role not found." });
    }
  } catch (error) {
    console.error("Error updating employee role:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Delete an employee
router.delete("/delete/:id", async (req, res) => {
  try {
    // Check if the employee with the given ID exists
    const employee = await employeeModel
      .db("employee_details")
      .where("empid", req.params.id)
      .first();

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // If the employee exists, perform the deletion
    await employeeModel
      .db("employee_details")
      .where("empid", req.params.id)
      .del();

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// // whoamI
// router.get("/whoami", verifyToken, async (req, res) => {
//   try {
//     const { email } = req.user;

//     // Retrieve user details from the database
//     const user = await db("employee_details").where("email", email).first();

//     if (!user) {
//       return res.status(404).send("User not found");
//     }

//     // Return relevant user information
//     const userInfo = {
//       empname: user.empname,
//       email: user.email,
//     };

//     res.status(200).json(userInfo);
//   } catch (error) {
//     console.error(error);
//     console.error("Error in whoami route");
//     res.status(500).send("Internal Server Error");
//   }
// });

router.post("/login", async (req, res) => {
  try {
    const { empid, password } = req.body;

    // Check if all details are provided
    if (!(empid && password)) {
      return res.status(400).json({ error: "ID and password are required" });
    }

    // Check if the user exists
    const user = await employeeModel.checkCredentials(empid, password);

    if (!user) {
      return res.status(401).json({ error: "Invalid ID  or password" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      {
        id: user.empid, // assuming empid is the user's unique identifier
        email: user.email,
      },
      process.env.SECRET,
      { expiresIn: "2h" }
    );

    // Make password undefined in the user object
    user.password = undefined;

    // Set the token as a cookie with options
    const options = {
      expires: new Date(Date.now() + 20 * 60 * 1000),
      httpOnly: true,
    };

    return res.status(200).cookie("token", token, options).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/employeeRoles/:empid", async (req, res) => {
  const { empid } = req.params;

  try {
    // FIXME: eventhough user is not exist it is shoiwng the records
    const userExists = await employeeModel.findEmployeeById(empid);

    // to check if user exist in the system or not
    if (userExists.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const roles = await employeeModel.getEmployeeRoles(empid);
    res.json({ success: true, roles });
  } catch (error) {
    console.error("error fecthing the records", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get("/role_details", async (req, res) => {
  try {
    const roles = await employeeModel.getRoleDetails();
    res.json(roles);
  } catch (error) {
    console.error("Error in fetching Role_details:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.post("/addrole/:empid/:role_id", async (req, res) => {
  const { empid, role_id } = req.params;
  try {
    // validate that role_id and emp_id is provided
    if (!(empid && role_id)) {
      return res.status(400).json({ error: "empid and roleID are required" });
    }
    // call the modal
    const result = await employeeModel.addRoleToUser(empid, role_id);
    res.status(200).json({
      success: true,
      message: "Roles Added to user succesfully",
      result,
    });
  } catch (error) {
    console.error("Error in fetching Role_details:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.delete("/deleteroleofuser/:empid/:map_id", async (req, res) => {
  const { empid, map_id } = req.params;

  try {
    // check for roles
    const roles = await employeeModel.getEmployeeRoles(empid);
    // check if map_id is present
    const isValidMapId = roles.some((role) => role.map_id === map_id);

    if (!isValidMapId) {
      return res.status(400).json({
        success: false,
        error: "Invalid Map Id",
      });
    }
    const result = await employeeModel.deleteRoleOfUser(map_id);

    res.json({
      success: true,
      message: "Role Deleted Succesfully",
      result,
    });
  } catch (error) {
    console.error("Error in deleting details:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});
module.exports = router;
