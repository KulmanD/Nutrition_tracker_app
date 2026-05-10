const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");

const BASE = "http://localhost:3000";
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

// ── Lifecycle ────────────────────────────────────────────

before(async () => {
  serverProcess = spawn("node", ["server.js"], {
    cwd: path.resolve(__dirname, ".."),
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
    const { status, body } = await api("GET", "/users");
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
    const { status, body } = await api("GET", "/users/1");
    assert.equal(status, 200);
    assertSuccess(body);
    assert.equal(body.data.userId, 1);
  });

  it("404 — non-existent id", async () => {
    const { status, body } = await api("GET", "/users/999");
    assert.equal(status, 404);
    assertError(body, "USER_NOT_FOUND");
  });

  it("400 — non-numeric id", async () => {
    const { status, body } = await api("GET", "/users/abc");
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("400 — negative id", async () => {
    const { status, body } = await api("GET", "/users/-1");
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });

  it("400 — zero id", async () => {
    const { status, body } = await api("GET", "/users/0");
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

  it("403 — unauthorized role", async () => {
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
    const { status, body } = await api("GET", "/users/2");
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
    const { status, body } = await api("GET", "/users");
    assert.equal(status, 200);
    assertSuccess(body);
    assert.ok(Array.isArray(body.data));
  });

  it("does not interfere with error response format", async () => {
    const { status, body } = await api("GET", "/users/abc");
    assert.equal(status, 400);
    assertError(body, "VALIDATION_ERROR");
  });
});
