const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");

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
