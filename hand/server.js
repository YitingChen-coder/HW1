const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

let portThing = Number(process.env.PORT) || 3101;
let folderThing = __dirname;
let fileThing = path.join(folderThing, "data", "sessions.json");

function makeSureFileExists() {
  fs.mkdirSync(path.dirname(fileThing), { recursive: true });
  if (!fs.existsSync(fileThing)) fs.writeFileSync(fileThing, "[]\n", "utf8");
}

function getStuff() {
  makeSureFileExists();
  try {
    let parsedThing = JSON.parse(fs.readFileSync(fileThing, "utf8"));
    return Array.isArray(parsedThing) ? parsedThing : [];
  } catch (oops) {
    return [];
  }
}

function sayJson(response, code, thing) {
  response.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(thing));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let stuff = "";
    request.on("data", (piece) => {
      stuff += piece;
      if (Buffer.byteLength(stuff) > 16000) {
        reject(Object.assign(new Error("Request is too large."), { statusCode: 413 }));
        request.destroy();
      }
    });
    request.on("end", () => {
      try { resolve(JSON.parse(stuff || "{}")); }
      catch { reject(Object.assign(new Error("Send valid JSON."), { statusCode: 400 })); }
    });
    request.on("error", reject);
  });
}

const littleServer = http.createServer(async (req, res) => {
  const here = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (here.pathname === "/api/health" && req.method === "GET") {
    sayJson(res, 200, { ok: true, app: "hand" });
    return;
  }
  if (here.pathname === "/api/sessions" && req.method === "GET") {
    sayJson(res, 200, { sessions: getStuff().slice(-100).reverse() });
    return;
  }
  if (here.pathname === "/api/sessions" && req.method === "POST") {
    try {
      let sent = await readBody(req);
      if (sent.mode !== "focus" || !Number.isInteger(sent.durationSeconds) || sent.durationSeconds < 60 || sent.durationSeconds > 10800) {
        sayJson(res, 400, { error: "A focus session must be between 1 and 180 minutes." });
        return;
      }
      let allStuff = getStuff();
      let newThing = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, mode: "focus", durationSeconds: sent.durationSeconds, completedAt: new Date().toISOString() };
      allStuff.push(newThing);
      makeSureFileExists();
      fs.writeFileSync(fileThing, JSON.stringify(allStuff.slice(-500), null, 2) + "\n", "utf8");
      sayJson(res, 201, { session: newThing });
    } catch (oops) {
      sayJson(res, oops.statusCode || 400, { error: oops.message || "Could not save that round." });
    }
    return;
  }
  if (here.pathname === "/" && (req.method === "GET" || req.method === "HEAD")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    if (req.method === "HEAD") res.end();
    else fs.createReadStream(path.join(folderThing, "index.html")).pipe(res);
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

littleServer.listen(portThing, () => console.log(`Hand app is running at http://localhost:${portThing}`));
