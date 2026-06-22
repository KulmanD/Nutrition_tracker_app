// Supplemental Assignment 4 checks that the main API suite does not assert
// directly: the required ORM models and relationships at the database level, and
// that data persists across a full backend restart.
//
// Run with: node --test src/tests/a4Coverage.test.js
// Requires MySQL running and port 3000 free. The before hook runs db:setup, which
// resets the database to the seed.

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawn, spawnSync } = require("node:child_process");
const path = require("node:path");
const mysql = require("mysql2/promise");
const databaseConfig = require("../database/config");

const BASE = "http://localhost:3000";
const ROOT = path.resolve(__dirname, "..", "..");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startServer() {
  const serverProcess = spawn("node", ["src/server.js"], {
    cwd: ROOT,
    env: { ...process.env, AI_MODE: "mock", GEMINI_API_KEY: "" },
    stdio: ["ignore", "ignore", "pipe"]
  });
  serverProcess.stderr.on("data", (data) => process.stderr.write(data));
  return serverProcess;
}

async function waitForServer(attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(BASE);
      if (response.ok) {
        return;
      }
    } catch (error) {
      // server not ready yet
    }
    await sleep(300);
  }
  throw new Error("Server did not start in time");
}

function stopServer(serverProcess) {
  return new Promise((resolve) => {
    if (!serverProcess || serverProcess.exitCode !== null) {
      resolve();
      return;
    }
    serverProcess.once("exit", () => resolve());
    serverProcess.kill();
  });
}

async function api(method, urlPath, body, headers = {}) {
  const options = { method, headers: { ...headers } };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`${BASE}${urlPath}`, options);
  const json = await response.json();
  return { status: response.status, body: json };
}

async function dbConnect() {
  return mysql.createConnection({
    host: databaseConfig.host,
    port: databaseConfig.port,
    user: databaseConfig.username,
    password: databaseConfig.password,
    database: databaseConfig.database
  });
}

let serverProcess;

before(() => {
  const setup = spawnSync("npm", ["run", "db:setup"], { cwd: ROOT, stdio: "pipe" });
  if (setup.status !== 0) {
    const details = setup.stderr ? setup.stderr.toString() : "unknown error";
    throw new Error(`db:setup failed: ${details}`);
  }
});

after(async () => {
  await stopServer(serverProcess);
});

describe("A4 — required models exist (database)", () => {
  it("has all required tables (users, admins, foods, meals, meal_items, user_settings)", async () => {
    const connection = await dbConnect();
    try {
      const [rows] = await connection.query("SHOW TABLES");
      const tables = rows.map((row) => Object.values(row)[0]);
      for (const required of ["users", "admins", "foods", "meals", "meal_items", "user_settings"]) {
        assert.ok(tables.includes(required), `missing required table: ${required}`);
      }
    } finally {
      await connection.end();
    }
  });
});

describe("A4 — required ORM relationships (database)", () => {
  it("one-to-one: a User has an Admin profile", async () => {
    const connection = await dbConnect();
    try {
      const [rows] = await connection.query(
        "SELECT a.admin_id, a.user_id FROM admins a JOIN users u ON u.user_id = a.user_id"
      );
      assert.ok(rows.length >= 1, "expected at least one admin linked to a user");
    } finally {
      await connection.end();
    }
  });

  it("one-to-many and many-to-many: a Meal belongs to a User and links Foods through meal_items", async () => {
    const connection = await dbConnect();
    try {
      const [rows] = await connection.query(
        "SELECT m.meal_id, m.user_id, f.food_id, f.food_name " +
          "FROM meals m " +
          "JOIN meal_items mi ON mi.meal_id = m.meal_id " +
          "JOIN foods f ON f.food_id = mi.food_id " +
          "LIMIT 5"
      );
      assert.ok(rows.length >= 1, "expected meals joined to foods through meal_items");
      assert.ok(rows[0].user_id, "each meal should reference a user (one-to-many)");
      assert.ok(rows[0].food_id, "each meal_item should reference a food (many-to-many)");
    } finally {
      await connection.end();
    }
  });
});

describe("A4 — data persists after a server restart", () => {
  it("a created meal still exists after the backend restarts", async () => {
    serverProcess = startServer();
    await waitForServer();

    const uniqueName = `persistence check ${Date.now()}`;
    const created = await api(
      "POST",
      "/meals",
      {
        userId: 1,
        mealName: uniqueName,
        mealDate: "2026-05-06",
        items: [
          {
            foodName: "persistence food",
            confirmedPortionGrams: 100,
            calories: 120,
            protein: 10,
            carbs: 12,
            fat: 4
          }
        ]
      },
      { "x-user-role": "user", "x-user-id": "1" }
    );
    assert.equal(created.status, 201);
    const mealId = created.body.data.mealId;
    assert.ok(mealId, "expected a new meal id");

    // Restart the backend (stop, wait for the port to free, start again).
    await stopServer(serverProcess);
    await sleep(700);
    serverProcess = startServer();
    await waitForServer();

    // The meal must still be there, read back from MySQL after the restart.
    const fetched = await api("GET", `/meals/${mealId}`);
    assert.equal(fetched.status, 200);
    assert.equal(fetched.body.data.mealName, uniqueName);

    // Clean up the test meal.
    await api("DELETE", `/meals/${mealId}`, undefined, {
      "x-user-role": "admin",
      "x-user-id": "1"
    });
  });
});
