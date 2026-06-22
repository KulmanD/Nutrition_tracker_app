const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(__dirname, "..", "..", ".env"),
  quiet: true
});

function readBoolean(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }

  return value === "true";
}

const databaseConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || "nutrition_tracker",
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  logging: readBoolean(process.env.DB_LOGGING, false)
};

module.exports = databaseConfig;
