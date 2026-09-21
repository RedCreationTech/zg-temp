"use strict";

const VALID_ENTITY_TYPES = new Set([
  "Hospital",
  "Doctor",
  "Visit",
  "ContextSnapshot",
  "Decision",
  "NBA",
  "Action",
  "Outcome",
  "DecisionRule"
]);

function now() {
  return new Date().toISOString();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

function requiredString(value, field) {
  const result = String(value == null ? "" : value).trim();
  if (!result) throw new Error(field + " is required");
  return result;
}

function ensureDomain(domain) {
  const target = domain || {};
  const collections = [
    "hospitals",
    "doctors",
    "visits",
    "rules",
    "actions",
    "contextSnapshots",
    "decisions",
    "nbas",
    "outcomes",
    "ruleValidations"
  ];
  for (const key of collections) {
    if (!Array.isArray(target[key])) target[key] = [];
  }
  return target;
}

function findById(list, id) {
  return (list || []).find(item => item && item.id === id) || null;
}

function getHospital(domain, id) {
  return findById(domain.hospitals, id);
}

function getDoctor(domain, id) {
  return findById(domain.doctors, id);
}

function getVisit(domain, id) {
  return findById(domain.visits, id);
}

function getRule(domain, id) {
  return findById(domain.rules, id);
}

function listDoctors(domain, hospitalId) {
  return (domain.doctors || []).filter(item => !hospitalId || item.hospitalId === hospitalId);
}

function listVisits(domain, filters) {
  filters = filters || {};
  return (domain.visits || []).filter(item => {
    if (filters.hospitalId && item.hospitalId !== filters.hospitalId) return false;
    if (filters.doctorId && item.doctorId !== filters.doctorId) return false;
    if (filters.repUserId && item.repUserId !== filters.repUserId) return false;
    return true;
  });
}

function createContextSnapshot(input) {
  return {
    id: input.id,
    type: "ContextSnapshot",
    targetType: requiredString(input.targetType, "targetType"),
    targetId: requiredString(input.targetId, "targetId"),
    actor: input.actor || "demo-user",
    role: input.role || "unknown",
    facts: Array.isArray(input.facts) ? input.facts : [],
    signals: Array.isArray(input.signals) ? input.signals : [],
    constraints: Array.isArray(input.constraints) ? input.constraints : [],
    evidenceRefs: Array.isArray(input.evidenceRefs) ? input.evidenceRefs : [],
    createdAt: input.createdAt || now()
  };
}

function createDecision(input) {
  return {
    id: input.id,
    type: "Decision",
    contextSnapshotId: requiredString(input.contextSnapshotId, "contextSnapshotId"),
    decisionType: requiredString(input.decisionType, "decisionType"),
    priorityScore: clamp(input.priorityScore || 0, 0, 100),
    rationale: requiredString(input.rationale, "rationale"),
    ruleIds: Array.isArray(input.ruleIds) ? input.ruleIds : [],
    riskLevel: input.riskLevel || "low",
    humanReviewRequired: Boolean(input.humanReviewRequired),
    createdAt: input.createdAt || now()
  };
}

function createNBA(input) {
  return {
    id: input.id,
    type: "NBA",
    decisionId: requiredString(input.decisionId, "decisionId"),
    targetType: requiredString(input.targetType, "targetType"),
    targetId: requiredString(input.targetId, "targetId"),
    who: requiredString(input.who, "who"),
    when: requiredString(input.when, "when"),
    what: requiredString(input.what, "what"),
    why: requiredString(input.why, "why"),
    success: requiredString(input.success, "success"),
    owner: input.owner || "",
    dueAt: input.dueAt || null,
    status: input.status || "proposed",
    evidenceRefs: Array.isArray(input.evidenceRefs) ? input.evidenceRefs : [],
    createdAt: input.createdAt || now()
  };
}

function createAction(input) {
  return {
    id: input.id,
    type: "Action",
    nbaId: requiredString(input.nbaId, "nbaId"),
    sourceType: input.sourceType || null,
    sourceEntityId: input.sourceEntityId || null,
    hospitalId: input.hospitalId || null,
    doctorId: input.doctorId || null,
    ownerUserId: input.ownerUserId || null,
    ownerName: input.ownerName || null,
    priority: clamp(input.priority == null ? 2 : input.priority, 1, 3),
    title: requiredString(input.title, "title"),
    description: input.description || "",
    status: input.status || "todo",
    successSignal: requiredString(input.successSignal, "successSignal"),
    dueAt: input.dueAt || null,
    acceptedBy: input.acceptedBy || "demo-user",
    acceptedAt: input.acceptedAt || now(),
    completedAt: input.completedAt || null,
    createdAt: input.createdAt || now(),
    updatedAt: now()
  };
}

function createOutcome(input) {
  return {
    id: input.id,
    type: "Outcome",
    nbaId: requiredString(input.nbaId, "nbaId"),
    actionId: input.actionId || null,
    targetType: input.targetType || null,
    targetId: input.targetId || null,
    result: requiredString(input.result, "result"),
    signal: requiredString(input.signal, "signal"),
    evidence: input.evidence || "",
    effectiveness: clamp(input.effectiveness == null ? 50 : input.effectiveness, 0, 100),
    recordedBy: input.recordedBy || "demo-user",
    occurredAt: input.occurredAt || now(),
    createdAt: now()
  };
}

function createRule(input) {
  return {
    id: input.id,
    type: "DecisionRule",
    title: requiredString(input.title, "title"),
    context: requiredString(input.context, "context"),
    decision: requiredString(input.decision, "decision"),
    action: requiredString(input.action, "action"),
    outcome: requiredString(input.outcome, "outcome"),
    confidence: clamp(input.confidence == null ? 60 : input.confidence, 0, 100),
    status: input.status === "validated" ? "validated" : "testing",
    uses: Number(input.uses || 0),
    appliesTo: Array.isArray(input.appliesTo) ? input.appliesTo : [],
    createdAt: input.createdAt || now(),
    updatedAt: now()
  };
}

function assertEntity(entity) {
  if (!entity || typeof entity !== "object") throw new Error("entity is required");
  if (!VALID_ENTITY_TYPES.has(entity.type)) throw new Error("Unsupported entity type: " + entity.type);
  if (!entity.id) throw new Error("entity.id is required");
  return entity;
}

module.exports = {
  VALID_ENTITY_TYPES,
  ensureDomain,
  findById,
  getHospital,
  getDoctor,
  getVisit,
  getRule,
  listDoctors,
  listVisits,
  createContextSnapshot,
  createDecision,
  createNBA,
  createAction,
  createOutcome,
  createRule,
  assertEntity,
  clamp,
  now
};
