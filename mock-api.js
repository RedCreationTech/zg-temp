(function () {
  "use strict";

  var STORAGE_KEY = "zg-ai-gps-frontend-prototype-v1";

  function uid(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function initialState() {
    return {
      sessions: [],
      customRules: [],
      ruleConfidence: {},
      actions: [],
      contexts: [],
      decisions: [],
      nbas: [],
      outcomes: [],
      ruleValidations: [],
      audit: [],
      actionStatus: {},
      crmSync: { status: "idle", lastSyncedAt: null, records: 0 }
    };
  }

  function loadState() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return Object.assign(initialState(), parsed || {});
    } catch (e) {
      return initialState();
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function audit(state, event, actor, object, detail) {
    state.audit.unshift({
      id: uid("audit"),
      at: new Date().toISOString(),
      event: event,
      actor: actor || "演示用户",
      object: object || "-",
      detail: detail || ""
    });
    state.audit = state.audit.slice(0, 80);
  }

  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  async function streamText(text, onToken) {
    var chunks = String(text || "").match(/.{1,8}/g) || [];
    for (var i = 0; i < chunks.length; i += 1) {
      await delay(32 + (i % 3) * 12);
      if (onToken) onToken(chunks[i], i === chunks.length - 1);
    }
  }

  function rulesFor(type) {
    if (type === "hospital") return ["R-023", "R-037"];
    if (type === "doctor") return ["R-019", "R-031"];
    if (type === "coaching") return ["R-031", "R-019"];
    return ["R-037", "R-023"];
  }

  function findHospital(id) {
    return (window.ZG_DATA.hospitals || []).find(function (x) { return x.id === id; }) || window.ZG_DATA.hospitals[0];
  }

  function findDoctor(id) {
    return (window.ZG_DATA.doctors || []).find(function (x) { return x.id === id; }) || window.ZG_DATA.doctors[0];
  }

  function findVisit(id) {
    return (window.ZG_DATA.visits || []).find(function (x) { return x.id === id; }) || window.ZG_DATA.visits[0];
  }

  function ruleById(state, id) {
    var all = (window.ZG_DATA.rules || []).concat(state.customRules || []);
    var rule = all.find(function (x) { return x.id === id; });
    if (!rule) return { id: id, title: id, confidence: 60, status: "testing" };
    var copy = clone(rule);
    if (state.ruleConfidence[id] != null) copy.confidence = state.ruleConfidence[id];
    return copy;
  }

  function proposal(type, targetId) {
    if (type === "hospital") {
      var h = findHospital(targetId);
      var lever = h.levers && h.levers[0];
      return {
        targetType: "hospital",
        targetId: h.id,
        priority: Number(lever && lever.score || h.opportunity || 85),
        who: lever ? lever.who : "地区经理 / 关键医生",
        when: lever ? lever.when : "本周内",
        what: lever ? lever.what : "聚焦当前最高价值业务杠杆",
        why: lever ? lever.why : "避免平均投入, 把资源放到最值得改变的节点",
        success: lever ? lever.success : "形成明确业务推进信号",
        risk: "low",
        review: false
      };
    }

    if (type === "doctor") {
      var d = findDoctor(targetId);
      return {
        targetType: "doctor",
        targetId: d.id,
        priority: d.nextScore || 90,
        who: d.name,
        when: d.trigger,
        what: "先确认患者选择标准, 再调用与当前决策标准直接匹配的证据, 最后请求具体下一步承诺",
        why: d.gap,
        success: d.targetBehavior,
        risk: "low",
        review: false
      };
    }

    if (type === "coaching") {
      var v = findVisit(targetId);
      return {
        targetType: "visit",
        targetId: v.id,
        priority: Math.min(98, 100 - Number(v.score || 70) + 55),
        who: v.rep + " / 地区经理",
        when: "下一次拜访前",
        what: v.nextScript,
        why: "首要失效点是 " + v.issue + ", 优先只改一个最影响结果的行为",
        success: "完成角色演练并在下一次真实拜访中形成明确客户行为承诺",
        risk: v.severity === "高" ? "medium" : "low",
        review: false
      };
    }

    return {
      targetType: "cockpit",
      targetId: "national",
      priority: 91,
      who: "销售总监 / 地区经理",
      when: "本周经营 Review",
      what: "增加高确定性场景资源, 纠偏无目标行为的覆盖动作, 暂停决策链不清晰的高成本投入",
      why: "管理层价值来自资源选择与组织纠偏, 而不是查看更多数据",
      success: "重点事项均形成加资源、保持、纠偏、升级或停止中的明确决策",
      risk: "medium",
      review: true
    };
  }

  async function generateNBA(type, context, onToken) {
    var state = loadState();
    var targetId = context && context.targetId;
    var p = proposal(type, targetId);
    var ruleIds = rulesFor(type);
    var ctx = {
      id: uid("ctx"),
      targetType: p.targetType,
      targetId: p.targetId,
      actor: context && context.actor || "演示用户",
      role: context && context.role || "演示角色",
      facts: ["当前对象=" + p.targetType + ":" + p.targetId],
      signals: ["当前优先级=" + p.priority],
      constraints: ["输出必须形成可执行 NBA", "所有业务结果通过 Outcome 回流"],
      evidenceRefs: ["demo:evidence"],
      createdAt: new Date().toISOString()
    };
    var decision = {
      id: uid("dec"),
      contextSnapshotId: ctx.id,
      decisionType: type,
      priorityScore: p.priority,
      rationale: p.why,
      ruleIds: ruleIds,
      riskLevel: p.risk,
      humanReviewRequired: p.review,
      createdAt: new Date().toISOString()
    };
    var nba = {
      id: uid("nba"),
      decisionId: decision.id,
      targetType: p.targetType,
      targetId: p.targetId,
      who: p.who,
      when: p.when,
      what: p.what,
      why: p.why,
      success: p.success,
      owner: p.who,
      status: "proposed",
      createdAt: new Date().toISOString()
    };
    var text = "WHO: " + nba.who + "。WHEN: " + nba.when + "。WHAT: " + nba.what + "。WHY: " + nba.why + "。SUCCESS: " + nba.success + "。";

    state.contexts.push(ctx);
    state.decisions.push(decision);
    state.nbas.push(nba);
    audit(state, "nba.generate", ctx.actor, nba.id, "type=" + type + "; score=" + decision.priorityScore);
    saveState(state);

    await streamText(text, onToken);
    return {
      ok: true,
      prototype: true,
      type: type,
      text: text,
      context: ctx,
      decision: decision,
      nba: nba,
      rules: ruleIds.map(function (id) { return ruleById(state, id); }),
      model: "ZG Frontend Decision Simulator"
    };
  }

  async function acceptNBA(nbaId, payload) {
    await delay(180);
    var state = loadState();
    var existing = state.actions.find(function (x) { return x.nbaId === nbaId; });
    if (existing) return { ok: true, prototype: true, action: existing, existing: true };

    var nba = state.nbas.find(function (x) { return x.id === nbaId; });
    var action = {
      id: uid("act"),
      nbaId: nbaId,
      title: nba ? nba.what : "原型 Action",
      description: nba ? nba.why : "",
      successSignal: nba ? nba.success : "形成可验证业务信号",
      ownerName: nba ? nba.owner : "演示用户",
      priority: payload && payload.priority || 2,
      status: "todo",
      acceptedBy: payload && payload.actor || "演示用户",
      acceptedAt: new Date().toISOString()
    };
    state.actions.push(action);
    state.actionStatus[action.id] = "todo";
    if (nba) nba.status = "accepted";
    audit(state, "nba.accept", action.acceptedBy, nbaId, "action=" + action.id);
    saveState(state);
    return { ok: true, prototype: true, action: action };
  }

  async function recordOutcome(payload) {
    await delay(220);
    var state = loadState();
    var nba = state.nbas.find(function (x) { return x.id === payload.nbaId; });
    var outcome = {
      id: uid("out"),
      nbaId: payload.nbaId,
      actionId: payload.actionId || null,
      targetType: nba && nba.targetType,
      targetId: nba && nba.targetId,
      result: payload.result,
      signal: payload.signal,
      evidence: payload.evidence || "",
      effectiveness: Number(payload.effectiveness || 50),
      recordedBy: payload.actor || "演示用户",
      occurredAt: new Date().toISOString()
    };
    state.outcomes.push(outcome);
    if (nba) nba.status = "measured";

    var action = state.actions.find(function (x) {
      return x.id === payload.actionId || x.nbaId === payload.nbaId;
    });
    if (action) {
      action.status = "done";
      action.completedAt = new Date().toISOString();
      state.actionStatus[action.id] = "done";
      outcome.actionId = action.id;
    }

    var decision = nba && state.decisions.find(function (x) { return x.id === nba.decisionId; });
    var validations = [];
    (decision && decision.ruleIds || []).forEach(function (ruleId) {
      var rule = ruleById(state, ruleId);
      var effect = outcome.effectiveness;
      var delta = effect >= 85 ? 4 : effect >= 70 ? 2 : effect >= 55 ? 1 : effect >= 40 ? -1 : effect >= 20 ? -3 : -5;
      var proposed = Math.max(0, Math.min(100, Number(rule.confidence || 60) + delta));
      var needsReview = decision.humanReviewRequired || /医学|证据|合规/.test((rule.title || "") + (rule.context || "")) || proposed >= 90;
      var validation = {
        id: uid("rv"),
        ruleId: ruleId,
        decisionId: decision.id,
        nbaId: nba.id,
        outcomeId: outcome.id,
        previousConfidence: Number(rule.confidence || 60),
        proposedConfidence: proposed,
        delta: delta,
        evidenceDirection: delta > 0 ? "support" : delta < 0 ? "contradict" : "neutral",
        effectiveness: effect,
        signal: outcome.signal,
        humanReviewRequired: needsReview,
        status: needsReview ? "review_required" : "applied",
        createdAt: new Date().toISOString()
      };
      if (!needsReview) state.ruleConfidence[ruleId] = proposed;
      state.ruleValidations.push(validation);
      validations.push(validation);
    });

    audit(state, "outcome.record", outcome.recordedBy, outcome.id, "effectiveness=" + outcome.effectiveness);
    saveState(state);
    return { ok: true, prototype: true, outcome: outcome, action: action || null, ruleValidations: validations };
  }

  async function reviewRuleValidation(validationId, action, actor) {
    await delay(160);
    var state = loadState();
    var validation = state.ruleValidations.find(function (x) { return x.id === validationId; });
    if (!validation) return { ok: false, prototype: true };
    validation.status = action === "approve" ? "approved" : "rejected";
    validation.reviewedBy = actor || "演示审核人";
    validation.reviewedAt = new Date().toISOString();
    if (action === "approve") state.ruleConfidence[validation.ruleId] = validation.proposedConfidence;
    audit(state, "rule.validation.review", actor, validationId, "action=" + action);
    saveState(state);
    return { ok: true, prototype: true, validation: validation, rule: ruleById(state, validation.ruleId) };
  }

  async function transcribeVisit(file) {
    await delay(520);
    var state = loadState();
    var result = {
      ok: true,
      prototype: true,
      fileName: file && file.name ? file.name : "demo-visit.m4a",
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
    audit(state, "visit.transcribe", "演示用户", result.fileName, result.diagnosis.topIssue);
    saveState(state);
    return result;
  }

  async function saveRule(rule) {
    await delay(180);
    var state = loadState();
    var saved = Object.assign({}, rule, {
      id: rule.id || "R-P" + String(state.customRules.length + 1).padStart(2, "0"),
      type: "DecisionRule",
      status: rule.status || "testing",
      confidence: Number(rule.confidence || 60),
      uses: Number(rule.uses || 0),
      createdAt: new Date().toISOString()
    });
    state.customRules.unshift(saved);
    audit(state, "rule.create", rule.actor, saved.id, saved.title);
    saveState(state);
    return { ok: true, prototype: true, rule: saved };
  }

  async function syncCRM(payload) {
    await delay(260);
    var state = loadState();
    state.crmSync = { status: "demo-synced", lastSyncedAt: new Date().toISOString(), records: Number(payload && payload.records || 1286) };
    audit(state, "crm.sync.demo", payload && payload.actor, "CRM/SFE", "records=" + state.crmSync.records);
    saveState(state);
    return { ok: true, prototype: true, crmSync: state.crmSync };
  }

  async function createSession(session) {
    var state = loadState();
    var saved = Object.assign({ id: uid("session") }, session || {});
    state.sessions.unshift(saved);
    state.sessions = state.sessions.slice(0, 10);
    audit(state, "session.login", saved.name, saved.role, "进入前端原型");
    saveState(state);
    return { ok: true, prototype: true, session: saved };
  }

  async function updateActionStatus(actionId, status, actor) {
    var state = loadState();
    state.actionStatus[actionId] = status;
    var action = state.actions.find(function (x) { return x.id === actionId; });
    if (action) action.status = status;
    audit(state, "action.status", actor, actionId, "status=" + status);
    saveState(state);
    return { ok: true, prototype: true, actionId: actionId, status: status, action: action || null };
  }

  async function bootstrap() {
    var state = loadState();
    return {
      ok: true,
      prototype: true,
      actionStatus: clone(state.actionStatus),
      customRules: clone(state.customRules),
      crmSync: clone(state.crmSync),
      session: state.sessions[0] || null,
      domainSummary: {
        hospitals: (window.ZG_DATA.hospitals || []).length,
        doctors: (window.ZG_DATA.doctors || []).length,
        visits: (window.ZG_DATA.visits || []).length,
        rules: (window.ZG_DATA.rules || []).length + state.customRules.length,
        decisions: state.decisions.length,
        nbas: state.nbas.length,
        actions: state.actions.length,
        outcomes: state.outcomes.length,
        ruleValidations: state.ruleValidations.length
      }
    };
  }

  async function getOrg() {
    return {
      ok: true,
      prototype: true,
      organization: {
        id: "org-demo",
        name: "ZG AI GPS Demo",
        regions: [
          { id: "r-east", name: "华东区", manager: "李明", hospitals: 3, reps: 7 },
          { id: "r-south", name: "华南区", manager: "王芳", hospitals: 4, reps: 8 },
          { id: "r-north", name: "华北区", manager: "赵鹏", hospitals: 5, reps: 6 }
        ]
      },
      users: [
        { id: "u1", name: "李明", role: "地区经理", region: "华东区", scope: "region" },
        { id: "u2", name: "张蕾", role: "医药代表", region: "华东区", scope: "territory" },
        { id: "u3", name: "刘晨", role: "医药代表", region: "华东区", scope: "territory" },
        { id: "u4", name: "陈总", role: "销售总监", region: "全国", scope: "national" }
      ],
      roles: [
        { role: "医药代表", permissions: ["doctor.read", "doctor.nba", "visit.review", "evidence.read"] },
        { role: "地区经理", permissions: ["hospital.nba", "doctor.nba", "coaching.manage", "action.manage"] },
        { role: "销售总监", permissions: ["cockpit.read", "resource.decide", "pilot.read", "rule.review"] }
      ]
    };
  }

  async function getAudit() {
    return { ok: true, prototype: true, audit: clone(loadState().audit) };
  }

  async function getDecisions() {
    var state = loadState();
    return { ok: true, prototype: true, decisions: clone(state.decisions).reverse(), nbas: clone(state.nbas).reverse() };
  }

  async function getOutcomes() {
    return { ok: true, prototype: true, outcomes: clone(loadState().outcomes).reverse() };
  }

  async function getActions() {
    return { ok: true, prototype: true, actions: clone(loadState().actions).reverse() };
  }

  async function getRuleValidations() {
    return { ok: true, prototype: true, ruleValidations: clone(loadState().ruleValidations).reverse() };
  }

  async function getHospitals() {
    return { ok: true, prototype: true, hospitals: clone(window.ZG_DATA.hospitals || []) };
  }

  async function health() {
    return { ok: true, prototype: true, frontendOnly: true, service: "ZG Frontend Prototype" };
  }

  window.ZG_API = {
    generateNBA: generateNBA,
    acceptNBA: acceptNBA,
    recordOutcome: recordOutcome,
    reviewRuleValidation: reviewRuleValidation,
    transcribeVisit: transcribeVisit,
    saveRule: saveRule,
    syncCRM: syncCRM,
    createSession: createSession,
    updateActionStatus: updateActionStatus,
    bootstrap: bootstrap,
    getOrg: getOrg,
    getAudit: getAudit,
    getDecisions: getDecisions,
    getOutcomes: getOutcomes,
    getActions: getActions,
    getRuleValidations: getRuleValidations,
    getHospitals: getHospitals,
    health: health
  };
})();