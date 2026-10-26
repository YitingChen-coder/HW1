const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "sessions.json");
const MAX_BODY_BYTES = 16 * 1024;
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function ensureDataFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]\n", "utf8");
}

function readSessions() {
  ensureDataFile();
  try {
    const value = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  ensureDataFile();
  const temporaryFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temporaryFile, `${JSON.stringify(sessions, null, 2)}\n`, "utf8");
  fs.renameSync(temporaryFile, DATA_FILE);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        reject(Object.assign(new Error("Request body is too large."), { statusCode: 413 }));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(Object.assign(new Error("Request body must be valid JSON."), { statusCode: 400 }));
      }
    });
    request.on("error", reject);
  });
}

function validSession(input) {
  if (!input || typeof input !== "object") return false;
  return input.mode === "focus" && Number.isInteger(input.durationSeconds)
    && input.durationSeconds >= 60 && input.durationSeconds <= 180 * 60;
}

function routeStaticFile(response, pathname) {
  const routeMap = {
    "/": "/together/index.html",
    "/hand": "/hand/index.html",
    "/agent": "/agent/index.html",
    "/together": "/together/index.html",
  };
  const requestedPath = routeMap[pathname] || pathname;
  const normalized = path.normalize(requestedPath).replace(/^([/\\]*\.\.[/\\])+/, "");
  const filePath = path.resolve(ROOT, `.${normalized.startsWith("/") ? normalized : `/${normalized}`}`);
  if (!filePath.startsWith(`${ROOT}${path.sep}`) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });
  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (requestUrl.pathname === "/api/health" && request.method === "GET") {
    sendJson(response, 200, { ok: true, service: "pomodoro-api" });
    return;
  }

  if (requestUrl.pathname === "/api/sessions" && request.method === "GET") {
    const sessions = readSessions().slice(-100).reverse();
    sendJson(response, 200, { sessions });
    return;
  }

  if (requestUrl.pathname === "/api/sessions" && request.method === "POST") {
    try {
      const input = await readJsonBody(request);
      if (!validSession(input)) {
        sendJson(response, 400, { error: "Only completed focus sessions from 1 to 180 minutes can be saved." });
        return;
      }
      const sessions = readSessions();
      const session = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        mode: "focus",
        durationSeconds: input.durationSeconds,
        completedAt: new Date().toISOString(),
      };
      sessions.push(session);
      saveSessions(sessions.slice(-500));
      sendJson(response, 201, { session });
    } catch (error) {
      sendJson(response, error.statusCode || 400, { error: error.message || "Unable to save session." });
    }
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }
  routeStaticFile(response, decodeURIComponent(requestUrl.pathname));
});

server.listen(PORT, () => {
  console.log(`Pomodoro app listening on http://localhost:${PORT}`);
});
