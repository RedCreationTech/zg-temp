const http = require("http");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;
const RUNTIME_DIR = path.join(ROOT, ".runtime");
const RUNTIME_FILE = path.join(RUNTIME_DIR, "runtime.json");
const BODY_LIMIT = 2 * 1024 * 1024;

const DEMO_ORG = {
  organization: {
    id: "org-zg-demo",
    name: "ZG AI GPS Demo",
    regions: [
      { id: "r-east", name: "华东区", manager: "李明", hospitals: 3, reps: 7 },
      { id: "r-south", name: "华南区", manager: "王芳", hospitals: 4, reps: 8 },
      { id: "r-north", name: "华北区", manager: "赵鹏", hospitals: 5, reps: 6 }
    ]
  },
  users: [
    { id: "u-rm-01", name: "李明", role: "地区经理", region: "华东区", scope: "region" },
    { id: "u-rep-01", name: "张蕾", role: "医药代表", region: "华东区", scope: "territory" },
    { id: "u-rep-02", name: "刘晨", role: "医药代表", region: "华东区", scope: "territory" },
    { id: "u-dir-01", name: "陈总", role: "销售总监", region: "全国", scope: "national" }
  ],
  roles: [
    {
      role: "医药代表",
      permissions: ["doctor.read", "doctor.nba", "visit.write", "visit.review", "evidence.read"]
    },
    {
      role: "地区经理",
      permissions: ["hospital.read", "hospital.nba", "doctor.read", "doctor.nba", "coaching.manage", "action.manage", "rule.suggest"]
    },
    {
      role: "销售总监",
      permissions: ["cockpit.read", "action.manage", "resource.decide", "pilot.read", "rule.review", "audit.read"]
    }
  ]
};

function initialState() {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    actionStatus: {},
    sessions: [],
    customRules: [],
    crmSync: {
      status: "idle",
      lastSyncedAt: null,
      records: 0
    },
    audit: []
  };
}

function ensureRuntime() {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  if (!fs.existsSync(RUNTIME_FILE)) {
    fs.writeFileSync(RUNTIME_FILE, JSON.stringify(initialState(), null, 2));
  }
}

function readState() {
  ensureRuntime();
  try {
    return JSON.parse(fs.readFileSync(RUNTIME_FILE, "utf8"));
  } catch (error) {
    const state = initialState();
    fs.writeFileSync(RUNTIME_FILE, JSON.stringify(state, null, 2));
    return state;
  }
}

function writeState(state) {
  ensureRuntime();
  const tmp = RUNTIME_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, RUNTIME_FILE);
}

function audit(state, event, actor, object, detail) {
  state.audit.unshift({
    id: randomUUID(),
    at: new Date().toISOString(),
    event,
    actor: actor || "demo-user",
    object: object || "-",
    detail: detail || ""
  });
  state.audit = state.audit.slice(0, 200);
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function notFound(res) {
  json(res, 404, { ok: false, error: "Not Found" });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let raw = "";
    req.on("data", chunk => {
      size += chunk.length;
      if (size > BODY_LIMIT) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function getNbaText(type) {
  const outputs = {
    hospital:
      "建议本周不要增加泛化覆盖。结合患者流、医院生态、医生影响力和资源约束，优先把医学支持集中到关键方案选择节点。Owner 为地区经理与负责代表，成功信号是关键医生愿意在真实病例中讨论目标方案。",
    doctor:
      "当前最佳动作不是继续介绍产品，而是绑定医生即将发生的真实决策场景。先确认患者选择标准，再调用与该标准直接相关的证据，最后请求一个有时间、有对象、可验证的下一步承诺。",
    coaching:
      "本次拜访的首要失效点是探询不足。下一次应先确认医生的决策标准，再呈现证据。经理应在拜访前完成一次角色演练，并在拜访后检查是否形成明确行为承诺。",
    cockpit:
      "管理层本周建议增加重点医院的场景化医学支持，保持已形成明确客户承诺的资源投入，暂停决策链尚不清晰的高成本活动，并升级连续多次未形成下一步承诺的代表辅导。"
  };
  return outputs[type] || outputs.doctor;
}

function fakeTranscript(fileName) {
  return {
    ok: true,
    fileName: fileName || "拜访录音.m4a",
    duration: "08:42",
    transcript: [
      { speaker: "代表", time: "00:18", text: "周主任, 我带来了一组新的真实世界数据, 想和您快速看一下。" },
      { speaker: "医生", time: "00:42", text: "数据我看过一些, 但我现在更关心这类患者到底怎么选。" },
      { speaker: "代表", time: "01:05", text: "这组研究纳入了不少高风险患者, 长期结果也比较完整。" },
      { speaker: "医生", time: "02:14", text: "我的问题还是哪些患者值得现在就调整方案。" },
      { speaker: "代表", time: "07:52", text: "好的, 那您有时间再看看, 我下次再来。" }
    ],
    diagnosis: {
      topIssue: "探询不足",
      score: 72,
      evidence: "医生连续两次把问题拉回“患者怎么选”, 代表仍继续呈现证据, 没有确认医生的选择标准。",
      nextAction: "下一次先确认两个患者选择标准, 再调用对应证据, 结束时请求在具体 MDT 病例中讨论。"
    }
  };
}

async function handleApi(req, res, url) {
  const method = req.method || "GET";
  const pathname = url.pathname;
  const state = readState();

  if (method === "GET" && pathname === "/api/health") {
    return json(res, 200, {
      ok: true,
      service: "ZG AI GPS Pilot Runtime",
      version: "0.3.0",
      now: new Date().toISOString()
    });
  }

  if (method === "GET" && pathname === "/api/bootstrap") {
    return json(res, 200, {
      ok: true,
      actionStatus: state.actionStatus || {},
      customRules: state.customRules || [],
      crmSync: state.crmSync || {},
      session: state.sessions && state.sessions[0] ? state.sessions[0] : null
    });
  }

  if (method === "GET" && pathname === "/api/org") {
    return json(res, 200, { ok: true, ...DEMO_ORG });
  }

  if (method === "GET" && pathname === "/api/audit") {
    return json(res, 200, { ok: true, audit: state.audit || [] });
  }

  if (method === "POST" && pathname === "/api/session") {
    const body = await readBody(req);
    const session = {
      id: randomUUID(),
      name: String(body.name || "演示用户"),
      role: String(body.role || "地区经理"),
      loginAt: new Date().toISOString()
    };
    state.sessions = [session].concat(state.sessions || []).slice(0, 20);
    audit(state, "session.login", session.name, session.role, "进入 AI GPS 工作台");
    writeState(state);
    return json(res, 201, { ok: true, session });
  }

  const actionMatch = pathname.match(/^\/api\/actions\/([^/]+)$/);
  if (actionMatch && method === "PATCH") {
    const body = await readBody(req);
    const actionId = decodeURIComponent(actionMatch[1]);
    const status = String(body.status || "todo");
    if (!["todo", "doing", "done", "risk"].includes(status)) {
      return json(res, 400, { ok: false, error: "Invalid action status" });
    }
    state.actionStatus[actionId] = status;
    audit(state, "action.status", body.actor, actionId, "status=" + status);
    writeState(state);
    return json(res, 200, { ok: true, actionId, status });
  }

  if (method === "POST" && pathname === "/api/nba/generate") {
    const body = await readBody(req);
    const type = String(body.type || "doctor");
    const text = getNbaText(type);
    audit(state, "nba.generate", body.actor, type, "generated");
    writeState(state);
    return json(res, 200, {
      ok: true,
      type,
      text,
      context: body.context || {},
      model: "ZG Decision Engine Local",
      generatedAt: new Date().toISOString()
    });
  }

  if (method === "POST" && pathname === "/api/visits/transcribe") {
    const body = await readBody(req);
    const result = fakeTranscript(body.fileName);
    audit(state, "visit.transcribe", body.actor, body.fileName || "demo-visit.m4a", result.diagnosis.topIssue);
    writeState(state);
    return json(res, 200, result);
  }

  if (method === "POST" && pathname === "/api/rules") {
    const body = await readBody(req);
    const rule = {
      id: body.id || "R-" + String(100 + state.customRules.length + 1),
      title: String(body.title || "未命名 Rule"),
      context: String(body.context || "待补充 Context"),
      decision: String(body.decision || "待验证 Decision"),
      action: String(body.action || "待验证 Action"),
      outcome: String(body.outcome || "等待 Outcome"),
      confidence: Math.max(0, Math.min(100, Number(body.confidence || 60))),
      status: body.status === "validated" ? "validated" : "testing",
      uses: Number(body.uses || 0),
      createdAt: new Date().toISOString()
    };
    state.customRules.unshift(rule);
    audit(state, "rule.create", body.actor, rule.id, rule.title);
    writeState(state);
    return json(res, 201, { ok: true, rule });
  }

  if (method === "POST" && pathname === "/api/crm/sync") {
    const body = await readBody(req);
    state.crmSync = {
      status: "healthy",
      lastSyncedAt: new Date().toISOString(),
      records: Number(body.records || 1286)
    };
    audit(state, "crm.sync", body.actor, "CRM/SFE", "records=" + state.crmSync.records);
    writeState(state);
    return json(res, 200, { ok: true, crmSync: state.crmSync });
  }

  return notFound(res);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const file = path.join(ROOT, safePath);

  if (!file.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not Found");
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=60"
    });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    serveStatic(req, res, url);
  } catch (error) {
    console.error(error);
    json(res, 500, { ok: false, error: error.message || "Internal Server Error" });
  }
});

ensureRuntime();
server.listen(PORT, HOST, () => {
  console.log("");
  console.log("ZG AI GPS Pilot Runtime");
  console.log("http://localhost:" + PORT);
  console.log("API health: http://localhost:" + PORT + "/api/health");
  console.log("");
});
