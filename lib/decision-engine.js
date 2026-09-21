"use strict";

const { randomUUID } = require("crypto");
const {
  getHospital,
  getDoctor,
  getVisit,
  createContextSnapshot,
  createDecision,
  createNBA,
  clamp,
  now
} = require("./domain-model");

function applicableRules(domain, type) {
  return (domain.rules || [])
    .filter(rule => !rule.appliesTo || rule.appliesTo.length === 0 || rule.appliesTo.includes(type))
    .sort((a, b) => Number(b.confidence || 0) - Number(a.confidence || 0));
}

function buildHospitalContext(domain, targetId, actor, role) {
  const hospital = getHospital(domain, targetId) || domain.hospitals[0];
  if (!hospital) throw new Error("Hospital context not found");

  const doctors = (domain.doctors || []).filter(item => item.hospitalId === hospital.id);
  const topDoctor = doctors.slice().sort((a, b) => Number(b.nextActionScore || 0) - Number(a.nextActionScore || 0))[0];

  return createContextSnapshot({
    id: "ctx-" + randomUUID(),
    targetType: "hospital",
    targetId: hospital.id,
    actor,
    role,
    facts: [
      "医院层级=" + hospital.tier,
      "当前阶段=" + hospital.stage,
      "机会指数=" + hospital.opportunityScore,
      "可改变程度=" + hospital.changeabilityScore,
      "患者价值=" + hospital.patientValue
    ],
    signals: [
      "作战进度=" + hospital.progress + "%",
      topDoctor ? "最高优先医生=" + topDoctor.name + "(" + topDoctor.nextActionScore + ")" : "暂无关键医生"
    ],
    constraints: [
      "资源应优先投入高业务影响且高可改变节点",
      "不得以增加泛化拜访频次替代明确业务杠杆"
    ],
    evidenceRefs: ["hospital:" + hospital.id, topDoctor ? "doctor:" + topDoctor.id : null].filter(Boolean)
  });
}

function buildDoctorContext(domain, targetId, actor, role) {
  const doctor = getDoctor(domain, targetId) || domain.doctors[0];
  if (!doctor) throw new Error("Doctor context not found");
  const hospital = getHospital(domain, doctor.hospitalId);

  return createContextSnapshot({
    id: "ctx-" + randomUUID(),
    targetType: "doctor",
    targetId: doctor.id,
    actor,
    role,
    facts: [
      "医生=" + doctor.name,
      "影响力=" + doctor.influenceScore,
      "态度=" + doctor.support,
      "阶段=" + doctor.stage,
      "医院=" + (hospital ? hospital.name : doctor.hospitalId)
    ],
    signals: [
      "触发场景=" + doctor.trigger,
      "当前GAP=" + doctor.gap,
      "目标行为=" + doctor.targetBehavior,
      "行动优先分=" + doctor.nextActionScore
    ],
    constraints: [
      "所有证据必须绑定当前真实决策场景",
      "拜访结束必须形成有对象、有时间或有行为的可验证承诺"
    ],
    evidenceRefs: ["doctor:" + doctor.id, "hospital:" + doctor.hospitalId]
  });
}

function buildCoachingContext(domain, targetId, actor, role) {
  const visit = getVisit(domain, targetId) || domain.visits[0];
  if (!visit) throw new Error("Visit context not found");
  const doctor = getDoctor(domain, visit.doctorId);

  return createContextSnapshot({
    id: "ctx-" + randomUUID(),
    targetType: "visit",
    targetId: visit.id,
    actor,
    role,
    facts: [
      "代表=" + visit.repName,
      "拜访结果=" + visit.result,
      "综合评分=" + visit.score,
      "医生=" + (doctor ? doctor.name : visit.doctorId)
    ],
    signals: [
      "首要问题=" + visit.primaryIssue,
      "严重度=" + visit.severity,
      "复盘摘要=" + visit.summary
    ],
    constraints: [
      "优先只改一个最影响结果且可训练的问题",
      "经理必须定义下一次检查证据"
    ],
    evidenceRefs: ["visit:" + visit.id, "doctor:" + visit.doctorId]
  });
}

function buildCockpitContext(domain, actor, role) {
  const highHospitals = (domain.hospitals || [])
    .slice()
    .sort((a, b) => Number(b.opportunityScore || 0) - Number(a.opportunityScore || 0))
    .slice(0, 3);
  const highDoctors = (domain.doctors || [])
    .slice()
    .sort((a, b) => Number(b.nextActionScore || 0) - Number(a.nextActionScore || 0))
    .slice(0, 5);
  const riskyVisits = (domain.visits || []).filter(v => v.severity === "高");

  return createContextSnapshot({
    id: "ctx-" + randomUUID(),
    targetType: "cockpit",
    targetId: "national",
    actor,
    role,
    facts: [
      "重点医院数=" + highHospitals.length,
      "关键医生数=" + highDoctors.length,
      "高优先辅导拜访=" + riskyVisits.length
    ],
    signals: [
      "重点医院=" + highHospitals.map(x => x.name).join("、"),
      "重点医生=" + highDoctors.map(x => x.name).join("、"),
      "高风险拜访=" + riskyVisits.map(x => x.repName + "→" + x.doctorId).join("、")
    ],
    constraints: [
      "管理层只介入跨部门资源、重大偏离或高价值里程碑",
      "避免用更多报表替代明确管理动作"
    ],
    evidenceRefs: highHospitals.map(x => "hospital:" + x.id).concat(highDoctors.map(x => "doctor:" + x.id))
  });
}

function buildContext(domain, type, targetId, actor, role) {
  if (type === "hospital") return buildHospitalContext(domain, targetId, actor, role);
  if (type === "doctor") return buildDoctorContext(domain, targetId, actor, role);
  if (type === "coaching") return buildCoachingContext(domain, targetId, actor, role);
  if (type === "cockpit") return buildCockpitContext(domain, actor, role);
  throw new Error("Unsupported decision type: " + type);
}

function selectRules(domain, type, context) {
  const rules = applicableRules(domain, type);
  const selected = [];

  for (const rule of rules) {
    let score = Number(rule.confidence || 0);
    const text = (context.facts || []).concat(context.signals || []).join(" ");

    if (type === "doctor" && /方案选择|决策场景|高影响力/.test(rule.context + rule.title)) score += 12;
    if (type === "coaching" && /承诺|拜访|探询|呈现/.test(rule.context + rule.title + rule.action)) score += 10;
    if (type === "hospital" && /资源|流程|决策链|医院/.test(rule.context + rule.title + rule.action)) score += 8;
    if (text.includes("探询不足") && /探询|承诺|决策标准/.test(rule.title + rule.action)) score += 14;
    if (text.includes("准入准备") && /决策链/.test(rule.title + rule.action)) score += 14;

    selected.push({ rule, score });
  }

  return selected
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.rule);
}

function decideHospital(domain, context, rules) {
  const hospital = getHospital(domain, context.targetId);
  const doctors = (domain.doctors || []).filter(d => d.hospitalId === hospital.id);
  const topDoctor = doctors.slice().sort((a, b) => b.nextActionScore - a.nextActionScore)[0];
  const priority = clamp(
    hospital.opportunityScore * 0.45 +
    hospital.changeabilityScore * 0.35 +
    (topDoctor ? topDoctor.nextActionScore : 60) * 0.2,
    0,
    100
  );

  let what = "围绕当前最高价值业务杠杆重新配置本周资源";
  let why = "医院机会价值较高, 当前需要把有限资源集中到最可改变的关键节点";
  let success = "Top 1 杠杆点形成明确 Owner、时机、动作和业务成功信号";

  if (hospital.id === "h1") {
    what = "把医学资源集中到周三 MDT 的方案选择节点, 不增加泛化覆盖";
    why = "当前主要流失点在方案选择阶段的证据缺口, 而不是覆盖不足";
    success = "关键医生同意在一例匹配患者中讨论目标方案";
  } else if (hospital.id === "h2") {
    what = "围绕 3 类典型患者组织一次小范围病例共识讨论";
    why = "门诊患者量足够, 主要 GAP 是患者识别标准不一致";
    success = "科室确认病例讨论时间并形成统一患者识别标准";
  } else if (hospital.id === "h3") {
    what = "暂停高成本活动投入, 优先补齐关键影响者和准入决策链";
    why = "当前最大不确定性来自决策链信息不足, 继续扩大活动投入的确定性较低";
    success = "90% 关键影响角色完成映射并明确影响关系";
  }

  return {
    priorityScore: Math.round(priority),
    rationale: why,
    riskLevel: hospital.id === "h3" ? "medium" : "low",
    humanReviewRequired: false,
    who: topDoctor ? topDoctor.name + " / 地区经理" : "地区经理",
    when: hospital.id === "h1" ? "周三 MDT 前" : "本周内",
    what,
    why,
    success,
    owner: "地区经理",
    evidenceRefs: context.evidenceRefs,
    ruleIds: rules.map(r => r.id)
  };
}

function decideDoctor(domain, context, rules) {
  const doctor = getDoctor(domain, context.targetId);
  const priority = clamp(
    doctor.nextActionScore * 0.5 +
    doctor.influenceScore * 0.3 +
    (doctor.stage === "方案选择" ? 95 : 75) * 0.2,
    0,
    100
  );

  return {
    priorityScore: Math.round(priority),
    rationale: doctor.gap,
    riskLevel: "low",
    humanReviewRequired: false,
    who: doctor.name,
    when: doctor.trigger,
    what: "先确认患者选择标准, 再调用与当前决策标准直接匹配的证据, 最后请求具体下一步承诺",
    why: "当前最佳机会来自真实决策时机, 泛化产品介绍无法直接改变目标行为",
    success: doctor.targetBehavior,
    owner: doctor.ownerUserId || "负责代表",
    evidenceRefs: context.evidenceRefs,
    ruleIds: rules.map(r => r.id)
  };
}

function decideCoaching(domain, context, rules) {
  const visit = getVisit(domain, context.targetId);
  return {
    priorityScore: Math.round(clamp(100 - visit.score + (visit.severity === "高" ? 55 : 25), 0, 100)),
    rationale: visit.summary,
    riskLevel: visit.severity === "高" ? "medium" : "low",
    humanReviewRequired: false,
    who: visit.repName + " / 地区经理",
    when: "下一次拜访前",
    what: visit.nextScript,
    why: "首要失效点是 " + visit.primaryIssue + ", 优先修复一个关键行为比同时训练多个维度更容易形成可验证改进",
    success: "完成角色演练, 并在下一次真实拜访中形成明确客户行为承诺",
    owner: "地区经理",
    evidenceRefs: context.evidenceRefs,
    ruleIds: rules.map(r => r.id)
  };
}

function decideCockpit(domain, context, rules) {
  return {
    priorityScore: 91,
    rationale: "管理层应聚焦高价值医院、关键医生、策略偏离和需要跨部门资源的少数事项",
    riskLevel: "medium",
    humanReviewRequired: true,
    who: "销售总监 / 地区经理",
    when: "本周经营 Review",
    what: "增加高确定性场景化资源, 纠偏无明确目标行为的覆盖动作, 暂停决策链不清晰的高成本投入",
    why: "管理层价值来自资源选择与组织纠偏, 而不是查看更多结果数据",
    success: "重点管理事项均形成加资源、保持、纠偏、升级或停止中的明确决策",
    owner: "销售总监",
    evidenceRefs: context.evidenceRefs,
    ruleIds: rules.map(r => r.id)
  };
}

function runDecision(domain, request) {
  const type = String(request.type || "doctor");
  const actor = request.actor || "demo-user";
  const role = request.role || (request.context && request.context.role) || "unknown";
  const targetId =
    request.targetId ||
    (request.context && (
      request.context.targetId ||
      request.context.hospitalId ||
      request.context.doctorId ||
      request.context.visitId
    ));

  const context = buildContext(domain, type, targetId, actor, role);
  const rules = selectRules(domain, type, context);

  let proposal;
  if (type === "hospital") proposal = decideHospital(domain, context, rules);
  else if (type === "doctor") proposal = decideDoctor(domain, context, rules);
  else if (type === "coaching") proposal = decideCoaching(domain, context, rules);
  else proposal = decideCockpit(domain, context, rules);

  const decision = createDecision({
    id: "dec-" + randomUUID(),
    contextSnapshotId: context.id,
    decisionType: type,
    priorityScore: proposal.priorityScore,
    rationale: proposal.rationale,
    ruleIds: proposal.ruleIds,
    riskLevel: proposal.riskLevel,
    humanReviewRequired: proposal.humanReviewRequired,
    createdAt: now()
  });

  const nba = createNBA({
    id: "nba-" + randomUUID(),
    decisionId: decision.id,
    targetType: context.targetType,
    targetId: context.targetId,
    who: proposal.who,
    when: proposal.when,
    what: proposal.what,
    why: proposal.why,
    success: proposal.success,
    owner: proposal.owner,
    status: "proposed",
    evidenceRefs: proposal.evidenceRefs,
    createdAt: now()
  });

  const text =
    "WHO: " + nba.who + "。WHEN: " + nba.when + "。WHAT: " + nba.what +
    "。WHY: " + nba.why + "。SUCCESS: " + nba.success + "。";

  return {
    context,
    decision,
    nba,
    rules,
    text,
    model: "ZG Decision Engine v0.1"
  };
}

module.exports = {
  runDecision,
  buildContext,
  selectRules
};
