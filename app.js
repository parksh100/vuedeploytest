const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
const multer = require("multer");
const path = require("path");

app.use(cors());

const user = ["박성훈", "이상영", "잭슨", "박정은", "박채은"];
app.get("/api", (req, res) => {
  res.send(user);
});

app.get("/", (req, res) => {
  res.send("홈페이지 오신 것을 환영합니다");
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

app.post(
  "/api/upload/image",
  imageUpload.single("attachment"),
  async (req, res) => {
    console.log(req.file);
    res.send(req.file);
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

app.post(
  "/api/upload/file",
  fileUpload.single("attachment"),
  async (req, res) => {
    console.log(req.file);
    res.send(fileInfo);
  }
);
