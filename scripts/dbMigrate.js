const fs = require("node:fs/promises");
const path = require("node:path");
const mysql = require("mysql2/promise");
const databaseConfig = require("../database/config");

function splitStatements(sql) {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function run() {
  const connection = await mysql.createConnection({
    host: databaseConfig.host,
    port: databaseConfig.port,
    user: databaseConfig.username,
    password: databaseConfig.password,
    multipleStatements: false
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseConfig.database}\``);
    await connection.changeUser({ database: databaseConfig.database });

    const migrationsDir = path.resolve(__dirname, "..", "migrations");
    const files = (await fs.readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
      const statements = splitStatements(sql);

      for (const statement of statements) {
        await connection.query(statement);
      }

      console.log(`Applied migration: ${file}`);
    }

    console.log(`Database is ready: ${databaseConfig.database}`);
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
