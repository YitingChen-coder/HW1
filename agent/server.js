const http = require("node:http");
const fileSystem = require("node:fs");
const pathUtilities = require("node:path");

const agentApplicationDirectory = __dirname;
const agentSessionDirectory = pathUtilities.join(agentApplicationDirectory, "data");
const agentSessionFilePath = pathUtilities.join(agentSessionDirectory, "sessions.json");
const agentListeningPort = Number(process.env.PORT) || 3102;
const agentMaximumRequestBodyBytes = 16 * 1024;

function ensureAgentSessionFileExists() {
  fileSystem.mkdirSync(agentSessionDirectory, { recursive: true });
  if (!fileSystem.existsSync(agentSessionFilePath)) {
    fileSystem.writeFileSync(agentSessionFilePath, "[]\n", "utf8");
  }
}

function readPreviouslyCompletedSessions() {
  ensureAgentSessionFileExists();
  try {
    const parsedSessionFileContents = JSON.parse(fileSystem.readFileSync(agentSessionFilePath, "utf8"));
    return Array.isArray(parsedSessionFileContents) ? parsedSessionFileContents : [];
  } catch (sessionFileReadError) {
    console.error("Could not parse the Agent session file:", sessionFileReadError.message);
    return [];
  }
}

function sendJsonResponse(response, statusCode, responseObject) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(responseObject));
}

function receiveJsonRequestBody(request) {
  return new Promise((resolve, reject) => {
    let requestBodyText = "";
    let requestBodyHasFailed = false;

    request.on("data", (requestBodyChunk) => {
      if (requestBodyHasFailed) return;
      requestBodyText += requestBodyChunk;
      if (Buffer.byteLength(requestBodyText) > agentMaximumRequestBodyBytes) {
        requestBodyHasFailed = true;
        reject(Object.assign(new Error("The request body exceeds the allowed size."), { statusCode: 413 }));
        request.resume();
      }
    });

    request.on("end", () => {
      if (requestBodyHasFailed) return;
      try {
        resolve(JSON.parse(requestBodyText || "{}"));
      } catch {
        reject(Object.assign(new Error("The request body must contain valid JSON."), { statusCode: 400 }));
      }
    });

    request.on("error", (requestStreamError) => {
      if (!requestBodyHasFailed) reject(requestStreamError);
    });
  });
}

function isValidCompletedFocusSession(requestBody) {
  return requestBody !== null
    && typeof requestBody === "object"
    && requestBody.mode === "focus"
    && Number.isInteger(requestBody.durationSeconds)
    && requestBody.durationSeconds >= 60
    && requestBody.durationSeconds <= 180 * 60;
}

function createCompletedFocusSession(durationInSeconds) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    mode: "focus",
    durationSeconds: durationInSeconds,
    completedAt: new Date().toISOString(),
  };
}

function writeSessionHistoryAtomically(sessionHistory) {
  ensureAgentSessionFileExists();
  const temporarySessionFilePath = `${agentSessionFilePath}.tmp`;
  const retainedSessionHistory = sessionHistory.slice(-500);
  fileSystem.writeFileSync(temporarySessionFilePath, `${JSON.stringify(retainedSessionHistory, null, 2)}\n`, "utf8");
  fileSystem.renameSync(temporarySessionFilePath, agentSessionFilePath);
}

async function handleAgentApiRequest(request, response, requestUrl) {
  if (requestUrl.pathname === "/api/health" && request.method === "GET") {
    sendJsonResponse(response, 200, { ok: true, app: "agent" });
    return true;
  }

  if (requestUrl.pathname === "/api/sessions" && request.method === "GET") {
    const mostRecentSessionHistory = readPreviouslyCompletedSessions().slice(-100).reverse();
    sendJsonResponse(response, 200, { sessions: mostRecentSessionHistory });
    return true;
  }

  if (requestUrl.pathname === "/api/sessions" && request.method === "POST") {
    try {
      const parsedRequestBody = await receiveJsonRequestBody(request);
      if (!isValidCompletedFocusSession(parsedRequestBody)) {
        sendJsonResponse(response, 400, { error: "A focus session must be between 1 and 180 minutes." });
        return true;
      }

      const existingSessionHistory = readPreviouslyCompletedSessions();
      const newlyCompletedSession = createCompletedFocusSession(parsedRequestBody.durationSeconds);
      writeSessionHistoryAtomically([...existingSessionHistory, newlyCompletedSession]);
      sendJsonResponse(response, 201, { session: newlyCompletedSession });
    } catch (requestHandlingError) {
      sendJsonResponse(response, requestHandlingError.statusCode || 400, {
        error: requestHandlingError.message || "The completed session could not be saved.",
      });
    }
    return true;
  }

  return false;
}

const agentHttpServer = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const requestWasHandledByApi = await handleAgentApiRequest(request, response, requestUrl);
  if (requestWasHandledByApi) return;

  if (requestUrl.pathname === "/" && (request.method === "GET" || request.method === "HEAD")) {
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    });
    if (request.method === "HEAD") {
      response.end();
    } else {
      fileSystem.createReadStream(pathUtilities.join(agentApplicationDirectory, "index.html")).pipe(response);
    }
    return;
  }

  sendJsonResponse(response, 404, { error: "The requested Agent app route was not found." });
});

agentHttpServer.listen(agentListeningPort, () => {
  console.log(`Agent application listening at http://localhost:${agentListeningPort}`);
});
