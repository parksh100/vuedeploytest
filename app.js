const express = require("express");
const session = require("express-session");
const app = express();
const port = 3000;
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const mysql = require("./mysql");

// mongodb
require("dotenv").config({ path: "mongodb/.env" });
const mongoose = require("mongoose");

// mysql
require("dotenv").config({ path: "mysql/.env" });

app.use(cors());
app.use("/static/images", express.static("public/images"));

// session
let sess = {
  secret: "keyboard cat",
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1시간
    httpOnly: true,
    secure: false,
  },
};
app.use(session(sess));

const user = ["박성훈", "이상영", "잭슨", "박정은", "박채은"];
app.get("/api", (req, res) => {
  res.send(user);
});

app.get("/", (req, res) => {
  res.send("홈페이지 오신 것을 환영합니다");
});

app.post("/api/login", (req, res) => {
  const { email, pw } = req.body.param;
  console.log(email, pw);
  res.send({ email, pw });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.use(
  express.json({
    limit: "50mb",
  })
);

// multer image upload
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().valueOf() + path.extname(file.originalname));
  },
});
const imageUpload = multer({ storage: imageStorage });

// image upload
app.post(
  "/api/upload/image",
  imageUpload.single("attachment"),
  async (req, res) => {
    const fileInfo = {
      // product_id: parseInt(req.body.product_id),
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      filename: req.file.filename,
      path: req.file.path,
    };

    // res.send("fileInfo", fileInfo);
    res.status(200).send(fileInfo);
    // res.send("req.file", req.file);
    // res.status(200).send(req.file);
  }
);

// multer file upload
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().valueOf() + path.extname(file.originalname));
  },
});
const fileUpload = multer({ storage: fileStorage });

// route
const productRouter = require("./routes/product");
app.use("/api/product", productRouter);

app.post(
  "/api/upload/file",
  fileUpload.single("attachment"),
  async (req, res) => {
    const fileInfo = {
      // product_id: parseInt(req.body.product_id),
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      filename: req.file.filename,
      path: req.file.path,
    };

    res.send(fileInfo);
  }
);

// file download
app.get("/api/file/:filename", (req, res) => {
  const file = "./uploads/" + req.params.filename;
  try {
    if (fs.existsSync(file)) {
      res.download(file);
    } else {
      res.send("요청한 파일이 존재하지 않습니다.");
    }
  } catch (e) {
    console.log(e);
    res.send("파일을 다운로드 하는 중 에러가 발생했습니다.");
  }
});

// excel upload
app.post(
  "/api/upload/excel",
  fileUpload.single("attachment"),
  async (req, res) => {
    const workbook = xlsx.readFile(req.file.path);
    const firstSheetName = workbook.SheetNames[0];
    const firstSheet = workbook.Sheets[firstSheetName];
    const firstSheetJson = xlsx.utils.sheet_to_json(firstSheet);

    res.send(firstSheetJson);
  }
);
