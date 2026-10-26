const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const port = Number(process.env.PORT) || 3103;
const dataDirectory = path.join(__dirname, "data");
const sessionsFile = path.join(dataDirectory, "sessions.json");
const maximumBodyBytes = 16 * 1024;

function ensureStore() {
  fs.mkdirSync(dataDirectory, { recursive: true });
  if (!fs.existsSync(sessionsFile)) fs.writeFileSync(sessionsFile, "[]\n", "utf8");
}

function readSessions() {
  ensureStore();
  try {
    const sessions = JSON.parse(fs.readFileSync(sessionsFile, "utf8"));
    return Array.isArray(sessions) ? sessions : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions) {
  ensureStore();
  const temporaryFile = `${sessionsFile}.tmp`;
  fs.writeFileSync(temporaryFile, `${JSON.stringify(sessions.slice(-500), null, 2)}\n`, "utf8");
  fs.renameSync(temporaryFile, sessionsFile);
}

function sendJson(response, status, value) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(value));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let settled = false;
    request.on("data", (chunk) => {
      if (settled) return;
      body += chunk;
      if (Buffer.byteLength(body) > maximumBodyBytes) {
        settled = true;
        reject(Object.assign(new Error("Request body is too large."), { statusCode: 413 }));
        request.resume();
      }
    });
    request.on("end", () => {
      if (settled) return;
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(Object.assign(new Error("Request body must be valid JSON."), { statusCode: 400 }));
      }
    });
    request.on("error", reject);
  });
}

function isCompletedFocusSession(value) {
  return value && typeof value === "object"
    && value.mode === "focus"
    && Number.isInteger(value.durationSeconds)
    && value.durationSeconds >= 60
    && value.durationSeconds <= 180 * 60;
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true, app: "together" });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/sessions") {
    sendJson(response, 200, { sessions: readSessions().slice(-100).reverse() });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/sessions") {
    try {
      const input = await readJson(request);
      if (!isCompletedFocusSession(input)) {
        sendJson(response, 400, { error: "A focus session must be between 1 and 180 minutes." });
        return;
      }
      const session = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        mode: "focus",
        durationSeconds: input.durationSeconds,
        completedAt: new Date().toISOString(),
      };
      writeSessions([...readSessions(), session]);
      sendJson(response, 201, { session });
    } catch (error) {
      sendJson(response, error.statusCode || 400, { error: error.message || "Unable to save session." });
    }
    return;
  }

  if (url.pathname === "/" && (request.method === "GET" || request.method === "HEAD")) {
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    });
    if (request.method === "HEAD") response.end();
    else fs.createReadStream(path.join(__dirname, "index.html")).pipe(response);
    return;
  }

  sendJson(response, 404, { error: "Route not found." });
}

const server = http.createServer((request, response) => {
  void handleRequest(request, response);
});

server.listen(port, () => console.log(`Together app is running at http://localhost:${port}`));
