const express = require("express");
const router = express.Router();
const assetModel = require("../model/assetModel"); // Adjust the path as needed
const knex = require("knex");
const knexFile = require("../database/knexfile");
// const bcrypt = require("bcrypt");
const db = knex(knexFile);
const { Pool } = require("pg");
const multer = require("multer");
const csvFilePath = "./uploads/AssetData.csv";
const csv = require("fast-csv");
const fs = require("fs");

const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: fileStorageEngine });

function uploadCsv(path) {
  console.log("Path==", path);
  console.log("Inside Upload csv");

  let stream = fs.createReadStream(path);
  let csvDataCol = [];
  console.log("data");
  let filestream = csv
    .parse()
    .on("data", function (data) {
      csvDataCol.push(data);
    })
    .on("end", function () {
      console.log("data sent");

      console.log("End Connection");

      const pool = new Pool({
        host: "localhost",
        user: "postgres",
        database: "KnexPractice",
        password: "Admin$123",
        port: 5432,
      });

      let query =
        "INSERT INTO asset_inventory (serial_no,asset_type,make_model,quantity,location,condition,empid,processor,generation,disk_type,disk_size,ram,po_number,purchase_date,status,expires_in,updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)";
      pool.connect((err, client, done) => {
        console.log("Pool Connected");
        if (err) throw err;
        try {
          csvDataCol.forEach((row) => {
            client.query(query, row, (err, res) => {
              console.log(query);
              if (err) {
                console.log("ERROR OCCURED");
                console.log(err);
              } else {
                console.log("inserted " + res.rowCount + " row:", row);
              }
            });
          });
        } finally {
          done();
        }
      });
    });
  stream.pipe(filestream);
}

router.post("/uploadfile", upload.single("file"), async (req, res) => {
  try {
    // Validate file presence
    if (!req.file) {
      throw new Error("File upload is required.");
    }

    // Validate file type and size
    const allowedTypes = ["text/csv"];
    const maxFileSize = 5 * 1024 * 1024; // 5 MB
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new Error("Invalid file type. Only CSV files are supported.");
    }
    if (req.file.size > maxFileSize) {
      throw new Error("File size exceeds the maximum limit of 5MB.");
    }

    // Initialize tracking variables
    const insertedRecords = [];
    const unsuccessfulRecords = [];

    // Process CSV data
    await csv
      .parseFile(req.file.path, { headers: true, skipRows: 1 })
      .on("data", async (data) => {
        try {
          await assetModel.createExcel([data]);
          insertedRecords.push(data);
          console.log(
            `Record with serial number ${data.serial_no} inserted successfully.`
          );
        } catch (error) {
          console.error(
            `Error inserting record with serial number ${data.serial_no}: ${error.message}`
          );
          unsuccessfulRecords.push({
            serial_no: data.serial_no,
            error: error.message,
          });
        }
      })
      .on("end", () => {
        console.log("CSV processing completed.");
      });

    // Upload CSV file
    await uploadCsv(req.file.path);

    // Send response
    res.status(200).json({
      message: "CSV data processed successfully!",
      insertedRecords,
      unsuccessfulRecords,
    });
  } catch (error) {
    console.error("Error processing CSV data:", error);
    res.status(500).json({ error: error.message });
  }
});
// Route to get all assets
router.get("/all", async (req, res) => {
  try {
    const assets = await assetModel.findAllAssets();
    res.json(assets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// router to get distinct assets and its count

router.get("/asset_type_cnt", async (req, res) => {
  try {
    const type = await assetModel.getDistinctItems();
    res.json(type);
    res.status(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to get all records" });
  }
});

router.get("/location_cnt", async (req, res) => {
  try {
    const location = await assetModel.getDistinctLocations();
    res.json(location);
    res.status(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to get location details" });
  }
});

router.get("/mm_location", async (req, res) => {
  try {
    const location = await assetModel.getMakeModelLocationCNT();
    res.json(location.rows);
    res.status(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to get Pivotal Make Model Count" });
  }
});
router.get("/deparment_CNT", async (req, res) => {
  try {
    const department = await assetModel.getCNTofDepartment();
    res.json(department);
    res.status(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to getDetails" });
  }
});

router.put("/assetUpdate/:serialNo", async (req, res) => {
  try {
    const serialNo = req.params.serialNo;
    const updatedData = req.body;

    // Check if serial number is provided
    if (!serialNo) {
      return res.status(400).json({ error: "Serial number is required" });
    }

    // Check if the asset exists
    const existingAsset = await assetModel.findAllAssets(serialNo);

    if (!existingAsset || existingAsset.length === 0) {
      return res.status(404).json({ error: "Asset not found" });
    }

    // Update the asset
    await assetModel.updateAsset(serialNo, updatedData);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/assetDelete/:serialNumber", async (req, res) => {
  try {
    const { serialNumber } = req.params;

    // Check if serial number is provided
    if (!serialNumber) {
      return res.status(400).json({ error: "Serial number is required" });
    }

    // Delete the asset entry
    await assetModel.deleteAssetBySerialNumber(serialNumber);

    return res
      .status(200)
      .json({ success: true, message: "Asset deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/assetAdd", async (req, res) => {
  try {
    const {
      empid,
      serial_no,
      asset_type,
      make_model,
      quantity,
      location,
      condition,
      processor,
      generation,
      disk_type,
      disk_size,
      ram,
      po_number,
      purchase_date,
      status,
      expires_in,
    } = req.body;

    // Check if all required details are provided
    if (
      !(
        empid &&
        serial_no &&
        asset_type &&
        make_model &&
        quantity &&
        location &&
        condition
      )
    ) {
      return res.status(400).json({ error: "All details are required" });
    }

    // Check if the employee exists
    const employee = await db("employee_details")
      .where("empid", empid)
      .select("empid")
      .first();

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Check if the serial number is already available
    const existingAsset = await db("asset_inventory")
      .where("serial_no", serial_no)
      .select("serial_no")
      .first();

    if (existingAsset) {
      return res
        .status(400)
        .json({ error: "Serial number is already available" });
    }

    // Proceed to add the asset
    const assetData = {
      empid,
      serial_no,
      asset_type,
      make_model,
      quantity,
      location,
      condition,
      processor,
      generation,
      disk_type,
      disk_size,
      ram,
      po_number,
      purchase_date,
      status,
      expires_in,
    };

    await assetModel.createAsset(assetData);

    return res
      .status(201)
      .json({ success: true, message: "Asset added successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/assetsearch/:id", async (req, res) => {
  const empid = req.params.id;
  try {
    const asset = await assetModel.findAssetById(empid);

    if (asset.length === 0) {
      res.status(404).send("asset not found");
      return;
    }

    res.json(asset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
