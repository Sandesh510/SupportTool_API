working code for file upload

```js
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

router.post("/single", upload.single("file"), async (req, res) => {
  console.log(req.file.path);

  try {
    const jsonArray = await csv
      .parseFile(csvFilePath, { headers: true })
      .on("data", function (data) {
        console.log(data);
        return data;
      })
      .on("end", function () {
        console.log("done");
      });
    console.log(jsonArray);

    await assetModel.createExcel(jsonArray);
    console.log("Json Array====");

    uploadCsv(csvFilePath);

    res.send(jsonArray);
  } catch (error) {
    console.error("Error processing CSV data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
```
