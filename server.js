require("dotenv").config();
const multer = require("multer");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const File = require("./models/File");

const express = require("express");
const app = express();
//to understand
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

//files will be uploaded in the 'uploads' folder
const upload = multer({ dest: "uploads" });

mongoose.connect(process.env.DATABASE_URL, (err) => {
  if(err) console.log(err) 
  else console.log("mongdb is connected");
 });

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

//to upload single file using the name 'file' from html form
//multer gives properties: path, originalname etc
app.post("/upload", upload.single("file"), async (req, res) => {
  const fileData = {
    path: req.file.path,
    name: req.file.originalname,
  };
  if (req.body.password != null && req.body.password !== "") {
    fileData.password = await bcrypt.hash(req.body.password, 10);
  }

  const file = await File.create(fileData);

  res.render("index", { fileLink: `${req.headers.origin}/file/${file.id}` });
});

app.route("/file/:id").get(handleDownload).post(handleDownload);

async function handleDownload(req, res) { 
  const file = await File.findById(req.params.id);

  if (file.password != null) {
    if (req.body.password == null) {
      res.render("password");
      return;
    }

    if (!(await bcrypt.compare(req.body.password, file.password))) {
      res.render("password", { error: true });
      return;
    }
  }

  file.downloadCount++;
  await file.save();

  res.download(file.path, file.name);
}

app.listen(process.env.PORT);
