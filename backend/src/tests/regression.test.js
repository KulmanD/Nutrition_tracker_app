// Post-restructure regression suite. Implements the regression-specific checks from
// docs/REGRESSION_TEST_PLAN.md: the behaviors that broke in the past, plus
// cross-cutting checks (response envelope, CORS). The broad functional surface is
// covered by api.test.js, and models/relationships/persistence by a4Coverage.test.js.
//
// Run with: node --test src/tests/regression.test.js  (or npm run test:regression)
// Requires MySQL running and port 3000 free. The server is spawned with AI_MODE=mock
// so AI assertions are deterministic and need no key.

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawn, spawnSync } = require("node:child_process");
const path = require("node:path");
const { io } = require("socket.io-client");

const BASE = "http://localhost:3000";
const FRONTEND_ORIGIN = "http://localhost:5173";
const ROOT = path.resolve(__dirname, "..", ".."); // backend/

// A 1x1 PNG so the multipart upload passes type/size validation.
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

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
      // not ready yet
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
  const json = await response.json().catch(() => null);
  return { status: response.status, headers: response.headers, body: json };
}

function connectSocket() {
  return new Promise((resolve, reject) => {
    const socket = io(BASE, { transports: ["websocket"], reconnection: false, timeout: 4000 });
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error("Socket.IO connection timed out"));
    }, 5000);
    socket.once("connect", () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once("connect_error", (error) => {
      clearTimeout(timer);
      socket.close();
      reject(error);
    });
  });
}

function waitForSocketEvent(socket, eventName, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName, handler);
      reject(new Error(`Timed out waiting for ${eventName}`));
    }, timeoutMs);
    function handler(payload) {
      clearTimeout(timer);
      socket.off(eventName, handler);
      resolve(payload);
    }
    socket.once(eventName, handler);
  });
}

const userHeaders = { "x-user-role": "user", "x-user-id": "1" };
const adminHeaders = { "x-user-role": "admin", "x-user-id": "1" };

function validMeal(overrides = {}) {
  return {
    userId: 1,
    mealName: "regression meal",
    mealDate: "2026-05-06",
    items: [
      { foodName: "egg", confirmedPortionGrams: 60, calories: 78, protein: 6, carbs: 1, fat: 5 }
    ],
    ...overrides
  };
}

let serverProcess;

before(() => {
  const setup = spawnSync("npm", ["run", "db:setup"], { cwd: ROOT, stdio: "pipe" });
  if (setup.status !== 0) {
    const details = setup.stderr ? setup.stderr.toString() : "unknown error";
    throw new Error(`db:setup failed: ${details}`);
  }
});

before(async () => {
  serverProcess = startServer();
  await waitForServer();
});

after(async () => {
  await stopServer(serverProcess);
});

describe("Regression - smoke and response envelope", () => {
  it("GET / returns the standard success envelope", async () => {
    const { status, body } = await api("GET", "/");
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.notEqual(body.data, undefined);
    assert.equal(body.error, null);
  });
});

describe("Regression - CORS allows the frontend origin", () => {
  it("includes Access-Control-Allow-Origin for the frontend", async () => {
    const { headers } = await api("GET", "/", undefined, { Origin: FRONTEND_ORIGIN });
    assert.equal(headers.get("access-control-allow-origin"), FRONTEND_ORIGIN);
  });

  it("answers the preflight OPTIONS request", async () => {
    const response = await fetch(`${BASE}/meals`, {
      method: "OPTIONS",
      headers: {
        Origin: FRONTEND_ORIGIN,
        "Access-Control-Request-Method": "POST"
      }
    });
    assert.equal(response.status, 204);
  });
});

describe("Regression - meal validation and type checks", () => {
  it("400 - negative calories", async () => {
    const { status, body } = await api(
      "POST",
      "/meals",
      validMeal({ items: [{ foodName: "x", confirmedPortionGrams: 50, calories: -1, protein: 0, carbs: 0, fat: 0 }] }),
      userHeaders
    );
    assert.equal(status, 400);
    assert.equal(body.success, false);
  });

  it("400 - portion must be greater than zero", async () => {
    const { status } = await api(
      "POST",
      "/meals",
      validMeal({ items: [{ foodName: "x", confirmedPortionGrams: 0, calories: 10, protein: 1, carbs: 1, fat: 1 }] }),
      userHeaders
    );
    assert.equal(status, 400);
  });

  it("400 - missing mealName", async () => {
    const body = validMeal();
    delete body.mealName;
    const { status } = await api("POST", "/meals", body, userHeaders);
    assert.equal(status, 400);
  });

  it("400 - non-numeric meal id", async () => {
    const { status } = await api("GET", "/meals/abc");
    assert.equal(status, 400);
  });
});

describe("Regression - meals persist (create, read, delete)", () => {
  it("creates, reads back, then deletes a meal", async () => {
    const unique = `regression create ${Date.now()}`;
    const created = await api("POST", "/meals", validMeal({ mealName: unique }), userHeaders);
    assert.equal(created.status, 201);
    const mealId = created.body.data.mealId;

    const fetched = await api("GET", `/meals/${mealId}`);
    assert.equal(fetched.status, 200);
    assert.equal(fetched.body.data.mealName, unique);

    const deleted = await api("DELETE", `/meals/${mealId}`, undefined, adminHeaders);
    assert.equal(deleted.status, 200);

    const gone = await api("GET", `/meals/${mealId}`);
    assert.equal(gone.status, 404);
  });

  it("403 - delete requires admin role", async () => {
    const created = await api("POST", "/meals", validMeal(), userHeaders);
    const mealId = created.body.data.mealId;
    const forbidden = await api("DELETE", `/meals/${mealId}`, undefined, userHeaders);
    assert.equal(forbidden.status, 403);
    await api("DELETE", `/meals/${mealId}`, undefined, adminHeaders);
  });
});

describe("Regression - dashboard defaults to local today", () => {
  it("returns today's dashboard when no date is supplied", async () => {
    const { status, body } = await api("GET", "/dashboard/today?userId=1");
    assert.equal(status, 200);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    assert.equal(body.data.date, today);
    assert.ok(Array.isArray(body.data.meals));
  });
});

describe("Regression - AI analyze returns detected items (mock)", () => {
  it("accepts a multipart image and returns detected items", async () => {
    const form = new FormData();
    form.append("image", new Blob([TINY_PNG], { type: "image/png" }), "meal.png");
    const response = await fetch(`${BASE}/api/ai/analyze-image`, {
      method: "POST",
      headers: { "x-user-id": "1", "x-user-role": "user" },
      body: form
    });
    const json = await response.json();
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(json.data.detectedItems));
    assert.ok(json.data.detectedItems.length >= 1);
    assert.ok(json.data.detectedItems[0].estimatedPortionGrams !== undefined);
  });
});

describe("Regression - reviewed AI meal uses owner from header", () => {
  it("saves the meal for the header user and ignores the body userId", async () => {
    const unique = `regression from-ai ${Date.now()}`;
    const payload = {
      analysisId: "regression-analysis",
      mealName: unique,
      mealDate: "2026-05-06",
      imagePath: "uploads/regression.png",
      userId: 999,
      items: [
        { foodName: "rice", confirmedPortionGrams: 150, calories: 200, protein: 4, carbs: 44, fat: 1 }
      ]
    };
    const saved = await api("POST", "/api/meals/from-ai", payload, {
      "x-user-id": "2",
      "x-user-role": "user"
    });
    assert.ok(saved.status === 200 || saved.status === 201);
    const mealId = saved.body.data.mealId;

    // The meal must belong to user 2 (the header), not 999 (the body).
    const forUser2 = await api("GET", "/meals?userId=2");
    const ids = forUser2.body.data.map((meal) => meal.mealId);
    assert.ok(ids.includes(mealId), "saved meal should belong to the header user (2)");

    await api("DELETE", `/meals/${mealId}`, undefined, adminHeaders);
  });
});

describe("Regression - Socket.IO realtime events", () => {
  it("broadcasts presence:updated after presence:join", async () => {
    const socket = await connectSocket();
    try {
      const updated = waitForSocketEvent(socket, "presence:updated");
      socket.emit("presence:join", { userId: 1, fullName: "Regression User" });
      const payload = await updated;
      assert.ok(Array.isArray(payload.onlineUsers));
    } finally {
      socket.close();
    }
  });

  it("broadcasts meal:created and dashboard:updated when a meal is created", async () => {
    const socket = await connectSocket();
    try {
      const mealCreated = waitForSocketEvent(socket, "meal:created");
      const dashboardUpdated = waitForSocketEvent(socket, "dashboard:updated");
      const created = await api("POST", "/meals", validMeal({ mealName: `socket regression ${Date.now()}` }), userHeaders);
      const mealId = created.body.data.mealId;

      const mealPayload = await mealCreated;
      const dashboardPayload = await dashboardUpdated;
      assert.equal(mealPayload.userId, 1);
      assert.equal(dashboardPayload.userId, 1);

      await api("DELETE", `/meals/${mealId}`, undefined, adminHeaders);
    } finally {
      socket.close();
    }
  });
});
