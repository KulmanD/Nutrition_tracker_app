const { spawn } = require("node:child_process");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..", "..");
const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 10000);

let serverProcess;
let finished = false;
let output = "";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
}

function finish(code, message) {
  if (finished) {
    return;
  }

  finished = true;
  stopServer();

  if (message) {
    const log = code === 0 ? console.log : console.error;
    log(message);
  }

  process.exit(code);
}

async function waitForBackend() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(baseUrl);
      const body = await response.json();

      if (
        response.status === 200 &&
        body.success === true &&
        body.error === null &&
        body.data &&
        Array.isArray(body.data.endpoints) &&
        body.data.endpoints.includes("/dashboard/today")
      ) {
        return;
      }
    } catch {
      await delay(250);
    }
  }

  throw new Error(`Backend did not respond with the expected envelope within ${timeoutMs}ms`);
}

async function run() {
  serverProcess = spawn(process.execPath, ["src/server.js"], {
    cwd: rootDir,
    env: {
      ...process.env,
      AI_MODE: process.env.AI_MODE || "mock",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  serverProcess.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });

  serverProcess.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  serverProcess.once("exit", (code, signal) => {
    if (!finished) {
      finish(1, `Backend exited before smoke check completed (code=${code}, signal=${signal}).\n${output}`);
    }
  });

  await waitForBackend();
  finish(0, `Backend smoke check passed at ${baseUrl}`);
}

process.once("SIGINT", () => finish(130));
process.once("SIGTERM", () => finish(143));

run().catch((error) => {
  finish(1, `${error.message}\n${output}`);
});
