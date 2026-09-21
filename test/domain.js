"use strict";

const assert = require("assert");
const { createSeedDomain } = require("../lib/seed-data");
const {
  ensureDomain,
  getHospital,
  getDoctor,
  createOutcome,
  createRule
} = require("../lib/domain-model");
const { runDecision } = require("../lib/decision-engine");
const {
  buildRuleValidation,
  applySafeValidation,
  reviewValidation
} = require("../lib/learning-engine");

const domain = ensureDomain(createSeedDomain());

assert.strictEqual(domain.hospitals.length, 3);
assert.strictEqual(domain.doctors.length, 3);
assert.ok(getHospital(domain, "h1"));
assert.ok(getDoctor(domain, "d1"));

const hospitalRun = runDecision(domain, {
  type: "hospital",
  actor: "Domain Test",
  role: "地区经理",
  targetId: "h1"
});

assert.strictEqual(hospitalRun.context.targetType, "hospital");
assert.strictEqual(hospitalRun.context.targetId, "h1");
assert.ok(hospitalRun.decision.priorityScore >= 0 && hospitalRun.decision.priorityScore <= 100);
assert.strictEqual(hospitalRun.nba.targetId, "h1");
assert.ok(hospitalRun.nba.what);
assert.ok(hospitalRun.nba.success);
assert.ok(hospitalRun.rules.length > 0);

const doctorRun = runDecision(domain, {
  type: "doctor",
  actor: "Domain Test",
  role: "医药代表",
  targetId: "d1"
});

assert.strictEqual(doctorRun.context.targetId, "d1");
assert.ok(doctorRun.nba.who.includes("周敏"));
assert.ok(doctorRun.decision.ruleIds.includes("R-019"));

const coachingRun = runDecision(domain, {
  type: "coaching",
  actor: "Domain Test",
  role: "地区经理",
  targetId: "v1"
});

assert.strictEqual(coachingRun.context.targetType, "visit");
assert.ok(coachingRun.nba.what.includes("确认"));

const cockpitRun = runDecision(domain, {
  type: "cockpit",
  actor: "Domain Test",
  role: "销售总监",
  targetId: "national"
});

assert.strictEqual(cockpitRun.decision.humanReviewRequired, true);
assert.strictEqual(cockpitRun.nba.owner, "销售总监");

const outcome = createOutcome({
  id: "out-test",
  nbaId: doctorRun.nba.id,
  result: "已达成",
  signal: "医生同意在 MDT 讨论一例匹配患者",
  effectiveness: 90,
  recordedBy: "Domain Test"
});

assert.strictEqual(outcome.effectiveness, 90);
assert.strictEqual(outcome.type, "Outcome");

const rule = createRule({
  id: "R-TEST",
  title: "测试规则",
  context: "测试情境",
  decision: "测试判断",
  action: "测试动作",
  outcome: "测试结果",
  confidence: 110
});

assert.strictEqual(rule.confidence, 100);
assert.strictEqual(rule.status, "testing");

domain.contextSnapshots.push(doctorRun.context);
domain.decisions.push(doctorRun.decision);
domain.nbas.push(doctorRun.nba);
domain.outcomes.push(outcome);
domain.ruleValidations = [];

const validations = buildRuleValidation(domain, outcome);
assert.ok(validations.length >= 1);
for (const validation of validations) {
  domain.ruleValidations.push(validation);
  applySafeValidation(domain, validation);
}
assert.ok(domain.ruleValidations.some(item => item.ruleId === "R-019"));

const reviewCandidate = domain.ruleValidations.find(item => item.humanReviewRequired);
if (reviewCandidate) {
  const reviewed = reviewValidation(domain, reviewCandidate.id, "approve", "Test Reviewer");
  assert.strictEqual(reviewed.validation.status, "approved");
  assert.strictEqual(reviewed.validation.reviewedBy, "Test Reviewer");
}

console.log("✓ domain entities");
console.log("✓ hospital decision");
console.log("✓ doctor decision");
console.log("✓ coaching decision");
console.log("✓ cockpit human review");
console.log("✓ outcome entity");
console.log("✓ decision rule validation");
console.log("✓ outcome-driven rule validation");
console.log("✓ human review gate");
console.log("");
console.log("ZG AI GPS domain test passed.");
