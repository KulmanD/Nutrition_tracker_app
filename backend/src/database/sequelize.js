const { Sequelize } = require("sequelize");
const databaseConfig = require("./config");

const sequelize = new Sequelize(
  databaseConfig.database,
  databaseConfig.username,
  databaseConfig.password,
  {
    host: databaseConfig.host,
    port: databaseConfig.port,
    dialect: "mysql",
    logging: databaseConfig.logging ? console.log : false
  }
);

module.exports = sequelize;
