const express = require("express");
const session = require("express-session");
const app = express();
const xlsx = require("xlsx"); // 아무데나
const port = 3000;
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const mysql = require("./mysql");
const fs = require("fs");
const morgan = require("morgan"); // morgan

require("dotenv").config({ path: `nodemailer/.env` }); // nodemailer
const nodemailer = require("./nodemailer"); // nodemailer

const mime = require("mime"); // 파일다운로드 기능
const cookieParser = require("cookie-parser");
const cron = require("node-cron"); // 작업스케줄러

// mongodb
require("dotenv").config({ path: "mongodb/.env" });
const mongoose = require("mongoose");

// mysql
require("dotenv").config({ path: "mysql/.env" });

app.use(cors());
app.use("/static/images", express.static("public/images"));
app.use("/static/uploads", express.static("uploads")); // 서버에서 이미지를 다운받아야 할때 사용. static("열어줄 폴더")

// const user = ["박성훈", "이상영", "잭슨", "박정은", "박채은"];
app.get("/api", (req, res) => {
  // res.send(user);
  res.status(200).send(user);
});

app.get("/", (req, res) => {
  res.send("홈페이지 오신 것을 환영합니다");
});

app.use(
  express.json({
    limit: "50mb",
  })
);

// multer image upload
// const imageStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/images");
//   },
//   filename: (req, file, cb) => {
//     cb(null, new Date().valueOf() + path.extname(file.originalname));
//   },
// });
// const imageUpload = multer({ storage: imageStorage });

// app.post(
//   "/api/upload/image",
//   imageUpload.single("attachment"),
//   async (req, res) => {
//     const fileInfo = {
//       // product_id: parseInt(req.body.product_id),
//       originalname: StringUtils.cleanPath(
//         new String(
//           file.getOriginalFilename().getBytes("8859_1"),
//           StandardCharsets.UTF_8
//         )
//       ),
//       mimetype: req.file.mimetype,
//       filename: req.file.filename,
//       path: req.file.path,
//     };

//     // res.send("fileInfo", fileInfo);
//     res.status(200).send(fileInfo);
//     // res.send("req.file", req.file);
//     // res.status(200).send(req.file);
//   }
// );

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
    const fileInfo = {
      // customer_id: parseInt(req.body.customer_id),
      originalname: Buffer.from(req.file.originalname, "latin1").toString(
        "utf-8"
      ),
      // originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      filename: req.file.filename,
      path: req.file.path,
    };
    // res.send(fileInfo);
    res.status(200).send(fileInfo);
  }
);

// route
const productRouter = require("./routes/product");
app.use("/api/product", productRouter);

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

// xlsx Upload ----------------------------------------------------------------------------------------------
const xlsxStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 어떤폴더에 저장
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    // 시스템 시간으로 파일이름 변경
    cb(null, new Date().valueOf() + path.extname(file.originalname));
  },
});

const xlsxUpload = multer({ storage: xlsxStorage });

app.post("/api/xlsx", xlsxUpload.single("xlsx"), async (req, res) => {
  console.log(req.file);
  console.log(req.body);
  const workbook = xlsx.readFile(req.file.path);
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];
  const firstSheetJson = xlsx.utils.sheet_to_json(firstSheet);

  res.send(firstSheetJson);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

//라우트 동록---------------------------------------------------------------------------------------------------
//auditor 전체조회
app.get("/api/auditor", async (req, res) => {
  const auditorList = await mysql.query("auditorList");
  res.send(auditorList);
});

//auditor 한 명조회
app.get("/api/auditor/:auditor_id", async (req, res) => {
  const { auditor_id } = req.params;
  const getAuditor = await mysql.query("getAuditor", auditor_id);
  res.send(getAuditor);
});

//customer 전체조회
app.get("/api/customer/all", async (req, res) => {
  const customerList = await mysql.query("customerList");
  res.send(customerList);
});

//report 전체조회
app.get("/api/report/all", async (req, res) => {
  const reportList = await mysql.query("reportListAll");
  res.send(reportList);
});

//customer by auditor전체조회
app.get("/api/customer/:auditor_email", async (req, res) => {
  // console.log(req.params);
  const { auditor_email } = req.params;
  const customerListByAuditor = await mysql.query(
    "customerListByEmail",
    auditor_email
  );
  res.send(customerListByAuditor);
});

// cr 전체조회
// app.get("/api/customer/cr", async (req, res) => {
//   const crList = await mysql.query("crList");
//   res.send(crList);
// });

//cr join 조회
app.get("/api/customer/cr", async (req, res) => {
  const crList = await mysql.query("crSelectedList");
  res.send(crList);
});

//인증심사리스트 조회
app.get("/api/customer/cert/list", async (req, res) => {
  const auditList = await mysql.query("auditList");
  res.send(auditList);
});

//인증심사리스트 by customer_id 조회
app.get("/api/customer/cert/list/:customer_id", async (req, res) => {
  const { customer_id } = req.params;
  // console.log(customer_id);
  const auditListByCustomer = await mysql.query(
    "auditListByCustomer",
    customer_id
  );
  res.send(auditListByCustomer);
});

// 등록된 인증심사리스트 by auditor_email
app.get("/api/cert/list/:auditor_email", async (req, res) => {
  const { auditor_email } = req.params;
  // console.log(customer_id);
  const auditListByAuditorEmail = await mysql.query(
    "auditListByAuditorEmail2",
    auditor_email
  );
  res.send(auditListByAuditorEmail);
});

//인증심사리스트 by audit_email 조회
app.get("/api/customer/cert/list/:audit_email", async (req, res) => {
  const { audit_email } = req.params;
  // console.log(customer_id);
  const customerListByAuditorEmail = await mysql.query(
    "customerListByAuditorEmail",
    audit_email
  );
  res.send(customerListByAuditorEmail);
});

//auditListDetail by audit_no 조회
app.get("/api/customer/cert/list/detail/:audit_no", async (req, res) => {
  const { audit_no } = req.params;
  // console.log(customer_id);
  const auditListDetail = await mysql.query(
    "auditListDetailAtIssueCert",
    audit_no
  );
  res.send(auditListDetail[0]);
});

//auditListDetail by audit_no 조회
app.get("/api/cert/list/detail/:audit_no", async (req, res) => {
  const { audit_no } = req.params;
  // console.log(customer_id);
  const auditListDetail = await mysql.query("auditListDetail", audit_no);
  res.send(auditListDetail[0]);
});

//인증심사리스트 by audit_no 조회
app.get("/api/customer/cert/list/id/:audit_no", async (req, res) => {
  const { audit_no } = req.params;
  // console.log(audit_no);
  const result = await mysql.query("auditListByAuditNo", audit_no);
  res.send(result[0]);
});

//인증심사리스트 by business_no 조회
app.get("/api/customer/cert/list/cid/:business_no", async (req, res) => {
  const { business_no } = req.params;
  // console.log(business_no);
  const auditListByBizNo = await mysql.query("auditListByBizNo", business_no);
  res.send(auditListByBizNo);
});

//customer detail by customer_id 조회
// app.get("/api/customer/list/:customer_id", async (req, res) => {
//   const { customer_id } = req.params;
//   console.log(customer_id);
//   const customerDetail = await mysql.query("customerDetail", customer_id);
//   res.send(customerDetail[0]);
// });

//customer detail by business_no 조회
app.get("/api/customer/list/:business_no", async (req, res) => {
  const { business_no } = req.params;
  // console.log(business_no);
  const customerDetail = await mysql.query(
    "customerDetailByBizNo",
    business_no
  );
  res.send(customerDetail[0]);
});

//인증심사 detail by audit_no 조회
app.get("/api/customer/audit/:audit_no", async (req, res) => {
  const { audit_no } = req.params;
  const AuditDetail = await mysql.query("auditListByAuditNo", audit_no);
  res.send(AuditDetail[0]);
});

//2단계 심사 날짜계산 by audit_no 조회
app.get("/api/report/s2/audit_day/:audit_no", async (req, res) => {
  const { audit_no } = req.params;
  const DayDiff = await mysql.query("s2AuditDayDiff", audit_no);
  res.send(DayDiff[0]);
});

//인증심사 detail by audit_id
app.get("/api/customer/cert/:audit_id", async (req, res) => {
  const { audit_id } = req.params;
  const certDetail = await mysql.query("certDetail", audit_id);
  res.send(certDetail[0]);
});

//cr detail
app.get("/api/customer/cr/:customer_id", async (req, res) => {
  const { customer_id } = req.params;
  const crDetail = await mysql.query("crDetail", customer_id);
  res.send(crDetail[0]);
});

//cr detail by audit_no
app.get("/api/customer/cr/detail/:audit_no", async (req, res) => {
  const { audit_no } = req.params;
  const crDetailByAuditNo = await mysql.query("crSelectedList", audit_no);
  res.send(crDetailByAuditNo[0]);
});

// transReport 조회 by audit_no
app.get("/api/report/trans/:audit_no", async (req, res) => {
  const { audit_no } = req.params;
  const transReport = await mysql.query("transReport", audit_no);
  // console.log(transReport);
  res.send(transReport[0]);
});

//s1Report 조회 by audit_no
app.get("/api/report/s1/:audit_no", async (req, res) => {
  const { audit_no } = req.params;
  const s1Report = await mysql.query("s1Report", audit_no);
  // console.log(s1Report);
  res.send(s1Report[0]);
});

//s2Report 조회 by audit_no
app.get("/api/report/s2/:audit_no", async (req, res) => {
  const { audit_no } = req.params;
  const s2Report = await mysql.query("s2Report", audit_no);
  // console.log(s2Report);
  res.send(s2Report[0]);
});

//user 조회 by user_id
app.get("/api/user/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const result = await mysql.query("getUserList", user_id);
  console.log(result);
  res.send(result[0]);
});

//user 조회 by user_email
app.get("/api/user/search/:user_email", async (req, res) => {
  const { user_email } = req.params;
  // console.log(user_email);
  const result = await mysql.query("getUser", user_email);
  // console.log(result[0]);

  res.send(result[0]);
});

//user 조회 all
app.get("/api/user", async (req, res) => {
  // const { user_email } = req.params;
  // console.log(user_email);
  const result = await mysql.query("userList");
  // console.log(result[0]);

  res.send(result);
});

//심사보고서 모두 조회 by auditor_email
app.get("/api/report/list/:auditor_email", async (req, res) => {
  const { auditor_email } = req.params;
  const reportListAllByAuditor = await mysql.query(
    "auditListByAuditor",
    auditor_email
  );
  // console.log(reportListAllByAuditor);
  res.send(reportListAllByAuditor);
});

//Report 모두 조회
app.get("/api/report/list", async (req, res) => {
  // const { audit_no } = req.params;
  const reportList = await mysql.query("reportListAll");
  // console.log(transReport);
  res.send(reportList);
});

// 업로드보고서 get 전체조회
app.get("/api/upload/list/:audit_no", async (req, res) => {
  // console.log(req.body.param);
  const { audit_no } = req.params;
  // const { searchName } = req.params;
  // console.log(auditor_email, searchName);
  // console.log(audit_no);
  const result = await mysql.query("uploadReportListAllByAuditNo", audit_no);

  // console.log(result);
  res.send(result[0]);
});

// 업로드Trans보고서 get 조회
app.get("/api/upload/trans/:audit_no", async (req, res) => {
  // console.log(req.body.param);
  const { audit_no } = req.params;
  // const { searchName } = req.params;
  // console.log(auditor_email, searchName);
  // console.log(audit_no);
  const result = await mysql.query("getUploadTrans", audit_no);
  // console.log(result);
  res.send(result[0]);
});

// 업로드S1보고서 get 조회
app.get("/api/upload/s1/:audit_no", async (req, res) => {
  // console.log(req.body.param);
  const { audit_no } = req.params;
  // const { searchName } = req.params;
  // console.log(auditor_email, searchName);
  // console.log(audit_no);
  const result = await mysql.query("getUploadS1", audit_no);
  // console.log(result);
  res.send(result[0]);
});

// 업로드S2보고서 get 조회
app.get("/api/upload/s2/:audit_no", async (req, res) => {
  // console.log(req.body.param);
  const { audit_no } = req.params;
  // const { searchName } = req.params;
  // console.log(auditor_email, searchName);
  // console.log(audit_no);
  const result = await mysql.query("getUploadS2", audit_no);
  // console.log(result);
  res.send(result[0]);
});

//active customer
app.get("/api/customer/active", async (req, res) => {
  const activeCustomers = await mysql.query("activeCustomers");
  // console.log(activeCustomers);
  res.send(activeCustomers);
});

//인증서조회 by cert_no
app.get("/api/cert/search/:cert_number", async (req, res) => {
  const { cert_number } = req.params;
  const result = await mysql.query("auditListDetailByCertNo", [
    cert_number,
    cert_number,
    cert_number,
    cert_number,
  ]);
  // console.log(result);
  if (result.length == 0) {
    res.json({
      success: false,
      message: "인증서번호가 존재하지 않습니다.",
    });
  } else {
    res.json({
      success: true,
      data: result[0],
    });
  }
});

// auditor 생성
app.post("/api/auditor", async (req, res) => {
  const result = await mysql.query("auditorInsert", req.body.param);
  res.send(result);
});

// customer 생성
app.post("/api/customer", async (req, res) => {
  const result = await mysql.query("customerInsert", req.body.param);
  // console.log(result);
  res.send(result);
});

// 전환심사보고서 생성
app.post("/api/report/trans", async (req, res) => {
  const result = await mysql.query("reportTransInsert", req.body.param);
  // console.log(result);
  res.send(result);
});

// 1단계보고서 생성
app.post("/api/report/s1", async (req, res) => {
  const result = await mysql.query("reportS1Insert", req.body.param);
  res.send(result);
});

// 2단계보고서 생성
app.post("/api/report/s2", async (req, res) => {
  const result = await mysql.query("reportS2Insert", req.body.param);
  // console.log(result);
  res.send(result);
});

// 계약검토 생성
app.post("/api/cr", async (req, res) => {
  const result = await mysql.query("crInsert", req.body.param);
  res.send(result);
});

// 심사신청 생성
app.post("/api/cert/audit", async (req, res) => {
  const result = await mysql.query("certInsert", req.body.param);
  // console.log(result);
  res.send(result);
});

// 인증서발행 생성
app.post("/api/cert/issue", async (req, res) => {
  const result = await mysql.query("certIssue", req.body.param);
  // console.log(result);
  res.send(result);
});

// 전환보고서 업로드 생성
app.post("/api/upload/trans", async (req, res) => {
  const result = await mysql.query("uploadTrans", req.body.param);
  // console.log(result);
  res.send(result);
});
// S1보고서 업로드 생성
app.post("/api/upload/s1", async (req, res) => {
  const result = await mysql.query("uploadS1", req.body.param);
  // console.log(result);
  res.send(result);
});
// S2보고서 업로드 생성
app.post("/api/upload/s2", async (req, res) => {
  const result = await mysql.query("uploadS2", req.body.param);
  // console.log(result);
  res.send(result);
});
// 인증서 업로드 생성
app.post("/api/upload/cert", async (req, res) => {
  const result = await mysql.query("insertCertUpload", req.body.param);
  // console.log(result);
  res.send(result);
});

// auditor 수정
app.put("/api/auditor/:auditor_id", async (req, res) => {
  const { auditor_id } = req.params;
  const result = await mysql.query("auditorUpdate", [
    req.body.param,
    auditor_id,
  ]); // body에 실려온 자료 중 첫번째 ?표에 req.body.param에 auditor_id는 두번째 ?에 입력됨.
  res.send(result);
});

// user 수정
app.put("/api/user/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const result = await mysql.query("updateUser", [req.body.param, user_id]); // body에 실려온 자료 중 첫번째 ?표에 req.body.param에 auditor_id는 두번째 ?에 입력됨.
  res.send(result);
});

// cert_create 수정
app.put("/api/cert/issue/:cert_number", async (req, res) => {
  const { cert_number } = req.params;
  const result = await mysql.query("updateCertIssue", [
    req.body.param,
    cert_number,
  ]); // body에 실려온 자료 중 첫번째 ?표에 req.body.param에 auditor_id는 두번째 ?에 입력됨.
  res.send(result);
});

// customer 수정
app.put("/api/customer/:business_no", async (req, res) => {
  const { business_no } = req.params;
  // console.log(req.body.param);
  // console.log(business_no);
  const result = await mysql.query("customerUpdate", [
    req.body.param,
    business_no,
  ]); // body에 실려온 자료 중 첫번째 ?표에 req.body.param에 auditor_id는 두번째 ?에 입력됨.
  res.send(result);
});

// 심사정보 수정
app.put("/api/customer/cert/:audit_no", async (req, res) => {
  const { audit_no } = req.params;
  // console.log(req.body.param);
  // console.log(customer_id);
  const result = await mysql.query("auditUpdate", [req.body.param, audit_no]); // body에 실려온 자료 중 첫번째 ?표에 req.body.param에 auditor_id는 두번째 ?에 입력됨.
  res.send(result);
});

// 전환심사보고서 수정
app.put("/api/report/trans/:audit_no", async (req, res) => {
  const { audit_no } = req.params;
  // console.log(req.body.param);
  // console.log(customer_id);
  const result = await mysql.query("transReportUpdate", [
    req.body.param,
    audit_no,
  ]); // body에 실려온 자료 중 첫번째 ?표에 req.body.param에 auditor_id는 두번째 ?에 입력됨.
  res.send(result);
});

// 1단계심사보고서 수정
app.put("/api/report/s1/:audit_no", async (req, res) => {
  const { audit_no } = req.params;
  // console.log(req.body.param);
  // console.log(customer_id);
  const result = await mysql.query("s1ReportUpdate", [
    req.body.param,
    audit_no,
  ]); // body에 실려온 자료 중 첫번째 ?표에 req.body.param에 auditor_id는 두번째 ?에 입력됨.
  res.send(result);
});

// 2단계심사보고서 수정
app.put("/api/report/s2/:audit_no", async (req, res) => {
  const { audit_no } = req.params;
  // console.log(req.body.param);
  // console.log(customer_id);
  const result = await mysql.query("s2ReportUpdate", [
    req.body.param,
    audit_no,
  ]); // body에 실려온 자료 중 첫번째 ?표에 req.body.param에 auditor_id는 두번째 ?에 입력됨.
  res.send(result);
});

// upload Trans 수정
app.put("/api/upload/trans/:audit_no", async (req, res) => {
  const { audit_no } = req.params;
  // console.log(req.body.param);
  // console.log(customer_id);
  const result = await mysql.query("updateUploadTransUpdate", [
    req.body.param,
    audit_no,
  ]); // body에 실려온 자료 중 첫번째 ?표에 req.body.param에 auditor_id는 두번째 ?에 입력됨.
  res.send(result);
});

// upload s1 수정
app.put("/api/upload/s1/:audit_no", async (req, res) => {
  const { audit_no } = req.params;
  // console.log(req.body.param);
  // console.log(customer_id);
  const result = await mysql.query("updateUploadS1Update", [
    req.body.param,
    audit_no,
  ]); // body에 실려온 자료 중 첫번째 ?표에 req.body.param에 auditor_id는 두번째 ?에 입력됨.
  res.send(result);
});

// upload s2 수정
app.put("/api/upload/s2/:audit_no", async (req, res) => {
  const { audit_no } = req.params;
  // console.log(req.body.param);
  // console.log(customer_id);
  const result = await mysql.query("updateUploadS2Update", [
    req.body.param,
    audit_no,
  ]); // body에 실려온 자료 중 첫번째 ?표에 req.body.param에 auditor_id는 두번째 ?에 입력됨.
  res.send(result);
});

// auditor 삭제
app.delete("/api/auditor/:auditor_id", async (req, res) => {
  const { auditor_id } = req.params;
  const result = await mysql.query("auditorDelete", auditor_id);
  res.send(result);
});

// customer 삭제
app.delete("/api/customer/:customer_id", async (req, res) => {
  const { customer_id } = req.params;
  const result = await mysql.query("customerDelete", customer_id);
  res.send(result);
});

// auditor 검색 post
app.post("/api/auditor/search", async (req, res) => {
  // const { searchName } = req.params;
  const result = await mysql.query("auditorListByCondition", req.body.param);
  res.send(result);
});

// 심사정보 검색 post by auditor_email

app.post("/api/customer/cert/list/auditor", async (req, res) => {
  const result = await mysql.query(
    "customerListByAuditorEmail",
    req.body.param
  );
  res.send(result);
});

// 고객List 조회 by auditor_email
app.post("/api/customer/list/auditor", async (req, res) => {
  const result = await mysql.query(
    "customerListByAuditorEmail",
    req.body.param
  );
  res.send(result);
});

// customer 검색 post
app.post("/api/customer/search", async (req, res) => {
  const result = await mysql.query("customerListByCondition", req.body.param);
  res.send(result);
});

// auditList 검색 post by customer_id
app.post("/api/customer/cert/list/:customer_id", async (req, res) => {
  const result = await mysql.query("auditListByCustomer", req.body.param);
  res.send(result);
});

// auditList 검색 post by audit_no
app.post("/api/customer/cert/list/audit_no/:audit_no", async (req, res) => {
  const result = await mysql.query("auditListByAuditNo", req.body.param);
  res.send(result);
});
// auditListDetail 검색 post by audit_no
// app.post("/api/customer/cert/list/detail/:audit_no", async (req, res) => {
//   const result = await mysql.query("auditListDetail", req.body.param);
//   res.send(result);
// });

// 심사정보 auditList 검색 post
app.post("/api/customer/cert/list/search", async (req, res) => {
  const result = await mysql.query("auditListByCondition", req.body.param);
  // console.log(result);
  res.send(result);
});

// 심사정보 customer 검색 post by auditor_email and searchName
app.post("/api/customer/auditor/search", async (req, res) => {
  // console.log(req.body.param);
  // const { auditor_email } = req.params;
  // const { searchName } = req.params;
  // console.log(auditor_email, searchName);
  const result = await mysql.query("customerListByEmailAndSearchName", [
    req.body.param[1],
    req.body.param[0],
  ]);
  // console.log(result);
  res.send(result);
});

// customer All 검색  searchName
app.post("/api/customer/search", async (req, res) => {
  // console.log(req.body.param);
  // const { auditor_email } = req.params;
  // const { searchName } = req.params;
  // console.log(auditor_email, searchName);
  const result = await mysql.query("customerListBySearchName", [
    req.body.param,
    // req.body.param[0],
  ]);
  // console.log(result);
  res.send(result);
});

// 심사정보 auditList 검색 post by auditor_email and searchName
app.post("/api/cert/auditor/search", async (req, res) => {
  // console.log(req.body.param);
  // const { auditor_email } = req.params;
  // const { searchName } = req.params;
  // console.log(auditor_email, searchName);
  const result = await mysql.query("auditListByEmailAndSearchName", [
    req.body.param[1],
    req.body.param[0],
  ]);
  // console.log(result);
  res.send(result);
});

// ActiveCustomer by auditor_email
app.post("/api/customer/active/", async (req, res) => {
  // console.log(req.body.param);
  // const { auditor_email } = req.params;
  // const { searchName } = req.params;
  // console.log(auditor_email, searchName);
  const result = await mysql.query("activeCustomerList", [req.body.param]);
  // console.log(result);
  res.send(result);
});

// customerCount by Month
app.post("/api/customer/count/month", async (req, res) => {
  // console.log(req.body.param);
  // const { auditor_email } = req.params;
  // const { searchName } = req.params;
  // console.log(auditor_email, searchName);
  const result = await mysql.query("customerCountByMonth", [req.body.param]);
  // console.log(result);
  res.send(result);
});

// AuditCount by Month
app.post("/api/audit/count", async (req, res) => {
  // console.log(req.body.param);
  // const { auditor_email } = req.params;
  // const { searchName } = req.params;
  // console.log(auditor_email, searchName);
  const result = await mysql.query("auditCountByEmail", [req.body.param]);
  // console.log(result);
  res.send(result);
});

// 심사정보 auditList 검색 searchName
app.post("/api/cert/search", async (req, res) => {
  // console.log(req.body.param);
  // const { auditor_email } = req.params;
  // const { searchName } = req.params;
  // console.log(auditor_email, searchName);
  const result = await mysql.query("auditListAllBySearchName", [
    req.body.param,
    // req.body.param[0],
  ]);
  console.log(result);
  res.send(result);
});

// 심사정보 auditList 검색 auditor_email, s2startDate, s2endDate
app.post("/api/cert/condition/search", async (req, res) => {
  // console.log(req.body.param);
  // const { auditor_email } = req.params;
  // const { searchName } = req.params;
  // console.log(auditor_email, searchName);
  const result = await mysql.query("certByEmailDate", [
    req.body.param[0],
    req.body.param[1],
    req.body.param[2],
  ]);
  // console.log(result);
  res.send(result);
});

// 심사정보 auditList admin 검색 s2startDate, s2endDate
app.post("/api/cert/admin/search", async (req, res) => {
  // console.log(req.body.param);
  // const { auditor_email } = req.params;
  // const { searchName } = req.params;
  // console.log(auditor_email, searchName);
  const result = await mysql.query("certByAdmin", [
    req.body.param[0],
    req.body.param[1],
    // req.body.param[2],
  ]);
  // console.log(result);
  res.send(result);
});

// 심사보고서 전체조회 by 심사원
app.post("/api/report/list/search", async (req, res) => {
  // console.log(req.body.param);
  // const { auditor_email } = req.params;
  // const { searchName } = req.params;
  // console.log(auditor_email, searchName);
  const result = await mysql.query("reportListAllByAuditNo", [
    req.body.param,
    // req.body.param[0],
    // req.body.param[2],
    // req.body.param[3],
  ]);
  // console.log(result);
  res.send(result);
});

// 심사보고서 전체조회 All
app.post("/api/report/all", async (req, res) => {
  // console.log(req.body.param);
  // const { auditor_email } = req.params;
  // const { searchName } = req.params;
  // console.log(auditor_email, searchName);
  const result = await mysql.query("reportListAll", [
    req.body.param,
    // req.body.param[0],
    // req.body.param[2],
    // req.body.param[3],
  ]);
  // console.log(result);
  res.send(result);
});

// 업로드보고서 전체조회
app.post("/api/upload/list/search", async (req, res) => {
  // console.log(req.body.param);
  // const { auditor_email } = req.params;
  // const { searchName } = req.params;
  // console.log(auditor_email, searchName);
  const result = await mysql.query("uploadReportListAllByAuditNo", [
    // req.body.param[1],
    req.body.param[0],
    req.body.param[1],
    // req.body.param[2],
  ]);
  // console.log(result);
  res.send(result[0]);
});

// 심사현황 시그널램프 조회 by auditor all join
app.post("/api/mgt/signal/search", async (req, res) => {
  // console.log(req.body.param);
  // const { auditor_email } = req.params;
  // const { searchName } = req.params;
  // console.log(auditor_email, searchName);
  const result = await mysql.query("allJoin", [
    // req.body.param[1],
    req.body.param[1],
    req.body.param[0],
    // req.body.param[2],
  ]);
  // console.log(result);
  res.send(result);
});

// 심사현황 시그널램프 조회 by admin all join
app.post("/api/mgt/signal/all", async (req, res) => {
  const result = await mysql.query("allJoinAdmin", [req.body.param]);
  // console.log(result);
  res.send(result);
});

// 심사현황 시그널램프 조회 by admin audit_no
app.get("/api/mgt/signal/:audit_no", async (req, res) => {
  // console.log(req.body.param);
  const { audit_no } = req.params;
  // const { searchName } = req.params;
  // console.log(audit_no);
  const result = await mysql.query("allJoinAdminByAuditNo", audit_no);
  // console.log(result);
  res.send(result[0]);
});

//테스트용
// app.get("/api/customer/search", async (req, res) => {
//   console.log(req.body.param);
//   // const { auditor_email } = req.params;
//   const customerListByEmailAndSearchName = await mysql.query(
//     "customerListByEmailAndSearchName",
//     [req.body.param, searchName]
//   );
//   res.send(customerListByEmailAndSearchName);
// });

// checkbox 저장 테스트
app.post("/api/checkbox", async (req, res) => {
  const result = await mysql.query("insertCheckValue", req.body.param);
  res.send(result);
});

// 세금계산서 발행정보 생성
app.post("/api/tax", async (req, res) => {
  const result = await mysql.query("insertTaxInvoice", req.body.param);
  // console.log(result);
  res.send(result);
});

// 세금계산서 발행정보 조회 by audit_no
app.get("/api/tax/:audit_no", async (req, res) => {
  const { audit_no } = req.params;
  const result = await mysql.query("getTaxInvoice", audit_no);
  // console.log(result);
  res.send(result[0]);
});

// 입금정보 생성
app.post("/api/fee", async (req, res) => {
  const result = await mysql.query("insertCash", req.body.param);
  // console.log(result);
  res.send(result);
});

// 인증서발행정보 조회
app.get("/api/mgt/cert/list", async (req, res) => {
  // const { audit_no } = req.params;
  const result = await mysql.query("getCertList");
  console.log(result);
  res.send(result);
});

// 인증서발행정보 by audit_no 조회
app.get("/api/mgt/cert/:audit_no", async (req, res) => {
  const { audit_no } = req.params;
  const result = await mysql.query("getCertListByAuditNo", audit_no);
  console.log(result);
  res.send(result);
});

// 인증서발행정보 수정
app.put("/api/cert/update/:audit_no", async (req, res) => {
  const { audit_no } = req.params;
  // console.log(req.body.param);
  // console.log(customer_id);
  const result = await mysql.query("updateCertListByAuditNo", [
    req.body.param,
    audit_no,
  ]); // body에 실려온 자료 중 첫번째 ?표에 req.body.param에 auditor_id는 두번째 ?에 입력됨.
  res.send(result);
});

// 인증서업로드정보 by audit_no 조회
app.get("/api/upload/cert/:audit_no", async (req, res) => {
  const { audit_no } = req.params;
  const result = await mysql.query("getUploadCert", audit_no);
  console.log(result);
  res.send(result[0]);
});

/*
// route alias 실무에서는 번거로우니까 이렇게 사용함.
app.post("/api/:alias", async (req, res) => {
  const auditorList = await mysql.query(req.params.alias, req.body.param);
  res.send(auditorList);
});
*/

// nodemailer --------------------------------------------------------------------------------------------------------------
app.post("/api/email", async (req, res) => {
  const r = await nodemailer.send(req.body.param);
  res.send(r);
});

// File download --------------------------------------------------------------------------------------------------------------
app.get("/api/file/:filename", (req, res) => {
  // 다운로드 받고 싶은 파일명
  // const fileName = req.params.filename;

  console.log(req.params.filename);
  const file = "./uploads/" + req.params.filename;
  // console.log(file);
  try {
    if (fs.existsSync(file)) {
      // const mimetype = mime.getType(file);
      // const filename = path.basename(file);
      // res.setHeader("Content-disposition", "attachment; filename=" + filename); // 다운 파일명
      // res.setHeader("Content-type", mimetype); // 파일 형식 지정
      // const filestream = fs.createReadStream(file);
      // filestream.pipe(res);
      res.download(file);
    } else {
      res.send("요청한 파일이 존재하지 않습니다");
    }
  } catch (e) {
    console.log(e);
    res.send("파일을 다운로드 하는 중에 에러가 발생했습니다.");
  }
});

// cookie-parser ---------------------------------------------------------------------------------------------------
app.use(cookieParser());

// express-session -----------------------------------------------------------------------------------------------------

let sess = {
  secret: "secret key", // 암호화해서 상용하는 문자열키 아무거나 넣어도 상관없음.
  resave: "false", //세션에 변경사항이 없어도 항상 다시 저장할지 여부
  saveUninitialized: true, // 초기화되지 않은 세션을 저장소에 강제로 저장할지 여부
  cookie: {
    // 로그인 되었다는 것을 클라이언트에도 알려주기 위해 쿠키에 저장
    httpOnly: true, // document.cookie해도 쿠키 정보를 볼 수 없음.
    secure: false, // https
    maxAge: 1000 * 60 * 2, // 1000이 1초, 쿠키가 유지되는 시간
  },
};
/*
// 운영환경에서는 https로 
// if (app.get("env") == "prod") {
//   sess.cookie.secure = true;
// }
*/
app.use(session(sess));

app.post("/login", async (req, res) => {
  // const { email, pw } = req.body.param;
  const user = {
    userEmail: req.body.user.email,
    userPw: req.body.user.pw,
  };
  // console.log(user.userEmail, user.userPw);
  //데이터 베이스에 해당하는 사용자가 있는지, 비밀번호 맞는지 체크해야 함..있다면 로그인 시킴
  let result = await mysql.query("getUserForLogin", user.userEmail);
  result = JSON.parse(JSON.stringify(result));
  // console.log(result);
  if (result.length == 0) {
    res.json({
      success: false,
      message: "등록되지 않은 사용자입니다.",
    });
  } else {
    if (result[0].user_pw == user.userPw) {
      res.json({
        success: true,
        message: `${result[0].user_name}위원님 반갑습니다!`,
        userData: result[0],
      });
    } else {
      res.json({
        success: false,
        message: "비밀번호가 틀렸습니다.",
      });
    }
  }

  // session이용해서 로그인 처리
  // req.session.email = user.userEmail;
  // console.log(req.session.email);
  // req.session.isLogined = true;
  // console.log(req.session.isLogined);
  // console.log(req.session);
  // req.session.save((err) => {
  //   // 위에 두즐 저장
  //   if (err) throw err;

  //   res.send(req.session);
  // });
  // ==end session이용해서 로그인 처리 =====
});

/* 카카오 로그인
  try {
    await mysql.query("signUp", req.body.param);
    if (req.body.param.length > 0) {
      for (let key in req.body.param[0])
        req.session[key] = req.body.param[0][key];
      res.send(req.body.parma[0]);
    } else {
      res.send({ error: "로그인 실패! 시스템 관리자에게 문의하세요" });
    }
  } catch (err) {
    res.send({ error: "DB처리과정에서 오류발생!" });
  }
});
카카오로그인 끝 */

app.post("/logout", (req, res) => {
  if (req.session.email) {
    req.session.destroy();
    res.redirect("/login");
  }
});

// 반드시 로그인, 로그아웃 밑에 위치
// 어떤 요청이 오더라도 먼저 로그인 되었는지 확인하고 로그인 되었으면 next로 다음 요청 수행
// 이 코드 밑에 나오는 라우터 는 무조건 로그인 확인하는 것

app.all("*", (req, res, next) => {
  if (req.session.email) {
    console.log(req.cookies); // 사용자의 암호화된 쿠키정보 볼 수 있음.포스트맨 로그인 후 test실행하면.
    next();
  } else {
    res.redirect("/login");
  }
});

// app.get("/test", (req, res) => {
//   // 무조건 로그인 됐는지 먼저 확인
//   // if (!req.session.email) {
//   //   res.redirect("/login");
//   // }
//   res.send("Ok");
// });

// 작업스케줄러 ------------------------------------------------------------------------------------------------------
// cron.schedule("* * * * * *", () => {
//   console.log("1초마다 작업이 실행 됩니다.");
// });
// cron.schedule("* * * * *", () => {
//   console.log("1분마다 작업이 실행됩니다");
// });
// cron.schedule("2 * * * *", () => {
//   console.log("매 시간의 2분마다 작업이 실행됩니다");
// });
// cron.schedule("1,2,4,5 * * * *", () => {
//   console.log("매 시간의 1, 2, 4, 5분 마다 작업이 실행됩니다."); // 8시1분, 8시2분, 8시4분, 8시5분, 9시1분 .....
// });
// cron.schedule("1-5 * * * *", () => {
//   console.log("매 시간의 1, 2, 4, 5분 마다 작업이 실행됩니다.");
// });
// cron.schedule("0 9 * * 1", () => {
//   console.log("매주 월요일 09시에 작업이 실행됩니다.");
// });
// cron.schedule("0 21 * * *", () => {
//   console.log("매일밤 9시에 작업이 실행됩니다.");
// });

//동작하는 것을 정해주고 싶으면
// const task = cron.schedule(
//   "* * * * * *",
//   () => {
//     console.log("1초마다 작업이 실행 됩니다.");
//   },
//   { scheduled: false } // 이렇게 하면 실행이 안되고 있다가 누군가가 task.start()라는 함수를 호출을 해주야만 실행
// );

// task.start();
// task.stop(); // 작업을 멈춤
// task.destroy(); // 작업을 완전히 삭제

// 1분마다 db에서 자료 가져와서 보내려면
// cron.schedule("* * * * *", async () => {
//   const auditorList = await mysql.query("auditorList");
//   const h = [];
//   h.push(`<table style="border:1px solid black;border-collapse:collapse;">`);
//   h.push(`<thead>`);
//   h.push(`<tr>`);
//   h.push(`<th style="border:1px solid black;">Auditor ID</th>`);
//   h.push(`<th style="border:1px solid black;">Auditor Name</th>`);
//   h.push(`<th style="border:1px solid black;">Auditor Gender</th>`);
//   h.push(`<th style="border:1px solid black;">Auditor Scheme</th>`);
//   h.push(`<th style="border:1px solid black;">Auditor Grade</th>`);
//   h.push(`</tr>`);
//   h.push(`</thead>`);
//   h.push(`<tbody>`);
//   auditorList.forEach((auditor) => {
//     h.push(`<tr>`);
//     h.push(`<td style="border:1px solid black;">${auditor.auditor_id}</td>`);
//     h.push(`<td style="border:1px solid black;">${auditor.auditor_name}</td>`);
//     h.push(
//       `<td style="border:1px solid black;">${auditor.auditor_gender}</td>`
//     );
//     h.push(
//       `<td style="border:1px solid black;">${auditor.auditor_scheme}</td>`
//     );
//     h.push(`<td style="border:1px solid black;">${auditor.auditor_grade}</td>`);
//     h.push(`</tr>`);
//   });

//   h.push(`</body>`);
//   h.push(`<table>`);

//   const emailData = {
//     from: "spark616@gmail.com",
//     to: "spark616@gmail.com",
//     subject: "심사원현황",
//     html: h.join(""),
//   };

//   // await nodemailer.send(emailData);
// });

// 엑셀 Read, Write --------------------------------------------------------------------------------------------------
/*
const rWorkbook = xlsx.readFile("./xlsx/test.xlsx"); // 엑셀파일 읽기
const rfirstSheetName = rWorkbook.SheetNames[0]; // 첫번째 시트 이름
const rfirstSheet = rWorkbook.Sheets[rfirstSheetName]; // 첫번째 시트
console.log(rfirstSheet["A2"].v);
rfirstSheet["B2"].v = "spark616@gmail.com"; // 이메일 주소 변경
rfirstSheet["A3"] = { t: "s", v: "Park" }; // 새로운 셀값 추가

xlsx.writeFile(rWorkbook, "./xlsx/test2.xlsx"); //변경된 내용을 새로운 엑셀 파일로 생성
*/

// 엑셀 파일 생성 ---------------------------------------------------------------------------------------------------------
/*
const writeWorkbook = xlsx.utils.book_new(); // 가상의 엑셀 파일 생성

const customers = [
  { name: "고객명", email: "이메일", phone: "연락처" },
  { name: "박성훈", email: "spark616@gmail.com", phone: "010-2222-2222" },
  { name: "이상영", email: "leesy@hanmail.net", phone: "010-2222-1111" },
  { name: "박정은", email: "pje@naver.com", phone: "010-2233-4554" },
];

const writefirstSheet = xlsx.utils.json_to_sheet(customers, {
  header: ["name", "email", "phone"],
  skipHeader: true, // skipHeader가 false이면 엑셀시트의 처번째 행에 header에 해당하는 name, email, phone나오게 됨
});

writefirstSheet["!cols"] = [
  { wpx: 120 }, // name열 너비
  { wpx: 250 }, // email열 너비
  { wpx: 200 }, // phone열 너비
];

// xlsx.utils.book_append_sheet(writeWorkbook, writefirstSheet, "Customers");
// xlsx.writeFile(writeWorkbook, "./xlsx/customers.xlsx");
*/

//엑셀 다운로드 --------------------------------------------------------------------------------------------------
app.get("/api/xlsx/auditorList", async (req, res) => {
  const workbook = xlsx.utils.book_new();
  const auditorList = await mysql.query("auditorList");
  // console.log(auditorList);

  const firstSheet = xlsx.utils.json_to_sheet(auditorList, {
    header: [
      "auditor_id",
      "auditor_name",
      "auditor_gender",
      "auditor_scheme",
      "auditor_grade",
    ],
    skipHeader: false, // skipHeader가 false이면 엑셀시트의 처번째 행에 header에 해당하는 name, email, phone나오게 됨
  });

  firstSheet["!cols"] = [
    { wpx: 120 }, // ID열 너비
    { wpx: 250 }, // Name열 너비
    { wpx: 200 }, // Gender열 너비
    { wpx: 200 }, // Scheme열 너비
    { wpx: 200 }, // Grade열 너비
  ];

  xlsx.utils.book_append_sheet(workbook, firstSheet, "auditorList");
  res.setHeader("Content-disposition", "attachment; filename = Auditors.xlsx");
  res.setHeader(
    "Content-type",
    "application/vnd.openxmlformats-officedocument.spreadsheet's.sheet"
  );
  const downloadFile = Buffer.from(
    // 물리적인 파일이 아님. 일회성 파일
    xlsx.write(workbook, { type: "base64" }),
    "base64"
  );
  res.end(downloadFile);
});
