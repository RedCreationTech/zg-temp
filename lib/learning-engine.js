"use strict";

const { randomUUID } = require("crypto");
const { clamp, now } = require("./domain-model");

function effectivenessDelta(effectiveness) {
  const value = Number(effectiveness || 0);
  if (value >= 85) return 4;
  if (value >= 70) return 2;
  if (value >= 55) return 1;
  if (value >= 40) return -1;
  if (value >= 20) return -3;
  return -5;
}

function buildRuleValidation(domain, outcome) {
  const nba = (domain.nbas || []).find(item => item.id === outcome.nbaId);
  if (!nba) throw new Error("NBA not found for outcome " + outcome.id);

  const decision = (domain.decisions || []).find(item => item.id === nba.decisionId);
  if (!decision) throw new Error("Decision not found for NBA " + nba.id);

  const validations = [];
  for (const ruleId of decision.ruleIds || []) {
    const rule = (domain.rules || []).find(item => item.id === ruleId);
    if (!rule) continue;

    const delta = effectivenessDelta(outcome.effectiveness);
    const proposedConfidence = clamp(Number(rule.confidence || 50) + delta, 0, 100);
    const positive = delta > 0;
    const strongEvidence = Number(outcome.effectiveness || 0) >= 80;
    const humanReviewRequired =
      decision.humanReviewRequired ||
      /医学|证据|适应症|合规/.test(rule.title + rule.context + rule.action) ||
      proposedConfidence >= 90;

    validations.push({
      id: "rv-" + randomUUID(),
      type: "RuleValidation",
      ruleId: rule.id,
      decisionId: decision.id,
      nbaId: nba.id,
      outcomeId: outcome.id,
      previousConfidence: Number(rule.confidence || 50),
      proposedConfidence,
      delta,
      evidenceDirection: positive ? "support" : (delta < 0 ? "contradict" : "neutral"),
      effectiveness: Number(outcome.effectiveness || 0),
      signal: outcome.signal,
      strongEvidence,
      humanReviewRequired,
      status: humanReviewRequired ? "review_required" : "proposed",
      createdAt: now()
    });
  }

  return validations;
}

function applySafeValidation(domain, validation) {
  const rule = (domain.rules || []).find(item => item.id === validation.ruleId);
  if (!rule) return null;
  if (validation.humanReviewRequired) return rule;

  rule.confidence = validation.proposedConfidence;
  rule.updatedAt = now();
  validation.status = "applied";

  if (rule.status === "testing" && rule.confidence >= 80) {
    rule.status = "validated";
  }

  return rule;
}

function reviewValidation(domain, validationId, action, reviewer) {
  const validation = (domain.ruleValidations || []).find(item => item.id === validationId);
  if (!validation) throw new Error("Rule validation not found");

  const rule = (domain.rules || []).find(item => item.id === validation.ruleId);
  if (!rule) throw new Error("Rule not found");

  if (action === "approve") {
    rule.confidence = validation.proposedConfidence;
    rule.updatedAt = now();
    if (rule.status === "testing" && rule.confidence >= 80) rule.status = "validated";
    validation.status = "approved";
  } else if (action === "reject") {
    validation.status = "rejected";
  } else {
    throw new Error("Unsupported review action");
  }

  validation.reviewedBy = reviewer || "reviewer";
  validation.reviewedAt = now();
  return { validation, rule };
}

module.exports = {
  effectivenessDelta,
  buildRuleValidation,
  applySafeValidation,
  reviewValidation
};
