const { spawn } = require("child_process");

const PORT = 18080;
const BASE = "http://127.0.0.1:" + PORT;
const child = spawn(process.execPath, ["server.js"], {
  env: Object.assign({}, process.env, { PORT: String(PORT), HOST: "127.0.0.1" }),
  stdio: ["ignore", "pipe", "pipe"]
});

let output = "";
child.stdout.on("data", chunk => { output += chunk.toString(); });
child.stderr.on("data", chunk => { output += chunk.toString(); });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const response = await fetch(BASE + "/api/health");
      if (response.ok) return;
    } catch (error) {
      // server still starting
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Server did not become ready.\n" + output);
}

async function json(path, options) {
  const response = await fetch(BASE + path, Object.assign({
    headers: { "Content-Type": "application/json" }
  }, options || {}));
  const payload = await response.json();
  assert(response.ok, path + " failed: " + JSON.stringify(payload));
  return payload;
}

async function run() {
  await waitForServer();

  const home = await fetch(BASE + "/");
  assert(home.ok, "GET / should return 200");
  const html = await home.text();
  assert(html.includes("ZG AI GPS"), "index.html should contain product title");

  const health = await json("/api/health");
  assert(health.ok === true, "health should be ok");

  const session = await json("/api/session", {
    method: "POST",
    body: JSON.stringify({ name: "Smoke Test", role: "地区经理" })
  });
  assert(session.session && session.session.role === "地区经理", "session should persist role");

  const action = await json("/api/actions/a1", {
    method: "PATCH",
    body: JSON.stringify({ status: "done", actor: "Smoke Test" })
  });
  assert(action.status === "done", "action status should become done");

  const nba = await json("/api/nba/generate", {
    method: "POST",
    body: JSON.stringify({ type: "hospital", actor: "Smoke Test", role: "地区经理", targetId: "h1", context: { hospitalId: "h1" } })
  });
  assert(nba.text && nba.text.length > 20, "NBA should return generated text");
  assert(nba.context && nba.context.targetId === "h1", "NBA should persist ContextSnapshot");
  assert(nba.decision && typeof nba.decision.priorityScore === "number", "NBA should return Decision");
  assert(nba.nba && nba.nba.id, "NBA should return structured NBA entity");
  assert(Array.isArray(nba.rules), "NBA should expose applied rules");

  const accepted = await json("/api/nbas/" + encodeURIComponent(nba.nba.id) + "/accept", {
    method: "POST",
    body: JSON.stringify({ actor: "Smoke Test", priority: 1 })
  });
  assert(accepted.action && accepted.action.nbaId === nba.nba.id, "NBA accept should create Action");

  const outcome = await json("/api/domain/outcomes", {
    method: "POST",
    body: JSON.stringify({
      nbaId: nba.nba.id,
      actionId: accepted.action.id,
      result: "已达成",
      signal: "Smoke test business signal",
      evidence: "test evidence",
      effectiveness: 90,
      actor: "Smoke Test"
    })
  });
  assert(outcome.outcome && outcome.outcome.effectiveness === 90, "Outcome should persist");
  assert(outcome.action && outcome.action.status === "done", "Outcome should close Action");
  assert(Array.isArray(outcome.ruleValidations) && outcome.ruleValidations.length >= 1, "Outcome should create RuleValidation");

  const rule = await json("/api/rules", {
    method: "POST",
    body: JSON.stringify({
      title: "Smoke Rule",
      context: "test context",
      decision: "test decision",
      action: "test action",
      outcome: "test outcome",
      confidence: 60
    })
  });
  assert(rule.rule && rule.rule.id, "rule should receive an id");

  const hospitals = await json("/api/domain/hospitals");
  assert(Array.isArray(hospitals.hospitals) && hospitals.hospitals.length >= 3, "hospital domain should be available");

  const hospital = await json("/api/domain/hospitals/h1");
  assert(hospital.hospital && Array.isArray(hospital.doctors), "hospital 360 should include doctors");

  const decisions = await json("/api/domain/decisions");
  assert(Array.isArray(decisions.decisions) && decisions.decisions.length >= 1, "decision trace should persist");

  const actions = await json("/api/domain/actions");
  assert(Array.isArray(actions.actions) && actions.actions.some(item => item.id === accepted.action.id), "formal Action should persist");

  const validations = await json("/api/domain/rule-validations");
  assert(Array.isArray(validations.ruleValidations) && validations.ruleValidations.length >= 1, "RuleValidation should persist");

  const reviewCandidate = validations.ruleValidations.find(item => item.status === "review_required");
  if (reviewCandidate) {
    const reviewed = await json("/api/domain/rule-validations/" + encodeURIComponent(reviewCandidate.id) + "/review", {
      method: "POST",
      body: JSON.stringify({ action: "approve", actor: "Smoke Test Reviewer" })
    });
    assert(reviewed.validation.status === "approved", "Human review should approve validation");
  }

  const outcomes = await json("/api/domain/outcomes");
  assert(Array.isArray(outcomes.outcomes) && outcomes.outcomes.length >= 1, "outcome list should persist");

  const org = await json("/api/org");
  assert(org.organization && Array.isArray(org.users), "organization payload should be available");

  const audit = await json("/api/audit");
  assert(Array.isArray(audit.audit) && audit.audit.length >= 4, "audit should contain runtime events");

  const boot = await json("/api/bootstrap");
  assert(boot.actionStatus.a1 === "done", "bootstrap should include persisted action state");

  console.log("✓ static app");
  console.log("✓ health");
  console.log("✓ session");
  console.log("✓ action persistence");
  console.log("✓ structured NBA / Decision Trace");
  console.log("✓ NBA accept → Action");
  console.log("✓ Outcome feedback");
  console.log("✓ RuleValidation / Human Review");
  console.log("✓ Hospital 360 domain API");
  console.log("✓ rule persistence");
  console.log("✓ organization");
  console.log("✓ audit");
  console.log("✓ bootstrap");
  console.log("");
  console.log("ZG AI GPS smoke test passed.");
}

run()
  .catch(error => {
    console.error(error.stack || error);
    process.exitCode = 1;
  })
  .finally(() => {
    child.kill("SIGTERM");
  });
