const test = require("node:test");
const assert = require("node:assert/strict");

const cors = require("../middleware/cors");

function runCors(origin, method = "GET") {
  const headers = new Map();
  let statusCode;
  let nextCalled = false;

  cors({
    method,
    headers: { origin }
  }, {
    header(name, value) {
      headers.set(name, value);
    },
    sendStatus(status) {
      statusCode = status;
    }
  }, () => {
    nextCalled = true;
  });

  return { headers, statusCode, nextCalled };
}

test("allows the local frontend by default", () => {
  const result = runCors("http://localhost:5173");

  assert.equal(result.headers.get("Access-Control-Allow-Origin"), "http://localhost:5173");
  assert.equal(result.headers.get("Vary"), "Origin");
  assert.equal(result.nextCalled, true);
});

test("allows configured Render frontend origins", () => {
  const previousOrigins = process.env.ALLOWED_ORIGINS;
  process.env.ALLOWED_ORIGINS = "http://localhost:5173,https://nutrition-frontend.onrender.com";

  try {
    const result = runCors("https://nutrition-frontend.onrender.com", "OPTIONS");

    assert.equal(result.headers.get("Access-Control-Allow-Origin"), "https://nutrition-frontend.onrender.com");
    assert.equal(result.statusCode, 204);
    assert.equal(result.nextCalled, false);
  } finally {
    if (previousOrigins === undefined) {
      delete process.env.ALLOWED_ORIGINS;
    } else {
      process.env.ALLOWED_ORIGINS = previousOrigins;
    }
  }
});

test("does not send an allow-origin header for other origins", () => {
  const result = runCors("https://untrusted.example");

  assert.equal(result.headers.has("Access-Control-Allow-Origin"), false);
  assert.equal(result.nextCalled, true);
});
