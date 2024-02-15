require("dotenv").config();
// const knex = require("knex"); // Import Knex instance
const express = require("express");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
const cors = require("cors");
const employeeRoute = require("./routes/employeeRoute");
const assetRoute = require("./routes/assetRoutes");

const app = express();
// app.use(verifyToken);
app.use(express.json()); // Parse JSON data from requests
app.use(cors());
app.use("/employee", employeeRoute);
app.use("/asset", assetRoute);

module.exports = app;
