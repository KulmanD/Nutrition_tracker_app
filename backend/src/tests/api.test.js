const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { spawn, spawnSync } = require("node:child_process");
const path = require("node:path");
const { io } = require("socket.io-client");
const { getLocalDateString } = require("../utils/dateHelper");

const BASE = "http://localhost:3000";
const ROOT_DIR = path.resolve(__dirname, "..", "..");
let serverProcess;

// ── Helpers ──────────────────────────────────────────────

async function api(method, urlPath, body, headers = {}) {
  const opts = { method, headers: { ...headers } };
  if (body !== undefined) {
    if (typeof body === "string") {
      opts.headers["Content-Type"] = "application/json";
      opts.body = body;                       // raw string (for invalid-JSON test)
    } else {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(`${BASE}${urlPath}`, opts);
  const json = await res.json();
  return { status: res.status, body: json };
}

async function multipartApi(urlPath, formData, headers = {}) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method: "POST",
    headers,
    body: formData
  });
  const json = await res.json();
  return { status: res.status, body: json };
}

function assertSuccess(body) {
  assert.equal(body.success, true, "success should be true");
  assert.notEqual(body.data, undefined, "data should exist");
  assert.equal(body.error, null, "error should be null");
}

function assertError(body, expectedCode) {
  assert.equal(body.success, false, "success should be false");
  assert.equal(body.data, null, "data should be null");
  assert.equal(typeof body.error, "object", "error should be an object");
  assert.equal(typeof body.error.code, "string");
  assert.equal(typeof body.error.message, "string");
  assert.notEqual(body.error.details, undefined, "details should exist");
  if (expectedCode) {
    assert.equal(body.error.code, expectedCode);
  }
}

async function waitForServer(attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    try { await fetch(BASE); return; }
    catch { await new Promise(r => setTimeout(r, 300)); }
  }
  throw new Error("Server did not start");
}

function runSetupCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT_DIR,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);
  }
}

function connectSocket() {
  return new Promise((resolve, reject) => {
    const socket = io(BASE, {
      transports: ["websocket"],
      reconnection: false,
      timeout: 2000
    });

    const timer = setTimeout(() => {
      socket.close();
      reject(new Error("Socket.IO connection timed out"));
    }, 2500);

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

function waitForSocketEvent(socket, eventName) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName, handler);
      reject(new Error(`Timed out waiting for ${eventName}`));
    }, 2500);

    function handler(payload) {
      clearTimeout(timer);
      resolve(payload);
    }

    socket.once(eventName, handler);
  });
}

// ── Lifecycle ────────────────────────────────────────────

before(async () => {
  runSetupCommand("npm", ["run", "db:migrate"]);
  runSetupCommand("node", ["src/scripts/dbSeed.js", "--reset"]);

  serverProcess = spawn("node", ["src/server.js"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      AI_MODE: "mock",
      GEMINI_API_KEY: ""
    },
    stdio: "pipe"
  });
  serverProcess.stderr.on("data", d => process.stderr.write(d));
  await waitForServer();
});

after(() => { if (serverProcess) serverProcess.kill(); }); //kill server when done

// ── Valid meal body helper ───────────────────────────────

const validMealBody = {
  userId: 1,
  mealName: "test meal",
  mealDate: "2026-05-07",
  items: [
    { foodName: "egg", confirmedPortionGrams: 60, calories: 78, protein: 6, carbs: 1, fat: 5 }
  ]
};

const validAiMealBody = {
  analysisId: "mock-analysis-1",
  mealName: "AI reviewed lunch",
  mealDate: "2026-05-07",
  imagePath: "uploads/mock-meal.jpg",
  userId: 999,
  items: [
    { foodName: "chicken breast", confirmedPortionGrams: 180, calories: 297, protein: 55.8, carbs: 0, fat: 6.5 },
    { foodName: "white rice", confirmedPortionGrams: 200, calories: 260, protein: 5.4, carbs: 56, fat: 0.6 }
  ]
};

// ═════════════════════════════════════════════════════════
//  HOME
// ═════════════════════════════════════════════════════════

describe("GET /", () => {
  it("returns 200 with success format", async () => {
    const { status, body } = await api("GET", "/");
    assert.equal(status, 200);
    assertSuccess(body);
    assert.equal(typeof body.data.message, "string");
  });
});

// ═════════════════════════════════════════════════════════
//  USERS CRUD
// ═════════════════════════════════════════════════════════

describe("Users — GET /users", () => {
  it("200 — returns array of users", async () => {
    const { status, body } = await api("GET", "/users", undefined, { "x-user-role": "admin" });
    assert.equal(status, 200);
    assertSuccess(body);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);
    const u = body.data[0];
    assert.ok("userId" in u && "firstName" in u && "lastName" in u);
    assert.ok("createDate" in u && "updateDate" in u && "userRole" in u);
  });
});

describe("Users — GET /users/:id", () => {
  it("200 — valid id returns user", async () => {
    const { status, body } = await api("GET", "/users/1", undefined, { "x-user-role": "user", "x-user-id": "1" });
    assert.equal(status, 200);
    assertSuccess(body);
    assert.equal(body.data.userId, 1);
  });

  it("404 — non-existent id", async () => {
    const { status, body } = await api("GET", "/users/999", undefined, { "x-user-role": "admin" });
    assert.equal(status, 404);
    assertError(body, "USER_NOT_FOUND");
  });

  it("400 — non-numeric id", async () => {
    const { status, body } = await api("GET", "/users/abc", undefined, { "x-user-role": "admin" });
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("400 — negative id", async () => {
    const { status, body } = await api("GET", "/users/-1", undefined, { "x-user-role": "admin" });
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("400 — zero id", async () => {
    const { status, body } = await api("GET", "/users/0", undefined, { "x-user-role": "admin" });
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });
});

describe("Users — POST /users", () => {
  it("201 — creates user with valid body and admin role", async () => {
    const { status, body } = await api("POST", "/users",
      { firstName: "Test", lastName: "User", userRole: "user" },
      { "x-user-role": "admin" }
    );
    assert.equal(status, 201);
    assertSuccess(body);
    assert.equal(typeof body.data.userId, "number");
  });

  it("201 — manager role can also create", async () => {
    const { status, body } = await api("POST", "/users",
      { firstName: "M", lastName: "User", userRole: "user" },
      { "x-user-role": "manager" }
    );
    assert.equal(status, 201);
    assertSuccess(body);
  });

  it("403 — missing x-user-role header", async () => {
    const { status, body } = await api("POST", "/users",
      { firstName: "A", lastName: "B", userRole: "user" }
    );
    assert.equal(status, 403);
    assertError(body, "FORBIDDEN");
  });

  it("403 — unauthorized role (user)", async () => {
    const { status, body } = await api("POST", "/users",
      { firstName: "A", lastName: "B", userRole: "user" },
      { "x-user-role": "user" }
    );
    assert.equal(status, 403);
    assertError(body, "FORBIDDEN");
  });

  it("400 — missing firstName", async () => {
    const { status, body } = await api("POST", "/users",
      { lastName: "B", userRole: "user" },
      { "x-user-role": "admin" }
    );
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("400 — missing lastName", async () => {
    const { status, body } = await api("POST", "/users",
      { firstName: "A", userRole: "user" },
      { "x-user-role": "admin" }
    );
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("400 — missing userRole", async () => {
    const { status, body } = await api("POST", "/users",
      { firstName: "A", lastName: "B" },
      { "x-user-role": "admin" }
    );
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("400 — empty body", async () => {
    const { status, body } = await api("POST", "/users", {}, { "x-user-role": "admin" });
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });
});

describe("Users — PUT /users/:id", () => {
  it("200 — updates existing user", async () => {
    const { status, body } = await api("PUT", "/users/1",
      { firstName: "Updated", lastName: "Admin", userRole: "admin" },
      { "x-user-role": "admin" }
    );
    assert.equal(status, 200);
    assertSuccess(body);
  });

  it("200 — regular user updates own user record", async () => {
    const { status, body } = await api("PUT", "/users/1",
      { firstName: "Self", lastName: "Update", userRole: "user" },
      { "x-user-role": "user", "x-user-id": "1" }
    );
    assert.equal(status, 200);
    assertSuccess(body);
  });

  it("403 — regular user cannot update another user", async () => {
    const { status, body } = await api("PUT", "/users/2",
      { firstName: "A", lastName: "B", userRole: "user" },
      { "x-user-role": "user", "x-user-id": "1" }
    );
    assert.equal(status, 403);
    assertError(body, "FORBIDDEN");
  });

  it("404 — non-existent id", async () => {
    const { status, body } = await api("PUT", "/users/999",
      { firstName: "A", lastName: "B", userRole: "user" },
      { "x-user-role": "admin" }
    );
    assert.equal(status, 404);
    assertError(body, "USER_NOT_FOUND");
  });

  it("400 — invalid id", async () => {
    const { status, body } = await api("PUT", "/users/abc",
      { firstName: "A", lastName: "B", userRole: "user" },
      { "x-user-role": "admin" }
    );
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("400 — missing required fields", async () => {
    const { status, body } = await api("PUT", "/users/1",
      { firstName: "Only" },
      { "x-user-role": "admin" }
    );
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("403 — regular user missing x-user-id", async () => {
    const { status, body } = await api("PUT", "/users/1",
      { firstName: "A", lastName: "B", userRole: "user" },
      { "x-user-role": "user" }
    );
    assert.equal(status, 403);
    assertError(body, "FORBIDDEN");
  });
});

describe("Users — DELETE /users/:id", () => {
  it("403 — missing role header", async () => {
    const { status, body } = await api("DELETE", "/users/2");
    assert.equal(status, 403);
    assertError(body, "FORBIDDEN");
  });

  it("403 — non-admin role", async () => {
    const { status, body } = await api("DELETE", "/users/2", undefined, { "x-user-role": "manager" });
    assert.equal(status, 403);
    assertError(body, "FORBIDDEN");
  });

  it("400 — invalid id", async () => {
    const { status, body } = await api("DELETE", "/users/abc", undefined, { "x-user-role": "admin" });
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("404 — non-existent id", async () => {
    const { status, body } = await api("DELETE", "/users/999", undefined, { "x-user-role": "admin" });
    assert.equal(status, 404);
    assertError(body, "USER_NOT_FOUND");
  });

  it("200 — deletes existing user", async () => {
    const { status, body } = await api("DELETE", "/users/2", undefined, { "x-user-role": "admin" });
    assert.equal(status, 200);
    assertSuccess(body);
  });

  it("404 — same id after deletion", async () => {
    const { status, body } = await api("GET", "/users/2", undefined, { "x-user-role": "admin" });
    assert.equal(status, 404);
    assertError(body, "USER_NOT_FOUND");
  });
});

// ═════════════════════════════════════════════════════════
//  MEALS CRUD
// ═════════════════════════════════════════════════════════

describe("Meals — GET /meals", () => {
  it("200 — returns array", async () => {
    const { status, body } = await api("GET", "/meals");
    assert.equal(status, 200);
    assertSuccess(body);
    assert.ok(Array.isArray(body.data));
  });

  it("200 — filter by userId", async () => {
    const { status, body } = await api("GET", "/meals?userId=1");
    assert.equal(status, 200);
    assertSuccess(body);
    body.data.forEach(m => assert.equal(m.userId, 1));
  });

  it("200 — filter by date", async () => {
    const { status, body } = await api("GET", "/meals?date=2026-05-06");
    assert.equal(status, 200);
    assertSuccess(body);
    body.data.forEach(m => assert.equal(m.mealDate, "2026-05-06"));
  });

  it("200 — filter by userId and date combined", async () => {
    const { status, body } = await api("GET", "/meals?userId=1&date=2026-05-06");
    assert.equal(status, 200);
    assertSuccess(body);
    body.data.forEach(m => {
      assert.equal(m.userId, 1);
      assert.equal(m.mealDate, "2026-05-06");
    });
  });

  it("400 — invalid userId query param", async () => {
    const { status, body } = await api("GET", "/meals?userId=abc");
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("200 — empty array when no matches", async () => {
    const { status, body } = await api("GET", "/meals?userId=9999");
    assert.equal(status, 200);
    assertSuccess(body);
    assert.ok(Array.isArray(body.data));
    assert.equal(body.data.length, 0);
  });
});

describe("Meals — GET /meals/:id", () => {
  it("200 — valid id", async () => {
    const { status, body } = await api("GET", "/meals/1");
    assert.equal(status, 200);
    assertSuccess(body);
    assert.equal(body.data.mealId, 1);
  });

  it("404 — non-existent id", async () => {
    const { status, body } = await api("GET", "/meals/999");
    assert.equal(status, 404);
    assertError(body, "MEAL_NOT_FOUND");
  });

  it("400 — non-numeric id", async () => {
    const { status, body } = await api("GET", "/meals/abc");
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });
});

describe("Meals — POST /meals", () => {
  it("201 — creates meal with valid body", async () => {
    const { status, body } = await api("POST", "/meals", validMealBody, { "x-user-role": "user" });
    assert.equal(status, 201);
    assertSuccess(body);
    assert.equal(typeof body.data.mealId, "number");

    const created = await api("GET", `/meals/${body.data.mealId}`);
    assert.equal(created.status, 200);
    assertSuccess(created.body);
    assert.equal(created.body.data.mealName, validMealBody.mealName);
    assert.equal(created.body.data.items[0].foodName, "egg");
  });

  it("403 — missing role header", async () => {
    const { status, body } = await api("POST", "/meals", validMealBody);
    assert.equal(status, 403);
    assertError(body, "FORBIDDEN");
  });

  it("400 — missing userId", async () => {
    const { mealName, mealDate, items } = validMealBody;
    const { status, body } = await api("POST", "/meals", { mealName, mealDate, items }, { "x-user-role": "user" });
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("400 — missing mealName", async () => {
    const { userId, mealDate, items } = validMealBody;
    const { status, body } = await api("POST", "/meals", { userId, mealDate, items }, { "x-user-role": "user" });
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("400 — missing mealDate", async () => {
    const { userId, mealName, items } = validMealBody;
    const { status, body } = await api("POST", "/meals", { userId, mealName, items }, { "x-user-role": "user" });
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("400 — missing items", async () => {
    const { status, body } = await api("POST", "/meals",
      { userId: 1, mealName: "x", mealDate: "2026-05-07" },
      { "x-user-role": "user" }
    );
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("400 — items is empty array", async () => {
    const { status, body } = await api("POST", "/meals",
      { userId: 1, mealName: "x", mealDate: "2026-05-07", items: [] },
      { "x-user-role": "user" }
    );
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("400 — item missing foodName", async () => {
    const { status, body } = await api("POST", "/meals",
      { userId: 1, mealName: "x", mealDate: "2026-05-07", items: [{ confirmedPortionGrams: 100 }] },
      { "x-user-role": "user" }
    );
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("400 — item missing confirmedPortionGrams", async () => {
    const { status, body } = await api("POST", "/meals",
      { userId: 1, mealName: "x", mealDate: "2026-05-07", items: [{ foodName: "rice" }] },
      { "x-user-role": "user" }
    );
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("400 — items is not an array", async () => {
    const { status, body } = await api("POST", "/meals",
      { userId: 1, mealName: "x", mealDate: "2026-05-07", items: "not-array" },
      { "x-user-role": "user" }
    );
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });
});

describe("Meals — PUT /meals/:id", () => {
  it("200 — updates existing meal", async () => {
    const { status, body } = await api("PUT", "/meals/1", validMealBody, { "x-user-role": "user" });
    assert.equal(status, 200);
    assertSuccess(body);

    const updated = await api("GET", "/meals/1");
    assert.equal(updated.status, 200);
    assertSuccess(updated.body);
    assert.equal(updated.body.data.mealName, validMealBody.mealName);
    assert.equal(updated.body.data.mealDate, validMealBody.mealDate);
    assert.equal(updated.body.data.totalCalories, 78);
    assert.equal(updated.body.data.totalProtein, 6);
    assert.equal(updated.body.data.totalCarbs, 1);
    assert.equal(updated.body.data.totalFat, 5);
    assert.equal(updated.body.data.items.length, 1);
    assert.equal(updated.body.data.items[0].foodName, "egg");
    assert.equal(updated.body.data.items[0].confirmedPortionGrams, 60);
  });

  it("404 — non-existent id", async () => {
    const { status, body } = await api("PUT", "/meals/999", validMealBody, { "x-user-role": "user" });
    assert.equal(status, 404);
    assertError(body, "MEAL_NOT_FOUND");
  });

  it("400 — invalid id", async () => {
    const { status, body } = await api("PUT", "/meals/abc", validMealBody, { "x-user-role": "user" });
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("400 — missing required body fields", async () => {
    const { status, body } = await api("PUT", "/meals/1", { mealName: "only" }, { "x-user-role": "user" });
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("403 — missing role header", async () => {
    const { status, body } = await api("PUT", "/meals/1", validMealBody);
    assert.equal(status, 403);
    assertError(body, "FORBIDDEN");
  });
});

describe("Meals — DELETE /meals/:id", () => {
  it("403 — non-admin role", async () => {
    const { status, body } = await api("DELETE", "/meals/1", undefined, { "x-user-role": "user" });
    assert.equal(status, 403);
    assertError(body, "FORBIDDEN");
  });

  it("400 — invalid id", async () => {
    const { status, body } = await api("DELETE", "/meals/abc", undefined, { "x-user-role": "admin" });
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("404 — non-existent id", async () => {
    const { status, body } = await api("DELETE", "/meals/999", undefined, { "x-user-role": "admin" });
    assert.equal(status, 404);
    assertError(body, "MEAL_NOT_FOUND");
  });

  it("200 — deletes existing meal", async () => {
    const { status, body } = await api("DELETE", "/meals/1", undefined, { "x-user-role": "admin" });
    assert.equal(status, 200);
    assertSuccess(body);
  });

  it("404 — same id after deletion", async () => {
    const { status, body } = await api("GET", "/meals/1");
    assert.equal(status, 404);
    assertError(body, "MEAL_NOT_FOUND");
  });
});

// ═════════════════════════════════════════════════════════
//  ANALYZE IMAGE
// ═════════════════════════════════════════════════════════

describe("POST /meals/analyze-image", () => {
  it("200 — returns mock AI result", async () => {
    const { status, body } = await api("POST", "/meals/analyze-image",
      { imageName: "lunch.jpg" },
      { "x-user-role": "user" }
    );
    assert.equal(status, 200);
    assertSuccess(body);
    assert.equal(body.data.imageName, "lunch.jpg");
    assert.ok(Array.isArray(body.data.detectedItems));
    assert.ok(body.data.detectedItems.length > 0);
  });

  it("400 — missing imageName", async () => {
    const { status, body } = await api("POST", "/meals/analyze-image", {}, { "x-user-role": "user" });
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("403 — missing role header", async () => {
    const { status, body } = await api("POST", "/meals/analyze-image", { imageName: "x.jpg" });
    assert.equal(status, 403);
    assertError(body, "FORBIDDEN");
  });
});

// ═════════════════════════════════════════════════════════
//  AI IMAGE UPLOAD
// ═════════════════════════════════════════════════════════

describe("POST /api/ai/analyze-image", () => {
  function buildImageForm(filename = "meal.jpg", mimeType = "image/jpeg", bytes = Buffer.from([255, 216, 255, 224, 0, 16])) {
    const formData = new FormData();
    formData.append("image", new Blob([bytes], { type: mimeType }), filename);
    formData.append("mealDate", "2026-05-07");
    return formData;
  }

  it("200 — accepts multipart image and returns mock AI contract data", async () => {
    const { status, body } = await multipartApi("/api/ai/analyze-image", buildImageForm(), {
      "x-user-role": "user",
      "x-user-id": "1"
    });

    assert.equal(status, 200);
    assertSuccess(body);
    assert.equal(typeof body.data.analysisId, "string");
    assert.match(body.data.imagePath, /^uploads\/meal-/);
    assert.equal(body.data.modelName, "mock-gemini-vision");
    assert.ok(Array.isArray(body.data.detectedItems));
    assert.ok(body.data.detectedItems.length > 0);
    assert.equal(typeof body.data.detectedItems[0].clientItemId, "string");
    assert.equal(typeof body.data.detectedItems[0].foodName, "string");
    assert.ok("estimatedPortionGrams" in body.data.detectedItems[0]);
    assert.ok("confidence" in body.data.detectedItems[0]);
    assert.deepEqual(body.data.totals, {
      calories: 582,
      protein: 62.4,
      carbs: 60,
      fat: 7.3
    });
    assert.equal(body.data.nextStep, "review_and_confirm");

    await fs.rm(path.join(ROOT_DIR, body.data.imagePath), { force: true });
  });

  it("400 — missing image file", async () => {
    const formData = new FormData();
    formData.append("mealDate", "2026-05-07");

    const { status, body } = await multipartApi("/api/ai/analyze-image", formData, {
      "x-user-role": "user",
      "x-user-id": "1"
    });

    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
    assert.equal(body.error.details.field, "image");
  });

  it("400 — invalid image type", async () => {
    const { status, body } = await multipartApi(
      "/api/ai/analyze-image",
      buildImageForm("meal.gif", "image/gif", Buffer.from("not an allowed image")),
      {
        "x-user-role": "user",
        "x-user-id": "1"
      }
    );

    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
    assert.equal(body.error.details.field, "image");
  });

  it("400 — image over 5 MB", async () => {
    const oversizedImage = Buffer.alloc((5 * 1024 * 1024) + 1, 1);

    const { status, body } = await multipartApi(
      "/api/ai/analyze-image",
      buildImageForm("large.jpg", "image/jpeg", oversizedImage),
      {
        "x-user-role": "user",
        "x-user-id": "1"
      }
    );

    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
    assert.equal(body.error.details.field, "image");
    assert.equal(body.error.details.maxSizeMb, 5);
  });

  it("403 — missing role header", async () => {
    const { status, body } = await multipartApi("/api/ai/analyze-image", buildImageForm());

    assert.equal(status, 403);
    assertError(body, "FORBIDDEN");
  });
});

// ═════════════════════════════════════════════════════════
//  SAVE REVIEWED AI MEAL
// ═════════════════════════════════════════════════════════

describe("POST /api/meals/from-ai", () => {
  it("201 — saves reviewed AI meal, ignores body userId, and returns full saved meal", async () => {
    const { status, body } = await api("POST", "/api/meals/from-ai", validAiMealBody, {
      "x-user-role": "user",
      "x-user-id": "1"
    });

    assert.equal(status, 201);
    assertSuccess(body);
    assert.equal(typeof body.data.mealId, "number");
    assert.equal(body.data.meal.mealId, body.data.mealId);
    assert.equal(body.data.meal.userId, 1);
    assert.equal(body.data.meal.mealName, validAiMealBody.mealName);
    assert.equal(body.data.meal.mealDate, validAiMealBody.mealDate);
    assert.equal(body.data.meal.imagePath, validAiMealBody.imagePath);
    assert.equal(body.data.meal.totalCalories, 557);
    assert.equal(body.data.meal.totalProtein, 61.2);
    assert.equal(body.data.meal.totalCarbs, 56);
    assert.equal(body.data.meal.totalFat, 7.1);
    assert.ok(Array.isArray(body.data.meal.items));
    assert.equal(body.data.meal.items.length, 2);

    const created = await api("GET", `/meals/${body.data.mealId}`);
    assert.equal(created.status, 200);
    assertSuccess(created.body);
    assert.equal(created.body.data.userId, 1);
    assert.equal(created.body.data.imagePath, validAiMealBody.imagePath);
    assert.equal(created.body.data.items[0].foodName, "chicken breast");

    const dashboard = await api("GET", `/dashboard/today?userId=1&date=${validAiMealBody.mealDate}`);
    assert.equal(dashboard.status, 200);
    assertSuccess(dashboard.body);
    const dashboardMeal = dashboard.body.data.meals.find((meal) => meal.mealId === body.data.mealId);
    assert.ok(dashboardMeal, "saved AI meal should appear in dashboard results");
    assert.equal(dashboardMeal.mealName, validAiMealBody.mealName);
    assert.equal(dashboardMeal.items.length, 2);
    assert.ok(dashboardMeal.items.some((item) => item.foodName === "white rice"));
  });

  it("201 — defaults missing mealDate to local today", async () => {
    const { mealDate, ...withoutDate } = validAiMealBody;
    const { status, body } = await api("POST", "/api/meals/from-ai", {
      ...withoutDate,
      mealName: "AI reviewed today meal"
    }, {
      "x-user-role": "user",
      "x-user-id": "1"
    });

    assert.equal(status, 201);
    assertSuccess(body);
    assert.equal(body.data.meal.mealDate, getLocalDateString());
  });

  it("400 — missing x-user-id", async () => {
    const { status, body } = await api("POST", "/api/meals/from-ai", validAiMealBody, {
      "x-user-role": "user"
    });

    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
    assert.equal(body.error.details.field, "x-user-id");
  });

  it("400 — invalid x-user-id", async () => {
    const { status, body } = await api("POST", "/api/meals/from-ai", validAiMealBody, {
      "x-user-role": "user",
      "x-user-id": "abc"
    });

    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
    assert.equal(body.error.details.field, "x-user-id");
  });

  it("400 — missing analysisId", async () => {
    const { analysisId, ...withoutAnalysisId } = validAiMealBody;
    const { status, body } = await api("POST", "/api/meals/from-ai", withoutAnalysisId, {
      "x-user-role": "user",
      "x-user-id": "1"
    });

    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
    assert.equal(body.error.details.field, "analysisId");
  });

  it("400 — missing mealName", async () => {
    const { mealName, ...withoutMealName } = validAiMealBody;
    const { status, body } = await api("POST", "/api/meals/from-ai", withoutMealName, {
      "x-user-role": "user",
      "x-user-id": "1"
    });

    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
    assert.equal(body.error.details.field, "mealName");
  });

  it("400 — missing items", async () => {
    const { items, ...withoutItems } = validAiMealBody;
    const { status, body } = await api("POST", "/api/meals/from-ai", withoutItems, {
      "x-user-role": "user",
      "x-user-id": "1"
    });

    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
    assert.equal(body.error.details.field, "items");
  });

  it("400 — invalid items", async () => {
    const { status, body } = await api("POST", "/api/meals/from-ai", {
      ...validAiMealBody,
      items: "not-array"
    }, {
      "x-user-role": "user",
      "x-user-id": "1"
    });

    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
    assert.equal(body.error.details.field, "items");
  });

  it("403 — missing role header", async () => {
    const { status, body } = await api("POST", "/api/meals/from-ai", validAiMealBody, {
      "x-user-id": "1"
    });

    assert.equal(status, 403);
    assertError(body, "FORBIDDEN");
  });

  it("broadcasts meal:created and dashboard:updated after saving reviewed AI meal", async () => {
    const socket = await connectSocket();

    try {
      const mealCreated = waitForSocketEvent(socket, "meal:created");
      const dashboardUpdated = waitForSocketEvent(socket, "dashboard:updated");

      const { status, body } = await api("POST", "/api/meals/from-ai", {
        ...validAiMealBody,
        mealName: "AI socket lunch"
      }, {
        "x-user-role": "user",
        "x-user-id": "1"
      });

      assert.equal(status, 201);
      assertSuccess(body);

      const mealPayload = await mealCreated;
      assert.equal(mealPayload.mealId, body.data.mealId);
      assert.equal(mealPayload.userId, 1);
      assert.equal(mealPayload.mealDate, validAiMealBody.mealDate);
      assert.equal(mealPayload.mealName, "AI socket lunch");
      assert.deepEqual(mealPayload.totals, {
        calories: 557,
        protein: 61.2,
        carbs: 56,
        fat: 7.1
      });

      const dashboardPayload = await dashboardUpdated;
      assert.equal(dashboardPayload.userId, 1);
      assert.equal(dashboardPayload.date, validAiMealBody.mealDate);
      assert.equal(dashboardPayload.mealId, body.data.mealId);
    } finally {
      socket.close();
    }
  });
});

// ═════════════════════════════════════════════════════════
//  DASHBOARD
// ═════════════════════════════════════════════════════════

describe("GET /dashboard/today", () => {
  it("200 — returns daily summary", async () => {
    const { status, body } = await api("GET", "/dashboard/today?userId=1&date=2026-05-06");
    assert.equal(status, 200);
    assertSuccess(body);
    assert.ok("goals" in body.data);
    assert.ok("consumed" in body.data);
    assert.ok("remaining" in body.data);
    assert.ok(Array.isArray(body.data.meals));
    assert.ok(body.data.meals.length > 0);
    assert.ok(Array.isArray(body.data.meals[0].items));
    assert.ok(body.data.meals[0].items.length > 0);
    assert.equal(typeof body.data.meals[0].items[0].foodName, "string");
  });

  it("200 — includes ORM-joined meal items and calculated dashboard totals", async () => {
    const mealDate = "2026-05-08";
    const created = await api("POST", "/meals", {
      userId: 1,
      mealName: "dashboard join proof meal",
      mealDate,
      items: [
        { foodName: "salmon", confirmedPortionGrams: 150, calories: 300, protein: 34, carbs: 0, fat: 18 },
        { foodName: "broccoli", confirmedPortionGrams: 100, calories: 35, protein: 2.4, carbs: 7, fat: 0.4 }
      ]
    }, {
      "x-user-role": "user"
    });
    assert.equal(created.status, 201);
    assertSuccess(created.body);

    const { status, body } = await api("GET", `/dashboard/today?userId=1&date=${mealDate}`);
    assert.equal(status, 200);
    assertSuccess(body);
    assert.deepEqual(body.data.consumed, {
      calories: 335,
      protein: 36.4,
      carbs: 7,
      fat: 18.4
    });
    assert.deepEqual(body.data.remaining, {
      calories: 1865,
      protein: 113.6,
      carbs: 243,
      fat: 51.6
    });

    const dashboardMeal = body.data.meals.find((meal) => meal.mealId === created.body.data.mealId);
    assert.ok(dashboardMeal, "created meal should be returned by dashboard query");
    assert.equal(dashboardMeal.mealName, "dashboard join proof meal");
    assert.equal(dashboardMeal.items.length, 2);
    assert.deepEqual(dashboardMeal.items.map((item) => item.foodName), ["salmon", "broccoli"]);
    assert.deepEqual(dashboardMeal.items.map((item) => item.confirmedPortionGrams), [150, 100]);
  });

  it("200 — defaults missing date to local today", async () => {
    const { status, body } = await api("GET", "/dashboard/today?userId=1");
    assert.equal(status, 200);
    assertSuccess(body);
    assert.equal(body.data.date, getLocalDateString());
    assert.ok(body.data.meals.some((meal) => meal.mealName === "seeded today chicken rice"));
  });

  it("400 — missing userId", async () => {
    const { status, body } = await api("GET", "/dashboard/today");
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("400 — invalid userId", async () => {
    const { status, body } = await api("GET", "/dashboard/today?userId=abc");
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("404 — non-existent userId returns error", async () => {
    const { status, body } = await api("GET", "/dashboard/today?userId=9999");
    assert.equal(status, 404);
    assert.equal(body.success, false);
    assert.equal(body.error.code, "USER_NOT_FOUND");
  });

});

// ═════════════════════════════════════════════════════════
//  SOCKET.IO REALTIME EVENTS
// ═════════════════════════════════════════════════════════

describe("Socket.IO realtime events", () => {
  it("broadcasts presence:updated after presence:join", async () => {
    const socket = await connectSocket();

    try {
      const updated = waitForSocketEvent(socket, "presence:updated");
      socket.emit("presence:join", {
        userId: 1,
        fullName: "Denis Kulman"
      });

      const payload = await updated;
      assert.ok(Array.isArray(payload.onlineUsers));
      assert.ok(payload.onlineUsers.some((user) => (
        user.userId === 1 && user.fullName === "Denis Kulman"
      )));
    } finally {
      socket.close();
    }
  });

  it("broadcasts meal:created and dashboard:updated when a meal is created", async () => {
    const socket = await connectSocket();

    try {
      const mealCreated = waitForSocketEvent(socket, "meal:created");
      const dashboardUpdated = waitForSocketEvent(socket, "dashboard:updated");

      const { status, body } = await api("POST", "/meals", {
        userId: 1,
        mealName: "socket test lunch",
        mealDate: "2026-05-07",
        items: [
          { foodName: "turkey", confirmedPortionGrams: 100, calories: 135, protein: 29, carbs: 0, fat: 1 }
        ]
      }, {
        "x-user-role": "user"
      });

      assert.equal(status, 201);
      assertSuccess(body);

      const mealPayload = await mealCreated;
      assert.equal(mealPayload.mealId, body.data.mealId);
      assert.equal(mealPayload.userId, 1);
      assert.equal(mealPayload.mealDate, "2026-05-07");
      assert.equal(mealPayload.mealName, "socket test lunch");
      assert.deepEqual(mealPayload.totals, {
        calories: 135,
        protein: 29,
        carbs: 0,
        fat: 1
      });

      const dashboardPayload = await dashboardUpdated;
      assert.equal(dashboardPayload.userId, 1);
      assert.equal(dashboardPayload.date, "2026-05-07");
      assert.equal(dashboardPayload.mealId, body.data.mealId);
    } finally {
      socket.close();
    }
  });
});

// ═════════════════════════════════════════════════════════
//  AUTH / CURRENT USER / SETTINGS
// ═════════════════════════════════════════════════════════

describe("Auth and settings DB-backed flows", () => {
  it("200 — login uses persisted settings email", async () => {
    const { status, body } = await api("POST", "/api/auth/login", {
      email: "denis@example.com",
      password: "test00"
    });

    assert.equal(status, 200);
    assertSuccess(body);
    assert.equal(body.data.user.userId, 1);
    assert.equal(body.data.user.email, "denis@example.com");
  });

  it("200 — current user combines user and settings data", async () => {
    const { status, body } = await api("GET", "/api/users/me", undefined, {
      "x-user-id": "1"
    });

    assert.equal(status, 200);
    assertSuccess(body);
    assert.equal(body.data.userId, 1);
    assert.equal(body.data.email, "denis@example.com");
  });

  it("200 — settings update persists and login accepts the updated email", async () => {
    const settings = await api("PUT", "/api/settings", {
      username: "Denis Updated",
      email: "denis.updated@example.com",
      theme: "dark"
    }, {
      "x-user-id": "1"
    });

    assert.equal(settings.status, 200);
    assertSuccess(settings.body);
    assert.equal(settings.body.data.email, "denis.updated@example.com");

    const login = await api("POST", "/api/auth/login", {
      email: "denis.updated@example.com",
      password: "test00"
    });

    assert.equal(login.status, 200);
    assertSuccess(login.body);
    assert.equal(login.body.data.user.email, "denis.updated@example.com");
  });
});

// ═════════════════════════════════════════════════════════
//  GLOBAL MIDDLEWARE & ERROR HANDLING
// ═════════════════════════════════════════════════════════

describe("404 catch-all", () => {
  it("404 — unknown route", async () => {
    const { status, body } = await api("GET", "/nonexistent");
    assert.equal(status, 404);
    assertError(body, "ROUTE_NOT_FOUND");
  });

  it("404 — unknown nested route", async () => {
    const { status, body } = await api("GET", "/api/v2/something");
    assert.equal(status, 404);
    assertError(body, "ROUTE_NOT_FOUND");
  });
});

describe("Invalid JSON body", () => {
  it("400 — malformed JSON returns INVALID_JSON", async () => {
    const { status, body } = await api("POST", "/users", "{bad json}", { "x-user-role": "admin" });
    assert.equal(status, 400);
    assertError(body, "INVALID_JSON");
  });
});

describe("Logger middleware", () => {
  it("does not interfere with response format", async () => {
    const { status, body } = await api("GET", "/users", undefined, { "x-user-role": "admin" });
    assert.equal(status, 200);
    assertSuccess(body);
    assert.ok(Array.isArray(body.data));
  });

  it("does not interfere with error response format", async () => {
    const { status, body } = await api("GET", "/users/abc", undefined, { "x-user-role": "admin" });
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });
});
