const mysql = require("mysql");
const sql = require("./sql");

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: process.env.MYSQL_CONNECTION_LIMIT,
});

const query = async (alias, values) => {
  return new Promise((resolve, reject) =>
    pool.query(sql[alias], values, (err, results) => {
      if (err) {
        console.log(err);
        reject({ error: err });
      } else resolve(results);
    })
  );
};

const getConnection = async () => {
  return new Promise((resolve, reject) =>
    pool.getConnection((err, connection) => {
      if (err) {
        console.log(err);
        reject({ error: err });
      } else resolve(connection);
    })
  );
};

module.exports = {
  query,
  getConnection,
};
