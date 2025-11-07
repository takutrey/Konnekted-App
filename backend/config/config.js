require("dotenv").config();
const { Sequelize } = require("sequelize");

const db = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_CONNECTION,
  }
);

try {
  db.authenticate();
} catch (error) {
  console.log("database failed", error);
}

module.exports = db;
