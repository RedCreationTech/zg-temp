
(function () {
  "use strict";

  var data = window.ZG_DATA;
  var STORAGE_KEY = "zg-ai-gps-demo-v1";
  var titles = {
    dashboard: "今日行动",
    rep: "代表工作台",
    visitlive: "拜访中",
    hospital: "医院作战",
    doctor: "医生导航",
    teamcoaching: "团队辅导",
    managerreview: "周度 Review",
    coaching: "拜访辅导",
    cockpit: "总监驾驶舱",
    pilot: "Pilot 运营",
    learning: "组织学习",
    guardrails: "合规与安全",
    admin: "组织与权限"
  };

  var SCENARIOS = {
    hospital_attack: {
      id: "hospital_attack",
      name: "重点医院攻坚",
      role: "地区经理",
      hospitalId: "h1",
      doctorId: "d1",
      visitId: "v1",
      tag: "Hospital → Doctor → Coaching",
      description: "投入不少但核心科室推进慢. 先找到医院杠杆点, 再落到周主任的一次真实 MDT 决策.",
      outcome: "从“多拜访”切换为“改变一次关键决策场景”"
    },
    doctor_breakthrough: {
      id: "doctor_breakthrough",
      name: "关键医生突破",
      role: "医药代表",
      hospitalId: "h2",
      doctorId: "d3",
      visitId: "v3",
      tag: "Doctor NBA",
      description: "医院患者量充足, 但患者识别标准不一致. 代表需要把医生兴趣转成一次病例共识行动.",
      outcome: "从“医生觉得不错”推进到“确认病例讨论会”"
    },
    coaching_recovery: {
      id: "coaching_recovery",
      name: "拜访失效修复",
      role: "地区经理",
      hospitalId: "h1",
      doctorId: "d2",
      visitId: "v2",
      tag: "Visit Coaching",
      description: "内容讲清楚了, 但拜访结束没有形成任何承诺. 经理要快速定位失效点并完成关键句替换.",
      outcome: "从“下次再来”改成“具体病例 + 具体时间”"
    }
  };

  var DEMO_TOUR = [
    { role: "地区经理", route: "dashboard", kicker: "01 / ACTION", title: "先看今天真正值得做什么", desc: "AI GPS 不是把数据再展示一遍, 而是把医院、医生和拜访信号收敛成少数高优先 NBA." },
    { role: "地区经理", route: "hospital", kicker: "02 / HOSPITAL", title: "找到医院最值得打的业务杠杆", desc: "从机会价值和可改变程度出发, 避免平均投入, 形成 WHO / WHEN / WHAT / SUCCESS." },
    { role: "医药代表", route: "rep", kicker: "03 / REPRESENTATIVE", title: "代表今天怎么真正使用 AI GPS", desc: "从今天拜访谁开始, 完成准备、证据调用、异议应对和下一步承诺." },
    { role: "地区经理", route: "teamcoaching", kicker: "04 / TEAM COACHING", title: "经理先看团队, 再决定今天辅导谁", desc: "从团队失效模式、拜访质量和陪练完成度中筛出最值得立即辅导的代表." },
    { role: "地区经理", route: "managerreview", kicker: "05 / WEEKLY REVIEW", title: "把本周所有行动收敛成一次经理 Review", desc: "医院目标、代表 Action、Coaching、Outcome 和下周计划在一页闭环." },
    { role: "销售总监", route: "cockpit", kicker: "06 / MANAGEMENT", title: "管理层只处理真正需要介入的动作", desc: "加资源、纠偏、升级或停止, 而不是月底再看一张结果报表." },
    { role: "销售总监", route: "learning", kicker: "07 / LEARNING", title: "让真实 Outcome 回流为组织判断能力", desc: "有效和无效动作形成 RuleValidation, 高风险规则仍保留 Human Review." },
    { role: "销售总监", route: "pilot", kicker: "08 / PILOT", title: "最后用 8 周 Pilot 验证产品价值", desc: "验证客户愿意用、行动真的发生、结果能回流, 再决定扩展到更多 Agent 和区域." }
  ];

  var saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch (e) {
    saved = {};
  }

  var state = {
    route: saved.route || "dashboard",
    role: saved.role || "地区经理",
    selectedHospital: saved.selectedHospital || "h1",
    selectedDoctor: saved.selectedDoctor || "d1",
    selectedVisit: saved.selectedVisit || "v1",
    repSelectedVisit: saved.repSelectedVisit || "rv2",
    repQuickTasks: saved.repQuickTasks || {},
    liveVisitSessions: saved.liveVisitSessions || {},
    audioReviews: saved.audioReviews || {},
    reviewSessions: saved.reviewSessions || {},
    roleplaySessions: saved.roleplaySessions || {},
    liveVisitTab: "evidence",
    coachingTab: "review",
    teamCoachingFilter: saved.teamCoachingFilter || "priority",
    coachingAgendaStatus: saved.coachingAgendaStatus || {},
    coachingAgendaSelection: saved.coachingAgendaSelection || [],
    teamPlaybook: saved.teamPlaybook || null,
    managerReviewPlan: saved.managerReviewPlan || {},
    managerReviewGenerated: saved.managerReviewGenerated || false,
    managerReviewClosed: saved.managerReviewClosed || false,
    actionFilter: "all",
    selectedAction: null,
    actionStatus: saved.actionStatus || {},
    customRules: saved.customRules || [],
    session: saved.session || null,
    org: null,
    audit: [],
    crmSync: null,
    runtimeOnline: null,
    domainSummary: null,
    recentDecisions: [],
    recentNBAs: [],
    outcomes: [],
    serverActions: [],
    ruleValidations: [],
    prepStatus: saved.prepStatus || {},
    resourceOverrides: saved.resourceOverrides || {},
    managementDecisions: saved.managementDecisions || {},
    managementHistory: saved.managementHistory || [],
    pilotWeek: saved.pilotWeek || 4,
    demoScenario: saved.demoScenario || "hospital_attack",
    demoTourActive: false,
    demoTourStep: 0
  };

  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      route: state.route,
      role: state.role,
      selectedHospital: state.selectedHospital,
      selectedDoctor: state.selectedDoctor,
      selectedVisit: state.selectedVisit,
      repSelectedVisit: state.repSelectedVisit,
      repQuickTasks: state.repQuickTasks,
      liveVisitSessions: state.liveVisitSessions,
      audioReviews: state.audioReviews,
      reviewSessions: state.reviewSessions,
      roleplaySessions: state.roleplaySessions,
      teamCoachingFilter: state.teamCoachingFilter,
      coachingAgendaStatus: state.coachingAgendaStatus,
      coachingAgendaSelection: state.coachingAgendaSelection,
      teamPlaybook: state.teamPlaybook,
      managerReviewPlan: state.managerReviewPlan,
      managerReviewGenerated: state.managerReviewGenerated,
      managerReviewClosed: state.managerReviewClosed,
      actionStatus: state.actionStatus,
      customRules: state.customRules,
      session: state.session,
      prepStatus: state.prepStatus,
      resourceOverrides: state.resourceOverrides,
      managementDecisions: state.managementDecisions,
      managementHistory: state.managementHistory,
      pilotWeek: state.pilotWeek,
      demoScenario: state.demoScenario
    }));
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var MANAGEMENT_ACTIONS = {
    add: { label: "加资源", tone: "add", note: "增加跨部门资源或关键支持" },
    keep: { label: "保持", tone: "keep", note: "方向正确, 保持当前投入与节奏" },
    correct: { label: "纠偏", tone: "correct", note: "动作偏离策略, 调整目标或执行方式" },
    escalate: { label: "升级", tone: "escalate", note: "升级到经理或跨部门协同处理" },
    stop: { label: "停止", tone: "stop", note: "暂停低确定性或低价值投入" }
  };

  function managementLabel(key) {
    return MANAGEMENT_ACTIONS[key] ? MANAGEMENT_ACTIONS[key].label : "未决策";
  }

  function resourceStatus(hospitalId, resource) {
    var key = hospitalId + ":" + resource.id;
    return state.resourceOverrides[key] || resource.status;
  }

  function managementForHospital(hospitalId) {
    return (data.risks || []).filter(function (r) {
      return r.targetType === "hospital" && r.targetId === hospitalId && state.managementDecisions[r.id];
    }).map(function (r) {
      return { risk: r, decision: state.managementDecisions[r.id] };
    });
  }

  function managementForVisit(visitId) {
    return (data.risks || []).filter(function (r) {
      return r.targetType === "rep" && r.targetId === visitId && state.managementDecisions[r.id];
    }).map(function (r) {
      return { risk: r, decision: state.managementDecisions[r.id] };
    });
  }

  function resetManagementEffects(riskId) {
    if (riskId === "m1") {
      state.actionStatus.a1 = "todo";
      state.actionStatus.a2 = "doing";
      state.actionStatus.a3 = "todo";
      delete state.resourceOverrides["h1:r-h1-1"];
    }
    if (riskId === "m2") {
      state.actionStatus.a7 = "todo";
    }
    if (riskId === "m3") {
      state.actionStatus.a5 = "todo";
      delete state.resourceOverrides["h3:r-h3-3"];
    }
    if (riskId === "m4") {
      state.actionStatus.a4 = "doing";
      delete state.resourceOverrides["h2:r-h2-1"];
    }
  }

  function applyManagementEffects(risk, decision) {
    if (!risk) return;

    if (risk.id === "m1") {
      if (decision === "add" || decision === "keep") {
        state.actionStatus.a1 = "doing";
        state.actionStatus.a2 = "doing";
      }
      if (decision === "correct") state.actionStatus.a1 = "risk";
      if (decision === "escalate") state.actionStatus.a3 = "doing";
      state.resourceOverrides["h1:r-h1-1"] = decision === "stop" ? "hold" : (decision === "add" ? "doing" : "ready");
    }

    if (risk.id === "m2") {
      if (decision === "escalate" || decision === "correct") state.actionStatus.a7 = "doing";
      if (decision === "stop") state.actionStatus.a7 = "risk";
    }

    if (risk.id === "m3") {
      state.actionStatus.a5 = decision === "stop" || decision === "correct" ? "doing" : state.actionStatus.a5 || "todo";
      state.resourceOverrides["h3:r-h3-3"] = decision === "stop" ? "hold" : (decision === "add" ? "planned" : "hold");
    }

    if (risk.id === "m4") {
      if (decision === "keep" || decision === "add") state.actionStatus.a4 = "doing";
      if (decision === "correct" || decision === "escalate") state.actionStatus.a4 = "risk";
      state.resourceOverrides["h2:r-h2-1"] = decision === "stop" ? "hold" : "doing";
    }
  }

  function applyManagementDecision(riskId, decision) {
    var risk = (data.risks || []).find(function (r) { return r.id === riskId; });
    if (!risk || !MANAGEMENT_ACTIONS[decision]) return;

    resetManagementEffects(riskId);
    state.managementDecisions[riskId] = decision;
    applyManagementEffects(risk, decision);
    state.managementHistory.unshift({
      id: "md-" + Date.now(),
      riskId: riskId,
      object: risk.object,
      decision: decision,
      label: managementLabel(decision),
      owner: risk.owner,
      at: new Date().toISOString(),
      reason: risk.reason
    });
    state.managementHistory = state.managementHistory.slice(0, 20);
    saveState();
    showToast(risk.object + " · 管理决策: " + managementLabel(decision));
    render();
  }

  function clearManagementDecision(riskId) {
    if (!state.managementDecisions[riskId]) return;
    delete state.managementDecisions[riskId];

    resetManagementEffects(riskId);
    saveState();
    showToast("已撤销该管理决策及其演示联动");
    render();
  }

  function computePilotMetrics() {
    var resolved = Object.keys(state.managementDecisions || {}).length;
    var demoDone = (data.actions || []).filter(function (a) { return getActionStatus(a) === "done"; }).length;
    var demoDoing = (data.actions || []).filter(function (a) { return getActionStatus(a) === "doing"; }).length;
    var formal = state.serverActions || [];
    var formalDone = formal.filter(function (a) { return a.status === "done"; }).length;
    var outcomeCount = (state.outcomes || []).length;
    var approvedRules = (state.ruleValidations || []).filter(function (v) {
      return v.status === "approved" || v.status === "applied";
    }).length;

    return {
      weeklyActive: 84,
      nbaAdoption: Math.min(94, 76 + Math.min(8, formal.length * 2) + resolved),
      actionCompletion: Math.min(96, Math.round(68 + demoDone * 2 + demoDoing * 0.7 + formalDone * 3 + resolved * 1.5)),
      reviewCoverage: Math.min(96, 71 + resolved * 4),
      ruleReuse: 6 + approvedRules,
      outcomeRate: Math.min(92, 43 + outcomeCount * 7),
      marketProof: Math.min(96, 79 + resolved * 2),
      productProof: Math.min(96, 74 + formal.length * 2 + outcomeCount * 3),
      dataReadiness: 86,
      scaleReadiness: Math.min(94, 63 + resolved * 3 + outcomeCount * 3 + approvedRules * 2),
      resolved: resolved,
      outcomes: outcomeCount
    };
  }

  function getActionStatus(action) {
    return state.actionStatus[action.id] || action.status;
  }

  function statusLabel(status) {
    return { todo: "待执行", doing: "进行中", done: "已完成", risk: "需纠偏" }[status] || status;
  }

  function roleGreeting() {
    if (state.role === "销售总监") return "先看最值得管理层介入的动作, 再看结果.";
    if (state.role === "医药代表") return "把今天有限的拜访时间, 用在最值得改变的客户行为上.";
    return "先抓最值得改变的医院、医生和代表行为, 再分配资源.";
  }

  function icon(id) {
    return '<svg aria-hidden="true"><use href="#' + id + '"></use></svg>';
  }

  function metric(title, value, foot, trend, type) {
    return '<div class="metric-card">' +
      '<div class="metric-top"><span>' + esc(title) + '</span><span class="metric-icon">' + esc(type || "AI") + '</span></div>' +
      '<div class="metric-value">' + esc(value) + '</div>' +
      '<div class="metric-foot"><span class="' + (trend && trend.indexOf("+") === 0 ? "trend-up" : (trend ? "trend-warn" : "")) + '">' + esc(trend || "") + '</span><span>' + esc(foot) + '</span></div>' +
    '</div>';
  }

  function panel(title, subtitle, body, actions) {
    return '<section class="panel">' +
      '<div class="panel-head">' +
        '<div class="panel-title"><div><h3>' + esc(title) + '</h3><span>' + esc(subtitle || "") + '</span></div></div>' +
        '<div class="panel-actions">' + (actions || "") + '</div>' +
      '</div>' +
      '<div class="panel-body">' + body + '</div>' +
    '</section>';
  }

  function actionRows(actions) {
    if (!actions.length) return '<div class="empty-state"><strong>当前没有匹配行动</strong><span>切换筛选条件查看其他 NBA.</span></div>';
    return '<div class="action-list">' + actions.map(function (a) {
      var status = getActionStatus(a);
      return '<div class="action-row" data-action-id="' + a.id + '">' +
        '<div class="priority-badge p' + a.priority + '">P' + a.priority + '</div>' +
        '<div><div class="action-name">' + esc(a.title) + '</div><div class="action-desc">' + esc(a.desc) + '</div></div>' +
        '<div class="entity-label"><span class="entity-dot"></span>' + esc(a.entity) + '</div>' +
        '<div><span class="status ' + status + '">' + esc(statusLabel(status)) + '</span></div>' +
        '<div class="row-arrow">' + icon("i-arrow") + '</div>' +
      '</div>';
    }).join("") + '</div>';
  }

  function renderScenarioDeck() {
    var current = SCENARIOS[state.demoScenario] || SCENARIOS.hospital_attack;
    var cards = Object.keys(SCENARIOS).map(function (key) {
      var s = SCENARIOS[key];
      return '<button class="scenario-card ' + (key === state.demoScenario ? 'active' : '') + '" data-scenario="' + key + '">' +
        '<div class="scenario-top"><span class="scenario-role">' + esc(s.role) + '</span><span class="scenario-tag">' + esc(s.tag) + '</span></div>' +
        '<strong>' + esc(s.name) + '</strong><p>' + esc(s.description) + '</p>' +
        '<div class="scenario-outcome"><b>目标改变</b><span>' + esc(s.outcome) + '</span></div>' +
      '</button>';
    }).join("");

    return '<section class="scenario-section">' +
      '<div class="scenario-heading"><div><span class="eyebrow">DEMO SCENARIO</span><h3>客户演示场景</h3><p>先选一个真实业务故事, 系统会自动切到对应角色、医院、医生和拜访记录.</p></div>' +
      '<div class="scenario-actions"><button class="btn ghost" data-reset-prototype>重置演示</button><button class="btn primary" data-start-tour><span>▶</span> 开始 8 步演示</button></div></div>' +
      '<div class="scenario-grid">' + cards + '</div>' +
      '<div class="scenario-current"><span>当前故事</span><strong>' + esc(current.name) + '</strong><em>→</em><span>' + esc(current.outcome) + '</span></div>' +
    '</section>';
  }

  function renderAgentHandoff() {
    var current = SCENARIOS[state.demoScenario] || SCENARIOS.hospital_attack;
    var items = [
      { role: "地区经理", agent: "Hospital Agent", action: "确定医院 Top 杠杆点", status: "done", route: "hospital" },
      { role: "医药代表", agent: "Doctor Agent", action: "生成医生下一次行动", status: "active", route: "doctor" },
      { role: "地区经理", agent: "Coaching Agent", action: "先定位团队高优先辅导对象", status: "next", route: "teamcoaching" },
      { role: "销售总监", agent: "Decision Cockpit", action: "加资源 / 纠偏 / 升级", status: "next", route: "cockpit" }
    ];
    var html = items.map(function (item, i) {
      return '<button class="handoff-step ' + item.status + '" data-route-jump="' + item.route + '">' +
        '<div class="handoff-no">0' + (i + 1) + '</div><div><span>' + esc(item.role) + '</span><strong>' + esc(item.agent) + '</strong><p>' + esc(item.action) + '</p></div>' +
      '</button>';
    }).join('<div class="handoff-arrow">→</div>');
    return panel("Agent Team 行动交接", "同一个业务目标在不同角色之间继续推进 · 当前故事: " + current.name,
      '<div class="handoff-chain">' + html + '</div>'
    );
  }

  function resetFrontendPrototype() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("zg-ai-gps-frontend-prototype-v1");
    showToast("演示状态已重置");
    setTimeout(function () { window.location.reload(); }, 260);
  }

  function selectScenario(id, silent) {
    var s = SCENARIOS[id];
    if (!s) return;
    state.demoScenario = id;
    state.role = s.role;
    state.selectedHospital = s.hospitalId;
    state.selectedDoctor = s.doctorId;
    state.selectedVisit = s.visitId;
    state.coachingTab = "review";
    state.actionFilter = "all";
    saveState();
    render();
    if (!silent) showToast("已切换演示场景: " + s.name);
  }

  function ensureDemoTourShell() {
    var launcher = $("#demoTourLauncher");
    if (!launcher) {
      launcher = document.createElement("button");
      launcher.id = "demoTourLauncher";
      launcher.className = "demo-tour-launcher";
      launcher.innerHTML = '<span>▶</span><b>客户演示</b>';
      document.body.appendChild(launcher);
      launcher.addEventListener("click", function () { startDemoTour(); });
    }

    var bar = $("#demoTourBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "demoTourBar";
      bar.className = "demo-tour-bar";
      bar.innerHTML =
        '<button class="demo-tour-close" id="demoTourClose">×</button>' +
        '<div class="demo-tour-copy"><span id="demoTourKicker"></span><strong id="demoTourTitle"></strong><p id="demoTourDesc"></p></div>' +
        '<div class="demo-tour-progress" id="demoTourProgress"></div>' +
        '<div class="demo-tour-actions"><button class="btn ghost" id="demoTourPrev">上一步</button><button class="btn primary" id="demoTourNext">下一步</button></div>';
      document.body.appendChild(bar);
      $("#demoTourClose").addEventListener("click", stopDemoTour);
      $("#demoTourPrev").addEventListener("click", function () { stepDemoTour(-1); });
      $("#demoTourNext").addEventListener("click", function () { stepDemoTour(1); });
    }
    updateDemoTourShell();
  }

  function startDemoTour() {
    state.demoTourActive = true;
    state.demoTourStep = 0;
    var s = SCENARIOS[state.demoScenario] || SCENARIOS.hospital_attack;
    state.role = DEMO_TOUR[0].role || s.role;
    state.selectedHospital = s.hospitalId;
    state.selectedDoctor = s.doctorId;
    state.selectedVisit = s.visitId;
    navigate(DEMO_TOUR[0].route);
    updateDemoTourShell();
  }

  function stopDemoTour() {
    state.demoTourActive = false;
    updateDemoTourShell();
    showToast("已退出客户演示导览");
  }

  function stepDemoTour(delta) {
    if (!state.demoTourActive) return;
    var next = state.demoTourStep + delta;
    if (next < 0) next = 0;
    if (next >= DEMO_TOUR.length) {
      stopDemoTour();
      showToast("8 步演示完成");
      return;
    }
    state.demoTourStep = next;
    state.role = DEMO_TOUR[next].role || state.role;
    navigate(DEMO_TOUR[next].route);
    updateDemoTourShell();
  }

  function updateDemoTourShell() {
    var launcher = $("#demoTourLauncher");
    var bar = $("#demoTourBar");
    if (!launcher || !bar) return;
    launcher.style.display = state.demoTourActive ? "none" : "flex";
    bar.classList.toggle("show", state.demoTourActive);
    if (!state.demoTourActive) return;

    var step = DEMO_TOUR[state.demoTourStep];
    $("#demoTourKicker").textContent = step.kicker;
    $("#demoTourTitle").textContent = step.title + " · " + step.role;
    $("#demoTourDesc").textContent = step.desc;
    $("#demoTourPrev").disabled = state.demoTourStep === 0;
    $("#demoTourNext").textContent = state.demoTourStep === DEMO_TOUR.length - 1 ? "完成演示" : "下一步";
    $("#demoTourProgress").innerHTML = DEMO_TOUR.map(function (_, i) {
      return '<i class="' + (i <= state.demoTourStep ? 'active' : '') + '"></i>';
    }).join("");
  }

  function renderDashboard() {
    var scenarioOrder = {
      hospital_attack: ["a1","a2","a3","a5","a6","a4","a7"],
      doctor_breakthrough: ["a4","a6","a2","a1","a5","a3","a7"],
      coaching_recovery: ["a7","a3","a1","a2","a4","a6","a5"]
    };
    var order = scenarioOrder[state.demoScenario] || scenarioOrder.hospital_attack;
    var all = data.actions.slice().sort(function (a, b) {
      return order.indexOf(a.id) - order.indexOf(b.id);
    });
    var filtered = state.actionFilter === "all" ? all : all.filter(function (a) { return getActionStatus(a) === state.actionFilter; });
    var done = all.filter(function (a) { return getActionStatus(a) === "done"; }).length;
    var doing = all.filter(function (a) { return getActionStatus(a) === "doing"; }).length;
    var filters = [
      ["all", "全部 " + all.length],
      ["todo", "待执行"],
      ["doing", "进行中"],
      ["done", "已完成"]
    ].map(function (f) {
      return '<button class="filter-chip ' + (state.actionFilter === f[0] ? "active" : "") + '" data-filter="' + f[0] + '">' + f[1] + '</button>';
    }).join("");

    var insightPrimary = "";
    var insightSecondary = "";
    if (state.demoScenario === "doctor_breakthrough") {
      insightPrimary = '<div class="insight-card"><div class="insight-head"><strong>患者识别是当前最大增长杠杆</strong><span class="insight-tag">Hospital Agent</span></div><p>滨江中心患者量并不缺, 真正的 GAP 是目标患者识别标准不一致. 下一步不是加覆盖, 而是把病例共识会锁定下来.</p><button class="tiny-btn primary" data-route-jump="hospital">查看医院机会</button></div>';
      insightSecondary = '<div class="insight-card"><div class="insight-head"><strong>医生兴趣已经出现, 现在要推进承诺</strong><span class="insight-tag">Doctor Agent</span></div><p>王静主任已经认可流程问题. 当前最佳动作是确认病例会时间、参与医生和 3 个典型病例.</p><button class="tiny-btn" data-route-jump="doctor">查看医生 NBA</button></div>';
    } else if (state.demoScenario === "coaching_recovery") {
      insightPrimary = '<div class="insight-card"><div class="insight-head"><strong>连续 3 次拜访没有形成下一步承诺</strong><span class="insight-tag">Coaching</span></div><p>刘晨的问题不在内容质量, 而在结束阶段没有把“医生觉得不错”推进成具体病例、时间或行为承诺.</p><button class="tiny-btn primary" data-route-jump="coaching">进入拜访辅导</button></div>';
      insightSecondary = '<div class="insight-card"><div class="insight-head"><strong>本周只修一个动作</strong><span class="insight-tag">Manager Focus</span></div><p>把“好的, 下次再来”替换成一个明确请求: 下次住院组讨论中共同判断 1 例边界患者, 并约定具体时间.</p><button class="tiny-btn" data-route-jump="coaching">查看关键句替换</button></div>';
    } else {
      insightPrimary = '<div class="insight-card"><div class="insight-head"><strong>医院机会变化</strong><span class="insight-tag">Hospital Agent</span></div><p>华东附一的机会不在增加拜访频次, 而在周三 MDT 的方案选择节点. 建议把资源从泛化覆盖切换到场景证据.</p><button class="tiny-btn primary" data-route-jump="hospital">查看医院作战</button></div>';
      insightSecondary = '<div class="insight-card"><div class="insight-head"><strong>需要立即辅导</strong><span class="insight-tag">Coaching</span></div><p>张蕾本次拜访探询质量仅 54 分. 下一次拜访前建议完成一次经理角色演练, 替换开场与关键问题.</p><button class="tiny-btn" data-route-jump="teamcoaching">查看团队辅导</button></div>';
    }

    var insights =
      insightPrimary +
      insightSecondary +
      '<div class="flow-strip">' +
        '<div class="flow-step active"><b>Context</b><span>医院 / 医生</span></div>' +
        '<div class="flow-step active"><b>Decision</b><span>优先级判断</span></div>' +
        '<div class="flow-step active"><b>NBA</b><span>下一步行动</span></div>' +
        '<div class="flow-step"><b>Action</b><span>执行与反馈</span></div>' +
        '<div class="flow-step"><b>Outcome</b><span>结果信号</span></div>' +
        '<div class="flow-step"><b>Rule</b><span>组织学习</span></div>' +
      '</div>';

    return '<div class="hero-row">' +
      '<div class="hero-copy"><span class="eyebrow">SYSTEM OF ACTION</span><h2>' + esc(state.role) + ', 今天先做这几件事</h2><p>' + esc(roleGreeting()) + '</p></div>' +
      '<div class="hero-meta"><span class="date-chip">2026.09.21 · 周一</span><span class="soft-chip">Pilot 第 4 周</span></div>' +
    '</div>' +
    renderScenarioDeck() +
    '<div class="mb-16">' + renderAgentHandoff() + '</div>' +
    '<div class="metric-grid">' +
      metric("本周重点医院", "12", "3 家需要经理介入", "+2", "院") +
      metric("高优先 NBA", "18", "6 个尚未执行", "+5", "A") +
      metric("NBA 采纳率", "76%", "较上周", "+8%", "%") +
      metric("需辅导拜访", "3", "其中 2 个高优先", "需处理", "辅") +
    '</div>' +
    '<div class="grid-2">' +
      panel("我的下一步行动", "不是待办清单, 而是 Agent 判断后的优先动作",
        '<div class="filter-bar"><div class="filter-group">' + filters + '</div><button class="btn soft" id="generateNba">AI 重新排序</button></div>' +
        actionRows(filtered)
      ) +
      '<div class="stack">' +
        panel("AI 今日洞察", "从变化中提取真正需要行动的信号", insights) +
        panel("8 周 Pilot 健康度", "Market Proof + Product Proof",
          '<div class="dimension-row"><span>周活跃率</span><div class="bar"><i style="width:84%"></i></div><b>84%</b></div>' +
          '<div class="dimension-row"><span>NBA 采纳</span><div class="bar"><i style="width:76%"></i></div><b>76%</b></div>' +
          '<div class="dimension-row"><span>行动完成</span><div class="bar"><i style="width:' + Math.max(38, Math.round((done + doing * .4) / all.length * 100)) + '%"></i></div><b>' + done + '/' + all.length + '</b></div>' +
          '<div class="dimension-row"><span>Review 覆盖</span><div class="bar"><i style="width:71%"></i></div><b>71%</b></div>'
        ) +
      '</div>' +
    '</div>';
  }

  function renderHospital() {
    var h = data.hospitals.find(function (x) { return x.id === state.selectedHospital; }) || data.hospitals[0];
    var options = data.hospitals.map(function (x) {
      return '<option value="' + x.id + '"' + (x.id === h.id ? " selected" : "") + '>' + esc(x.name) + ' · ' + esc(x.department) + '</option>';
    }).join("");

    var bubbles = [
      { x: 69, y: 19, size: 52, label: "证据缺口", bg: "#5b7bdd" },
      { x: 58, y: 34, size: 42, label: "患者识别", bg: "#6b8bea" },
      { x: 76, y: 48, size: 36, label: "资源协同", bg: "#53b7a0" },
      { x: 34, y: 28, size: 34, label: "准入", bg: "#94a1b8" },
      { x: 42, y: 68, size: 30, label: "覆盖", bg: "#b0b9c8" }
    ].map(function (b) {
      return '<button class="bubble" style="left:' + b.x + '%;top:' + b.y + '%;width:' + b.size + 'px;height:' + b.size + 'px;background:' + b.bg + '" title="' + esc(b.label) + '">' + esc(b.label) + '</button>';
    }).join("");

    var levers = h.levers.map(function (l, i) {
      return '<div class="lever-card ' + (i === 0 ? "selected" : "") + '" data-lever="' + i + '">' +
        '<div class="lever-top"><div style="display:flex;gap:9px"><div class="lever-rank">' + l.rank + '</div><div><h4>' + esc(l.title) + '</h4><p>' + esc(l.detail) + '</p></div></div><div class="score">' + l.score + '</div></div>' +
      '</div>';
    }).join("");

    var top = h.levers[0];
    var nba =
      '<div class="nba-box"><div class="nba-head"><strong>AI 推荐的医院下一步行动</strong><span class="nba-badge">TOP NBA</span></div>' +
      '<div class="nba-grid">' +
        '<div class="nba-item"><b>WHO</b><span>' + esc(top.who) + '</span></div>' +
        '<div class="nba-item"><b>WHEN</b><span>' + esc(top.when) + '</span></div>' +
        '<div class="nba-item"><b>WHAT</b><span>' + esc(top.what) + '</span></div>' +
        '<div class="nba-item"><b>WHY</b><span>' + esc(top.why) + '</span></div>' +
        '<div class="nba-item"><b>SUCCESS</b><span>' + esc(top.success) + '</span></div>' +
      '</div>' +
      '<div class="flex-between mt-12"><span class="small-note">证据: 患者旅程 + 医院生态 + 历史互动 + 当前资源约束</span><button class="btn primary" data-ai-generate="hospital">AI 生成本周行动计划</button></div></div>';

    var timeline =
      '<div class="timeline">' +
      '<div class="timeline-item done"><span class="timeline-dot"></span><b>作战前 · 机会诊断完成</b><span>患者流、患者旅程、医院生态已更新.</span></div>' +
      '<div class="timeline-item done"><span class="timeline-dot"></span><b>优先级 · Top 3 杠杆点已确认</b><span>影响大小 × 可改变程度 × 紧迫度 × 资源匹配.</span></div>' +
      '<div class="timeline-item"><span class="timeline-dot"></span><b>本周执行 · 关键医生与资源动作</b><span>当前 4 / 6 个动作已启动.</span></div>' +
      '<div class="timeline-item"><span class="timeline-dot"></span><b>周度 Review · Outcome 回流</b><span>周五 16:30, 更新有效/无效判断.</span></div>' +
      '</div>';

    return '<div class="page-banner"><div><span class="banner-kicker">HOSPITAL AGENT</span><h2>医院下一步行动导航</h2><p>从患者流、患者旅程与医院生态中筛出 Top 1–3 杠杆点, 让地区经理不再平均用力.</p></div><div class="banner-side"><strong>' + h.opportunity + '</strong><span>机会指数 / 100</span></div></div>' +
      '<div class="filter-bar"><select class="select-box" id="hospitalSelect">' + options + '</select><div class="filter-group"><span class="soft-chip">' + esc(h.tier) + '</span><span class="date-chip">' + esc(h.product) + '</span><span class="date-chip">本季度</span></div></div>' +
      renderManagementSignal(managementForHospital(h.id), "医院资源") +
      '<div class="metric-grid">' +
        metric("医院机会指数", h.opportunity, "综合业务影响与患者价值", "+6", "机") +
        metric("可改变程度", h.changeability + "%", "当前资源可以直接影响", "+9%", "改") +
        metric("作战进度", h.progress + "%", "本周需完成 2 个关键动作", "", "进") +
        metric("当前阶段", h.stage, "患者价值: " + h.patientValue, "", "阶") +
      '</div>' +
      '<div class="strategy-grid">' +
        panel("机会价值矩阵", "影响大小 × 可干预性",
          '<div class="opportunity-map"><span class="quad-label q1">重点攻坚</span><span class="quad-label q2">长期突破</span><span class="quad-label q3">暂不投入</span><span class="quad-label q4">顺手推进</span><span class="axis-x">可干预性 →</span><span class="axis-y">业务影响 →</span>' + bubbles + '</div>'
        ) +
        panel("Top 1–3 业务杠杆点", "AI 已按影响、可改变、紧迫度与资源匹配排序", '<div class="lever-list">' + levers + '</div>') +
      '</div>' +
      '<div class="mt-16">' + renderPatientFlow(h) + '</div>' +
      '<div class="grid-equal mt-16">' +
        panel("医院 NBA", "谁负责、何时切入、做什么、为什么做、成功信号", nba) +
        panel("作战闭环", "目标: " + h.target, timeline) +
      '</div>' +
      '<div class="grid-equal mt-16"><div>' + renderHospitalEcology(h) + '</div><div>' + renderResourcePlan(h) + '</div></div>';
  }

  function repVisitById(id) {
    return (data.repDay && data.repDay.visits || []).find(function (x) { return x.id === id; }) || (data.repDay && data.repDay.visits && data.repDay.visits[0]);
  }

  function syncRepVisitSelection(visit) {
    if (!visit) return;
    state.repSelectedVisit = visit.id;
    state.selectedDoctor = visit.doctorId;
    state.selectedHospital = visit.hospitalId;
    if (visit.id === "rv1" || visit.id === "rv4") state.selectedVisit = "v2";
    else if (visit.id === "rv2") state.selectedVisit = "v1";
    else if (visit.id === "rv3") state.selectedVisit = "v3";
  }

  function renderRepSchedule() {
    var selected = repVisitById(state.repSelectedVisit);
    var visits = (data.repDay && data.repDay.visits || []).map(function (v) {
      var session = state.liveVisitSessions[v.id];
      var effectiveStatus = session && session.ended ? "done" : v.status;
      var statusText = { done: "已完成", next: "下一场", planned: "待拜访" }[effectiveStatus] || effectiveStatus;
      var statusClass = effectiveStatus === "done" ? "done" : (effectiveStatus === "next" ? "doing" : "todo");
      return '<button class="rep-visit-card ' + (selected && selected.id === v.id ? "active" : "") + '" data-rep-visit="' + v.id + '">' +
        '<div class="rep-time"><strong>' + esc(v.time) + '</strong><span>' + esc(v.type) + '</span></div>' +
        '<div class="rep-visit-main"><div><strong>' + esc(v.doctor) + '</strong><span>' + esc(v.hospital.replace("华东大学附属第一医院","华东附一")) + ' · ' + esc(v.department) + '</span></div><p>' + esc(v.purpose) + '</p></div>' +
        '<div class="rep-visit-state"><span class="status ' + statusClass + '">' + esc(statusText) + '</span><small>' + esc(v.travel) + '</small></div>' +
      '</button>';
    }).join("");
    return '<div class="rep-schedule">' + visits + '</div>';
  }

  function renderRepSelectedVisit() {
    var visit = repVisitById(state.repSelectedVisit);
    if (!visit) return "";
    var doc = data.doctors.find(function (x) { return x.id === visit.doctorId; }) || data.doctors[0];
    var p = doc.preVisit || {};
    var doneMap = state.prepStatus[doc.id] || {};
    var doneCount = Object.keys(doneMap).filter(function (k) { return doneMap[k]; }).length;
    var total = (p.checklist || []).length || 5;
    var ready = doneCount >= Math.max(3,total - 1);
    var evidence = (doc.evidence || []).slice(0,2).map(function (e) {
      return '<div class="rep-mini-evidence"><b>' + esc(e[0]) + '</b><div><strong>' + esc(e[1]) + '</strong><span>' + esc(e[2]) + '</span></div></div>';
    }).join("");
    return '<div class="rep-selected">' +
      '<div class="rep-selected-head"><div><span class="eyebrow">NEXT VISIT · ' + esc(visit.time) + '</span><h2>' + esc(visit.doctor) + ' · ' + esc(visit.department) + '</h2><p>' + esc(visit.hospital) + ' · ' + esc(visit.type) + '</p></div><div class="visit-readiness ' + (ready ? "ready" : "") + '"><strong>' + doneCount + '/' + total + '</strong><span>准备完成</span></div></div>' +
      '<div class="rep-objective"><span>THIS VISIT OBJECTIVE</span><strong>' + esc(p.objective || visit.purpose) + '</strong><p>成功信号: ' + esc(visit.success) + '</p></div>' +
      '<div class="rep-work-grid"><div class="rep-work-card"><span>WHY NOW</span><strong>' + esc(doc.trigger) + '</strong></div><div class="rep-work-card"><span>当前 GAP</span><strong>' + esc(doc.gap) + '</strong></div><div class="rep-work-card"><span>开场策略</span><strong>' + esc(p.opening || "") + '</strong></div><div class="rep-work-card"><span>结束承诺</span><strong>' + esc(p.commitment || "") + '</strong></div></div>' +
      '<div class="rep-evidence-row"><div><span class="eyebrow">TOP EVIDENCE</span>' + evidence + '</div></div>' +
      '<div class="rep-actions"><button class="btn ghost" data-rep-open-doctor>打开 Doctor Agent</button><button class="btn soft" data-rep-prepare>继续拜访准备</button><button class="btn primary" data-rep-start-visit>进入拜访中模式</button></div>' +
    '</div>';
  }

  function renderRepQuickTasks() {
    var items = (data.repDay && data.repDay.quickTasks || []).map(function (t) {
      var done = !!state.repQuickTasks[t.id];
      return '<button class="rep-task ' + (done ? "done" : "") + '" data-rep-task="' + t.id + '"><span class="prep-box">' + (done ? "✓" : "") + '</span><div><strong>' + esc(t.title) + '</strong><small>' + esc(t.source) + '</small></div></button>';
    }).join("");
    return panel("今天别漏掉", "Agent 自动收敛出的 3 个小动作", '<div class="rep-task-list">' + items + '</div>');
  }

  function renderRep() {
    var selected = repVisitById(state.repSelectedVisit);
    if (!selected && data.repDay && data.repDay.visits && data.repDay.visits[0]) {
      selected = data.repDay.visits[0];
      syncRepVisitSelection(selected);
    }
    var completed = (data.repDay.visits || []).filter(function (v) {
      return v.status === "done" || (state.liveVisitSessions[v.id] && state.liveVisitSessions[v.id].ended);
    }).length;
    return '<div class="page-banner rep-banner"><div><span class="banner-kicker">REPRESENTATIVE WORKSPACE</span><h2>今天不是“拜访 4 个医生”, 而是推进 4 个明确动作</h2><p>' + esc(data.repDay.summary) + '</p></div><div class="banner-side"><strong>' + completed + '/4</strong><span>今日互动已完成</span></div></div>' +
      '<div class="metric-grid">' +
        metric("今日客户互动","4","2 次高优先","", "访") +
        metric("需要明确承诺","2","周敏 MDT / 王静病例会","重点","诺") +
        metric("拜访前准备", selected ? ((Object.keys(state.prepStatus[selected.doctorId] || {}).filter(function(k){return state.prepStatus[selected.doctorId][k];}).length) + "/5") : "0/5","下一场拜访","", "备") +
        metric("经理辅导提醒","1","最近一次推进不足","需处理","辅") +
      '</div>' +
      '<div class="rep-layout">' +
        '<div class="stack">' +
          panel("今日路线", "按下一步行动优先级排列, 不按客户名单平均覆盖", renderRepSchedule()) +
          renderRepQuickTasks() +
        '</div>' +
        '<div>' + renderRepSelectedVisit() + '</div>' +
      '</div>';
  }

  function liveVisitSession() {
    var visit = repVisitById(state.repSelectedVisit);
    if (!visit) return null;
    if (!state.liveVisitSessions[visit.id]) {
      state.liveVisitSessions[visit.id] = { objection: "", commitment: "", notes: [], started: false, ended: false };
    }
    return state.liveVisitSessions[visit.id];
  }

  function renderLiveEvidence(doc) {
    return '<div class="live-evidence-list">' + (doc.evidence || []).map(function (e,i) {
      return '<button class="live-evidence-card" data-live-evidence="' + i + '"><div class="evidence-icon">' + esc(e[0]) + '</div><div><strong>' + esc(e[1]) + '</strong><span>' + esc(e[2]) + '</span></div><em>调用</em></button>';
    }).join("") + '</div>';
  }

  function renderLiveObjections(doc, session) {
    var objections = (doc.preVisit && doc.preVisit.objections || []).concat(["我现在没有时间看这么多资料","我们目前的方案已经比较稳定"]);
    return '<div class="live-objection-grid">' + objections.map(function (o,i) {
      return '<button class="live-objection ' + (session.objection === o ? "active" : "") + '" data-live-objection="' + i + '" data-objection-text="' + esc(o) + '"><span>医生可能说</span><strong>' + esc(o) + '</strong><p>' + esc(i === 0 ? "先确认具体决策标准, 再只调用与标准直接相关的一条证据." : "先认可当前做法, 再用一个真实病例讨论是否存在边界患者.") + '</p></button>';
    }).join("") + '</div>';
  }

  function renderLiveCommitment(doc, visit, session) {
    var options = [
      visit.success,
      doc.preVisit && doc.preVisit.commitment,
      "确认下一次沟通的具体日期与病例",
      "需要经理 / 医学支持后再推进"
    ].filter(Boolean);
    return '<div class="live-commitment"><span class="eyebrow">NEXT COMMITMENT</span><h3>这次拜访结束前, 必须明确下一步是什么</h3><div class="commitment-options">' + options.map(function (o,i) {
      return '<button class="commitment-option ' + (session.commitment === o ? "active" : "") + '" data-live-commitment="' + i + '" data-commitment-text="' + esc(o) + '"><span>' + (session.commitment === o ? "✓" : "") + '</span><strong>' + esc(o) + '</strong></button>';
    }).join("") + '</div><div class="live-note"><label>客户原话 / 现场信号</label><textarea id="liveVisitNote" placeholder="例如: 周主任表示周三 MDT 可以拿一例患者一起讨论..."></textarea></div></div>';
  }

  function renderVisitLive() {
    var visit = repVisitById(state.repSelectedVisit);
    if (!visit) return '<div class="empty-state"><strong>没有选中的拜访</strong></div>';
    var doc = data.doctors.find(function (x) { return x.id === visit.doctorId; }) || data.doctors[0];
    var session = liveVisitSession();
    var p = doc.preVisit || {};
    var tabs = [["evidence","证据"],["objection","异议"],["commitment","承诺"]].map(function(t){
      return '<button class="live-tab ' + (state.liveVisitTab===t[0]?"active":"") + '" data-live-tab="' + t[0] + '">' + t[1] + '</button>';
    }).join("");
    var body = state.liveVisitTab === "objection" ? renderLiveObjections(doc,session) : (state.liveVisitTab === "commitment" ? renderLiveCommitment(doc,visit,session) : renderLiveEvidence(doc));
    return '<div class="visit-live-shell">' +
      '<div class="visit-live-top"><div><span class="live-dot"></span><span>VISIT MODE</span><strong>' + esc(visit.doctor) + ' · ' + esc(visit.hospital.replace("华东大学附属第一医院","华东附一")) + '</strong></div><div class="live-top-actions"><button class="btn ghost" data-live-back>退出拜访中</button><button class="btn primary" data-live-finish ' + (!session.commitment ? 'disabled' : '') + '>形成承诺并结束</button></div></div>' +
      '<div class="visit-live-context"><div><span>本次唯一目标</span><strong>' + esc(p.objective || visit.purpose) + '</strong></div><div><span>成功信号</span><strong>' + esc(visit.success) + '</strong></div></div>' +
      '<div class="visit-live-grid"><aside class="live-cues"><span class="eyebrow">LIVE CUES</span><h3>现场只看 3 件事</h3><div class="live-cue"><b>1</b><div><strong>先问</strong><span>' + esc((p.questions||[])[0]||"确认医生当前关注") + '</span></div></div><div class="live-cue"><b>2</b><div><strong>再证据</strong><span>只调用与医生回答直接相关的证据.</span></div></div><div class="live-cue"><b>3</b><div><strong>最后承诺</strong><span>' + esc(p.commitment||visit.success) + '</span></div></div><div class="live-compliance"><span>合规提醒</span><p>仅使用已审核材料. 超出批准边界的问题转医学团队, 不现场自由扩展.</p></div></aside><main class="live-main"><div class="live-tabs">' + tabs + '</div><div class="live-body">' + body + '</div></main></div>' +
    '</div>';
  }

  function startLiveVisitForDoctor() {
    var candidates = (data.repDay && data.repDay.visits || []).filter(function (v) {
      return v.doctorId === state.selectedDoctor && !(state.liveVisitSessions[v.id] && state.liveVisitSessions[v.id].ended);
    });
    var visit = candidates[0] || (data.repDay && data.repDay.visits || []).find(function (v) { return v.doctorId === state.selectedDoctor; });
    if (!visit) { showToast("今日路线中没有这个医生的拜访"); return; }
    syncRepVisitSelection(visit);
    var session = liveVisitSession();
    if (session) {
      session.started = true;
      session.startedAt = new Date().toISOString();
    }
    state.liveVisitTab = "evidence";
    state.route = "visitlive";
    state.role = "医药代表";
    saveState();
    render();
  }

  function finishLiveVisit() {
    var visit = repVisitById(state.repSelectedVisit);
    var session = liveVisitSession();
    if (!visit || !session || !session.commitment) { showToast("请先形成一个明确客户承诺"); return; }
    var note = $("#liveVisitNote");
    if (note && note.value.trim()) session.notes.push(note.value.trim());
    session.ended = true;
    session.endedAt = new Date().toISOString();
    session.successSignal = session.commitment;
    saveState();
    if (visit.id === "rv2") state.selectedVisit = "v1";
    else if (visit.id === "rv3") state.selectedVisit = "v3";
    else state.selectedVisit = "v2";
    state.route = "coaching";
    state.role = "地区经理";
    saveState();
    render();
    showToast("拜访已结束, 已进入语音复盘 / 辅导流程");
  }

  function renderDoctor() {
    var doc = data.doctors.find(function (x) { return x.id === state.selectedDoctor; }) || data.doctors[0];
    var list = data.doctors.map(function (x) {
      return '<div class="doctor-item ' + (x.id === doc.id ? "active" : "") + '" data-doctor-id="' + x.id + '">' +
        '<div class="doctor-avatar">' + esc(x.name.slice(0, 1)) + '</div><div><strong>' + esc(x.name) + '</strong><span>' + esc(x.hospital.replace("华东大学附属第一医院", "华东附一")) + ' · ' + esc(x.department) + '</span></div><div class="doctor-score">' + x.nextScore + '</div>' +
      '</div>';
    }).join("");

    var tags = doc.tags.map(function (t) { return '<span class="profile-tag">' + esc(t) + '</span>'; }).join("");
    var script = doc.script.map(function (x) {
      return '<div class="script-line"><b>' + esc(x[0]) + '</b><span>' + esc(x[1]) + '</span></div>';
    }).join("");
    var evidence = doc.evidence.map(function (e, index) {
      return '<button class="evidence-item evidence-button" data-evidence-index="' + index + '"><div class="evidence-icon">' + esc(e[0]) + '</div><div><strong>' + esc(e[1]) + '</strong><span>' + esc(e[2]) + '</span></div><div class="evidence-trace">可追溯 →</div></button>';
    }).join("");

    return '<div class="page-banner"><div><span class="banner-kicker">DOCTOR AGENT</span><h2>医生下一步行动导航</h2><p>不是生成一段话术, 而是结合医院目标、医生画像、关键时机和证据, 判断“这一次最应该推进什么”.</p></div><div class="banner-side"><strong>' + doc.nextScore + '</strong><span>行动优先分 / 100</span></div></div>' +
      renderManagementSignal(managementForDoctor(doc), "医生推进") +
      '<div class="doctor-layout">' +
        panel("重点医生", "按下一步行动优先级排序", '<div class="doctor-list">' + list + '</div>') +
        '<div class="stack">' +
          panel(doc.name + ' · ' + doc.title, doc.hospital + ' · ' + doc.department,
            '<div class="profile-head"><div class="profile-name"><h2>' + esc(doc.focus) + '</h2><p>当前态度: ' + esc(doc.support) + ' · 阶段: ' + esc(doc.stage) + '</p><div class="profile-tags">' + tags + '</div></div><button class="btn soft" data-ai-generate="doctor">AI 生成拜访 NBA</button></div>' +
            '<div class="signal-grid"><div class="signal-card"><b>关键触发场景</b><strong>NOW</strong><span>' + esc(doc.trigger) + '</span></div><div class="signal-card"><b>当前 GAP</b><strong>1 个</strong><span>' + esc(doc.gap) + '</span></div><div class="signal-card"><b>目标行为</b><strong>推进</strong><span>' + esc(doc.targetBehavior) + '</span></div>'
          ) +
          '<div class="mt-16">' + renderPreVisitWorkspace(doc) + '</div>' +
          '<div class="grid-equal">' +
            panel("下一次拜访脚本", "围绕 WHY → WHEN → WHAT → HOW → NEXT", '<div class="script-box"><span class="label">AI RECOMMENDED TALK TRACK</span>' + script + '</div>') +
            panel("核心证据包", "来源可追溯, 医学审核通过", '<div class="evidence-list">' + evidence + '</div><button class="btn primary full mt-12" data-doctor-live>进入拜访中模式</button>') +
          '</div>' +
          '<div class="mt-16">' + renderDoctorJourney(doc) + '</div>' +
        '</div>' +
      '</div>';
  }

  function openEvidenceTrace(index) {
    var doc = data.doctors.find(function (x) { return x.id === state.selectedDoctor; }) || data.doctors[0];
    var e = doc.evidence && doc.evidence[index];
    if (!e) return;
    var body =
      '<div class="drawer-section"><h4>证据卡</h4><div class="drawer-callout"><strong>' + esc(e[1]) + '</strong><p>' + esc(e[2]) + '</p></div></div>' +
      '<div class="drawer-section"><h4>证据追溯</h4><div class="drawer-meta"><div class="meta-cell"><b>TYPE</b><span>' + esc(e[0]) + '</span></div><div class="meta-cell"><b>STATUS</b><span>医学审核通过</span></div><div class="meta-cell"><b>VERSION</b><span>2026.09</span></div><div class="meta-cell"><b>SCOPE</b><span>批准适应症内专业沟通</span></div></div></div>' +
      '<div class="drawer-section"><h4>FACT / INFERENCE</h4><div class="drawer-success"><span>FACT</span><span>该证据作为专业沟通依据时必须保留原始来源、版本和适用边界. Agent 生成的话术属于 INFERENCE, 不能改变证据原意.</span></div></div>' +
      '<div class="drawer-section"><h4>当前医生为什么看到它</h4><p class="small-note">' + esc(doc.name) + ' 当前关注 “' + esc(doc.focus) + '”, 系统仅把与当前触发场景直接相关的已审核证据排到前面.</p></div>';
    openDrawer(e[1], body, null);
  }

  function teamRepRuntime(rep) {
    var liveLinked = rep.id === "rep1" || rep.id === "rep2" || rep.id === "rep3";
    var roleplay = liveLinked ? coachingRoleplaySession(rep.visitId) : null;
    var scenario = liveLinked ? roleplayScenario(data.visits.find(function(v){ return v.id === rep.visitId; }) || data.visits[0]) : null;
    var scorecard = liveLinked ? roleplayScorecard(roleplay, scenario) : null;
    var practiceDone = liveLinked ? !!roleplay.completed : (rep.practice === "已通过");
    var practiceScore = liveLinked && practiceDone ? scorecard.overall : Number(rep.practiceScore || 0);
    var score = practiceDone && practiceScore
      ? Math.max(Number(rep.score || 0), Math.round((Number(rep.score || 0) + practiceScore) / 2))
      : Number(rep.score || 0);
    var priority = Number(rep.priority || 0);

    if (practiceDone) priority = Math.max(35, priority - 20);
    if (state.coachingAgendaStatus && state.coachingAgendaStatus[rep.id]) priority = Math.max(30, priority - 18);
    if (score < 65) priority += 5;

    return {
      score: score,
      practiceDone: practiceDone,
      practiceScore: practiceScore,
      priority: Math.min(100,priority),
      conversationRounds: liveLinked ? (roleplay.history || []).length : (rep.practice === "已完成" ? 4 : 0),
      roleplayCompleted: practiceDone
    };
  }

  function teamRepDimensions(rep) {
    var visit = data.visits.find(function(v){ return v.id === rep.visitId; }) || data.visits[0];
    var base = {};
    (visit.dimensions || []).forEach(function(d){ base[d[0]] = Number(d[1] || 0); });
    var liveLinked = rep.id === "rep1" || rep.id === "rep2" || rep.id === "rep3";
    var map = {};
    if (liveLinked) {
      var roleplay = coachingRoleplaySession(rep.visitId);
      var scorecard = roleplayScorecard(roleplay, roleplayScenario(visit));
      scorecard.scores.forEach(function(x){ if (x.score) map[x.dimension] = x.score; });
    }
    return {
      "目标清晰": base["目标清晰"] || 70,
      "探询质量": map["探询质量"] || base["探询质量"] || 70,
      "证据匹配": map["证据匹配"] || base["价值呈现"] || 70,
      "异议处理": map["异议处理"] || base["异议处理"] || 70,
      "推进承诺": map["推进承诺"] || base["下一步推进"] || 70
    };
  }

  function teamCoachingReps() {
    var reps = (data.teamCoaching && data.teamCoaching.reps || []).map(function(rep){
      return Object.assign({},rep,{ runtime: teamRepRuntime(rep) });
    });
    if (state.teamCoachingFilter === "critical") {
      reps = reps.filter(function(rep){ return rep.runtime.priority >= 85; });
    } else if (state.teamCoachingFilter === "practice") {
      reps = reps.filter(function(rep){ return !rep.runtime.practiceDone; });
    } else if (state.teamCoachingFilter === "improving") {
      reps = reps.filter(function(rep){ return Number(rep.score) > Number(rep.previousScore); });
    }
    return reps.sort(function(a,b){ return b.runtime.priority - a.runtime.priority; });
  }

  function openTeamRepCoaching(repId, focusPractice) {
    var rep = (data.teamCoaching.reps || []).find(function(r){ return r.id === repId; });
    if (!rep) return;
    state.selectedVisit = rep.visitId;
    state.coachingTab = focusPractice ? "diagnosis" : "review";
    state.route = "coaching";
    state.role = "地区经理";
    if (focusPractice) {
      var review = coachingReviewSession(rep.visitId);
      if (!review.generated) {
        review.generated = true;
        var visit = data.visits.find(function(v){return v.id === rep.visitId;}) || data.visits[0];
        state.audioReviews[rep.visitId] = {
          ok:true,
          duration:"08:42",
          transcript:[],
          diagnosis:{
            topIssue:visit.issue,
            score:visit.score,
            evidence:visit.summary,
            nextAction:visit.nextScript
          }
        };
      }
      review.issueAccepted = true;
    }
    saveState();
    render();
    setTimeout(function(){
      var target = focusPractice ? $(".multi-roleplay-head") : $(".page-banner");
      if (target) target.scrollIntoView({behavior:"smooth",block:"start"});
    },60);
  }

  function renderTeamTrend(rep) {
    var runtime = rep.runtime || teamRepRuntime(rep);
    var values = (rep.trend || []).slice();
    if (runtime.practiceDone && values.length) values[values.length - 1] = runtime.score;
    return '<div class="team-spark">' + values.map(function(v,i){
      return '<i style="height:' + Math.max(12,Number(v)) + '%" title="' + esc(v) + '"></i>';
    }).join("") + '</div>';
  }

  function rankedTeamReps() {
    return (data.teamCoaching && data.teamCoaching.reps || [])
      .map(function(rep){ return Object.assign({},rep,{runtime:teamRepRuntime(rep)}); })
      .sort(function(a,b){ return b.runtime.priority - a.runtime.priority; });
  }

  function teamAgendaCandidates() {
    var ranked = rankedTeamReps();
    var valid = (state.coachingAgendaSelection || []).filter(function(id){
      return ranked.some(function(rep){ return rep.id === id; });
    });

    if (valid.length < 2) {
      valid = ranked.slice(0,2).map(function(rep){ return rep.id; });
      state.coachingAgendaSelection = valid.slice();
    }

    return valid.map(function(id){
      return ranked.find(function(rep){ return rep.id === id; });
    }).filter(Boolean);
  }

  function resetCoachingAgenda() {
    var completedIds = Object.keys(state.coachingAgendaStatus || {}).filter(function(id){
      return !!state.coachingAgendaStatus[id];
    });
    var ranked = rankedTeamReps().filter(function(rep){
      return completedIds.indexOf(rep.id) < 0;
    });
    if (ranked.length < 2) ranked = rankedTeamReps();

    state.coachingAgendaSelection = ranked.slice(0,2).map(function(rep){ return rep.id; });
    state.coachingAgendaStatus = {};
    saveState();
    render();
    showToast("已重新生成下一轮 30 分钟 Coaching Agenda");
  }

  function coachingAgendaItem(rep, index) {
    var visit = data.visits.find(function(v){ return v.id === rep.visitId; }) || data.visits[0];
    var rt = rep.runtime || teamRepRuntime(rep);
    var done = !!state.coachingAgendaStatus[rep.id];
    var focus = rep.issue === "可复制经验" ? "复制成功打法" : rep.issue;
    var practice = rt.practiceDone ? "复盘已通过陪练证据" : "进入 4 轮 AI 陪练";
    return '<article class="agenda-item ' + (done ? "done" : "") + '">' +
      '<div class="agenda-time"><strong>' + (index === 0 ? "00–15" : "15–30") + '</strong><span>分钟</span></div>' +
      '<div class="agenda-main"><div class="agenda-head"><div><span>COACHING #' + (index+1) + '</span><strong>' + esc(rep.name) + ' · ' + esc(rep.territory) + '</strong></div><span class="status ' + (rt.priority>=90?"risk":"doing") + '">优先 ' + rt.priority + '</span></div>' +
      '<div class="agenda-focus"><span>本次只练</span><strong>' + esc(focus) + '</strong><p>' + esc(rep.next) + '</p></div>' +
      '<div class="agenda-check"><div><span>经理检查证据</span><strong>' + esc(practice) + '</strong></div><div><span>成功信号</span><strong>' + esc(visit.nextScript) + '</strong></div></div>' +
      '<div class="agenda-actions"><button class="btn ghost" data-agenda-open="' + rep.id + '">进入辅导</button><button class="btn ' + (done?"soft":"primary") + '" data-agenda-done="' + rep.id + '">' + (done?"✓ 本周已辅导":"标记本周已辅导") + '</button></div>' +
      '</div>' +
    '</article>';
  }

  function renderWeeklyAgenda() {
    var top = teamAgendaCandidates();
    var done = top.filter(function(rep){ return !!state.coachingAgendaStatus[rep.id]; }).length;
    var next = rankedTeamReps().filter(function(rep){
      return top.every(function(item){ return item.id !== rep.id; });
    })[0];

    return panel("本周 30 分钟 Coaching Agenda", "本周固定 2 人, 每人 15 分钟. 完成后团队优先队列仍会动态重排",
      '<div class="agenda-summary"><div><span>本周目标</span><strong>2 人 × 15 分钟</strong><p>每个人只练一个最影响结果的行为.</p></div><div><span>已完成</span><strong>' + done + ' / 2</strong><p>' + (done===2?"本周核心辅导闭环已完成":"完成后团队优先队列会重新计算") + '</p></div></div>' +
      '<div class="agenda-list">' + top.map(coachingAgendaItem).join("") + '</div>' +
      '<div class="agenda-footer"><div><span>下一候选</span><strong>' + (next ? esc(next.name + " · " + next.issue + " · 优先 " + next.runtime.priority) : "暂无") + '</strong></div><button class="btn soft" data-reset-agenda>重新生成下一轮 Agenda</button></div>'
    );
  }

  function teamTrendStats() {
    var reps = (data.teamCoaching && data.teamCoaching.reps || []).map(function(rep){
      return Object.assign({},rep,{runtime:teamRepRuntime(rep)});
    });
    var previous = Math.round(reps.reduce(function(sum,r){ return sum + Number(r.previousScore||0); },0) / Math.max(1,reps.length));
    var current = Math.round(reps.reduce(function(sum,r){ return sum + Number(r.runtime.score||0); },0) / Math.max(1,reps.length));
    var improving = reps.filter(function(r){ return r.runtime.score > Number(r.previousScore||0); }).length;
    var declining = reps.filter(function(r){ return r.runtime.score < Number(r.previousScore||0); }).length;
    var practice = reps.filter(function(r){ return r.runtime.practiceDone || r.practice === "已通过"; }).length;
    return { previous:previous,current:current,delta:current-previous,improving:improving,declining:declining,practice:practice };
  }

  function renderTeamTrendPanel() {
    var stats = teamTrendStats();
    var reps = (data.teamCoaching.reps || []).map(function(rep){
      var rt = teamRepRuntime(rep);
      var delta = rt.score - Number(rep.previousScore||0);
      return '<div class="weekly-trend-row"><div><strong>' + esc(rep.name) + '</strong><span>' + esc(rep.issue) + '</span></div><div class="weekly-trend-values"><span>' + esc(rep.previousScore) + '</span><em>→</em><strong>' + rt.score + '</strong></div><b class="' + (delta>0?"up":(delta<0?"down":"")) + '">' + (delta>0?"+":"") + delta + '</b></div>';
    }).join("");
    return panel("上周 → 本周团队趋势", "不是看一次培训完成率, 而是看真实拜访行为有没有改善",
      '<div class="team-trend-summary"><div><span>上周均分</span><strong>' + stats.previous + '</strong></div><div><span>本周均分</span><strong>' + stats.current + '</strong></div><div><span>净变化</span><strong class="' + (stats.delta>=0?"good-text":"") + '">' + (stats.delta>0?"+":"") + stats.delta + '</strong></div><div><span>正在改善</span><strong>' + stats.improving + '/5</strong></div></div>' +
      '<div class="weekly-trend-list">' + reps + '</div>'
    );
  }

  function bestTeamPlaybookCandidate() {
    var reps = (data.teamCoaching && data.teamCoaching.reps || []).map(function(rep){
      return Object.assign({},rep,{runtime:teamRepRuntime(rep)});
    }).sort(function(a,b){
      var aScore = a.runtime.score + Number(a.commitmentRate||0) * .2 + Number(a.nbaCompletion||0) * .1;
      var bScore = b.runtime.score + Number(b.commitmentRate||0) * .2 + Number(b.nbaCompletion||0) * .1;
      return bScore-aScore;
    });
    return reps[0] || null;
  }

  function renderTeamPlaybook() {
    var best = bestTeamPlaybookCandidate();
    if (!best) return "";
    var adopted = state.teamPlaybook && state.teamPlaybook.repId === best.id;
    var visit = data.visits.find(function(v){ return v.id === best.visitId; }) || data.visits[0];
    return panel("值得复制的团队打法", "不是只找问题, 还要把高质量拜访沉淀成团队共同打法",
      '<div class="playbook-card"><div class="playbook-origin"><span>CHAMPION PATTERN</span><strong>' + esc(best.name) + ' · ' + esc(best.territory) + '</strong><p>' + esc(best.strength) + '</p></div>' +
      '<div class="playbook-flow"><div><b>CONTEXT</b><span>' + esc(visit.summary) + '</span></div><em>→</em><div><b>ACTION</b><span>' + esc(visit.nextScript) + '</span></div><em>→</em><div><b>OUTCOME</b><span>行为承诺率 ' + esc(best.commitmentRate) + '% · NBA 完成 ' + esc(best.nbaCompletion) + '%</span></div></div>' +
      '<div class="playbook-actions"><div><span>建议复制给</span><strong>本周同类场景代表 3 人</strong></div><button class="btn ' + (adopted?"soft":"primary") + '" data-adopt-playbook="' + best.id + '">' + (adopted?"✓ 已采纳为团队打法":"采纳为本周团队打法") + '</button></div></div>'
    );
  }

  function reviewActionGroup(hospitalId) {
    var ids = hospitalId === "h1" ? ["a1","a2","a3","a7"] : (hospitalId === "h2" ? ["a4","a6"] : ["a5"]);
    return (data.actions || []).filter(function(a){ return ids.indexOf(a.id) >= 0; });
  }

  function reviewActionProgress(hospitalId) {
    var actions = reviewActionGroup(hospitalId);
    var done = actions.filter(function(a){ return getActionStatus(a) === "done"; }).length;
    var doing = actions.filter(function(a){ return getActionStatus(a) === "doing"; }).length;
    var risk = actions.filter(function(a){ return getActionStatus(a) === "risk"; }).length;
    var pct = actions.length ? Math.round((done + doing * .55) / actions.length * 100) : 0;
    return { total:actions.length,done:done,doing:doing,risk:risk,pct:pct };
  }

  function reviewHospitalOutcome(hospital) {
    if (hospital.id === "h1") {
      var rv2 = state.liveVisitSessions.rv2;
      var rv1 = state.liveVisitSessions.rv1;
      if (rv2 && rv2.ended && rv2.commitment) return rv2.commitment;
      if (rv1 && rv1.ended && rv1.commitment) return rv1.commitment;
      return "周敏 MDT 承诺仍在推进, 刘晨结束阶段需继续辅导";
    }
    if (hospital.id === "h2") {
      var rv3 = state.liveVisitSessions.rv3;
      if (rv3 && rv3.ended && rv3.commitment) return rv3.commitment;
      return "病例共识会已有口头意向, 仍需锁定日期与名单";
    }
    return state.managementDecisions.m3 === "stop"
      ? "已停止高成本活动投入, 本周优先补齐关键影响者地图"
      : "决策链完整度不足, 暂无高确定性业务 Outcome";
  }

  function reviewHospitalStatus(hospital) {
    var p = reviewActionProgress(hospital.id);
    if (p.risk > 0) return { label:"需纠偏", cls:"risk" };
    if (p.pct >= 75) return { label:"推进良好", cls:"done" };
    if (p.doing > 0) return { label:"执行中", cls:"doing" };
    return { label:"待推进", cls:"todo" };
  }

  function managerReviewChainStatus() {
    var hospitalPct = Math.round((reviewActionProgress("h1").pct + reviewActionProgress("h2").pct + reviewActionProgress("h3").pct) / 3);
    var actionDone = (data.actions || []).filter(function(a){ return getActionStatus(a) === "done"; }).length;
    var actionActive = (data.actions || []).filter(function(a){ return getActionStatus(a) === "doing"; }).length;
    var agenda = teamAgendaCandidates();
    var coachingDone = agenda.filter(function(rep){ return !!state.coachingAgendaStatus[rep.id]; }).length;
    var outcomeSignals = Object.keys(state.liveVisitSessions || {}).filter(function(id){
      return state.liveVisitSessions[id] && state.liveVisitSessions[id].ended;
    }).length + (state.outcomes || []).length;
    var playbookDone = !!state.teamPlaybook;
    return {
      hospital: hospitalPct,
      action: Math.min(100,Math.round((actionDone + actionActive * .55) / Math.max(1,(data.actions||[]).length) * 100)),
      coaching: Math.round(coachingDone / Math.max(1,agenda.length) * 100),
      outcome: Math.min(100,outcomeSignals * 25),
      learning: playbookDone ? 100 : 40,
      next: state.managerReviewGenerated ? 100 : 0
    };
  }

  function managerReviewPlanItems() {
    var agendaNext = rankedTeamReps().filter(function(rep){
      return !state.coachingAgendaStatus[rep.id];
    })[0];
    return [
      {
        id:"nw1",
        owner:"张蕾",
        route:"doctor",
        title:"锁定周敏周三 MDT 病例讨论",
        reason:"华东附一 Top 1 杠杆仍然是方案选择阶段的场景化证据",
        success:"周二前确认 1 例患者与讨论材料"
      },
      {
        id:"nw2",
        owner: agendaNext ? agendaNext.name : "李明",
        route:"teamcoaching",
        title: agendaNext ? "完成 " + agendaNext.name + " 的 Top 1 行为辅导" : "生成下一轮团队辅导 Agenda",
        reason: agendaNext ? agendaNext.issue + " 仍是当前团队高优先改进行为" : "本周核心辅导已完成",
        success:"完成 15 分钟 Coaching + 经理检查证据"
      },
      {
        id:"nw3",
        owner:"赵倩",
        route:"hospital",
        title:"把滨江病例共识会从口头意向变成日历事件",
        reason:"方向已经获得认可, 下一步必须锁定日期、参与人和 3 个病例",
        success:"日期 + 参与医生 + 3 个病例全部确认"
      },
      {
        id:"nw4",
        owner:"李明",
        route:"hospital",
        title:"海川继续只买信息, 不扩大活动预算",
        reason:"决策链仍是最大未知, 高成本活动不具备确定性",
        success:"关键影响者地图完整度达到 90%"
      },
      {
        id:"nw5",
        owner:"销售卓越",
        route:"learning",
        title: state.teamPlaybook ? "验证本周 Champion Pattern" : "从高质量拜访中选 1 个 Champion Pattern",
        reason: state.teamPlaybook ? "团队打法已被经理采纳, 需要跨 2–3 个同类场景验证" : "组织学习需要从真实 Outcome 而不是培训材料开始",
        success: state.teamPlaybook ? "至少 2 个同类场景出现正向 Outcome" : "形成 1 个可测试的团队打法候选"
      }
    ];
  }

  function generateManagerReviewPlan() {
    state.managerReviewGenerated = true;
    var plan = managerReviewPlanItems();
    plan.forEach(function(item){
      if (state.managerReviewPlan[item.id] == null) state.managerReviewPlan[item.id] = true;
    });
    saveState();
    render();
    showToast("下周行动计划已根据本周 Context 生成");
  }

  function toggleManagerReviewPlan(id) {
    if (!state.managerReviewGenerated) return;
    state.managerReviewPlan[id] = !state.managerReviewPlan[id];
    saveState();
    render();
  }

  function closeManagerReview() {
    if (!state.managerReviewGenerated) {
      showToast("请先生成并确认下周计划");
      return;
    }
    var selected = Object.keys(state.managerReviewPlan || {}).filter(function(id){ return !!state.managerReviewPlan[id]; }).length;
    if (selected < 3) {
      showToast("至少确认 3 个下周行动后才能结束 Review");
      return;
    }
    state.managerReviewClosed = !state.managerReviewClosed;
    saveState();
    render();
    showToast(state.managerReviewClosed ? "本周 Review 已完成并锁定下周重点" : "已重新打开本周 Review");
  }

  function renderManagerReviewHospitalTable() {
    return (data.hospitals || []).map(function(h){
      var progress = reviewActionProgress(h.id);
      var status = reviewHospitalStatus(h);
      var lever = h.levers && h.levers[0];
      return '<tr><td><b>' + esc(h.name.replace("华东大学附属第一医院","华东附一")) + '</b><span>' + esc(h.tier) + '</span></td>' +
        '<td><strong>' + esc(h.target) + '</strong></td>' +
        '<td><div class="review-progress"><div class="bar"><i style="width:' + progress.pct + '%"></i></div><b>' + progress.pct + '%</b></div><small>' + progress.done + ' 完成 · ' + progress.doing + ' 执行中</small></td>' +
        '<td><span class="status ' + status.cls + '">' + status.label + '</span></td>' +
        '<td><p>' + esc(reviewHospitalOutcome(h)) + '</p></td>' +
        '<td><button class="tiny-btn" data-review-route="hospital" data-review-hospital="' + h.id + '">查看</button></td></tr>';
    }).join("");
  }

  function renderManagerReviewChain() {
    var s = managerReviewChainStatus();
    var steps = [
      ["医院目标",s.hospital,"hospital"],
      ["代表 Action",s.action,"dashboard"],
      ["Coaching",s.coaching,"teamcoaching"],
      ["Outcome",s.outcome,"coaching"],
      ["Champion",s.learning,"learning"],
      ["下周计划",s.next,"managerreview"]
    ];
    return '<div class="weekly-review-chain">' + steps.map(function(step,i){
      var cls = step[1] >= 90 ? "done" : (step[1] > 0 ? "active" : "");
      return '<button class="weekly-review-step ' + cls + '" data-review-route="' + step[2] + '"><span>0' + (i+1) + '</span><strong>' + esc(step[0]) + '</strong><div class="bar"><i style="width:' + step[1] + '%"></i></div><b>' + step[1] + '%</b></button>';
    }).join('<div class="weekly-review-arrow">→</div>') + '</div>';
  }

  function renderManagerReviewCoaching() {
    var agenda = teamAgendaCandidates();
    var cards = agenda.map(function(rep){
      var rt = rep.runtime || teamRepRuntime(rep);
      var done = !!state.coachingAgendaStatus[rep.id];
      var visit = data.visits.find(function(v){ return v.id === rep.visitId; }) || data.visits[0];
      return '<div class="review-coach-card ' + (done ? "done" : "") + '"><div><span>' + (done ? "✓ 已辅导" : "本周 Agenda") + '</span><strong>' + esc(rep.name) + ' · ' + esc(rep.issue) + '</strong><p>' + esc(rep.next) + '</p></div><div><b>拜访 ' + rt.score + '</b><b>优先 ' + rt.priority + '</b><button class="tiny-btn" data-review-coach="' + rep.id + '">进入</button></div></div>';
    }).join("");
    return cards || '<div class="empty-state"><strong>暂无本周 Coaching Agenda</strong></div>';
  }

  function renderManagerReviewOutcomes() {
    var signals = [];
    Object.keys(state.liveVisitSessions || {}).forEach(function(id){
      var s = state.liveVisitSessions[id];
      if (!s || !s.ended || !s.commitment) return;
      var rv = (data.repDay && data.repDay.visits || []).find(function(v){ return v.id === id; });
      signals.push({
        type:"客户承诺",
        title: rv ? rv.doctor + " · " + rv.hospital.replace("华东大学附属第一医院","华东附一") : id,
        signal:s.commitment,
        evidence:s.notes && s.notes.length ? s.notes[s.notes.length-1] : "现场拜访回流"
      });
    });
    (state.outcomes || []).slice(0,3).forEach(function(o){
      signals.push({type:"Outcome",title:o.targetType + ":" + o.targetId,signal:o.signal,evidence:o.evidence || "AI GPS Outcome"});
    });
    if (!signals.length) {
      signals = [
        {type:"业务里程碑",title:"滨江中心",signal:"病例共识会获得口头意向",evidence:"赵倩重点拜访"},
        {type:"行为风险",title:"刘晨",signal:"连续 3 次重点拜访未形成明确下一步",evidence:"Coaching Agent"}
      ];
    }
    return signals.slice(0,5).map(function(s){
      return '<div class="review-outcome"><span>' + esc(s.type) + '</span><strong>' + esc(s.title) + '</strong><p>' + esc(s.signal) + '</p><small>' + esc(s.evidence) + '</small></div>';
    }).join("");
  }

  function renderManagerReviewPlan() {
    if (!state.managerReviewGenerated) {
      return '<div class="review-plan-empty"><span>NEXT WEEK</span><strong>还没有生成下周行动计划</strong><p>系统会根据本周医院进展、代表执行、Coaching、Outcome 和团队打法生成建议.</p><button class="btn primary" data-review-generate>生成下周计划</button></div>';
    }
    var items = managerReviewPlanItems();
    return '<div class="review-plan-list">' + items.map(function(item){
      var checked = state.managerReviewPlan[item.id] !== false;
      return '<button class="review-plan-item ' + (checked ? "selected" : "") + '" data-review-plan="' + item.id + '"><span class="review-plan-check">' + (checked ? "✓" : "") + '</span><div><strong>' + esc(item.title) + '</strong><p>' + esc(item.reason) + '</p><small>Owner · ' + esc(item.owner) + ' · Success · ' + esc(item.success) + '</small></div><em data-review-route="' + item.route + '">→</em></button>';
    }).join("") + '</div>';
  }

  function renderManagerReview() {
    var chain = managerReviewChainStatus();
    var avgHospital = Math.round((chain.hospital + chain.action) / 2);
    var agenda = teamAgendaCandidates();
    var coachingDone = agenda.filter(function(rep){ return !!state.coachingAgendaStatus[rep.id]; }).length;
    var planSelected = state.managerReviewGenerated ? Object.keys(state.managerReviewPlan || {}).filter(function(id){ return !!state.managerReviewPlan[id]; }).length : 0;
    var champion = bestTeamPlaybookCandidate();

    return '<div class="page-banner review-banner"><div><span class="banner-kicker">WEEKLY MANAGER REVIEW</span><h2>本周发生了什么, 下周只做什么?</h2><p>把医院目标、代表行动、辅导、Outcome 和组织学习收敛成一次可执行的周会.</p></div><div class="banner-side"><strong>' + (state.managerReviewClosed ? "CLOSED" : "W4") + '</strong><span>' + (state.managerReviewClosed ? "本周 Review 已完成" : "当前 Review 周") + '</span></div></div>' +
      '<div class="metric-grid">' +
        metric("医院推进健康度",avgHospital+"%","目标与 Action 综合进展",avgHospital>=70?"良好":"关注","院") +
        metric("本周核心 Coaching",coachingDone+"/2","30 分钟 Agenda",coachingDone===2?"完成":"待完成","辅") +
        metric("真实 Outcome",String(chain.outcome)+"%","现场承诺与结果信号","回流","O") +
        metric("下周重点",state.managerReviewGenerated?planSelected+" 项":"未生成","确认后关闭周会",state.managerReviewClosed?"已锁定":"","周") +
      '</div>' +
      '<div class="mt-16">' + panel("本周经营链","从医院目标一直看到下周行动, 每个节点都能钻回原页面",renderManagerReviewChain()) + '</div>' +
      '<div class="mt-16">' + panel("01 · 医院目标与 Action Review","不是汇报拜访次数, 而是检查关键医院业务杠杆有没有真正推进",'<div class="review-table-wrap"><table class="review-hospital-table"><thead><tr><th>医院</th><th>本季度目标</th><th>Action 进展</th><th>状态</th><th>本周 Outcome / 风险</th><th></th></tr></thead><tbody>' + renderManagerReviewHospitalTable() + '</tbody></table></div>') + '</div>' +
      '<div class="grid-equal mt-16"><div>' +
        panel("02 · 本周核心 Coaching","30 分钟 Agenda 只保留最值得经理介入的 2 人",'<div class="review-coaching-list">' + renderManagerReviewCoaching() + '</div><div class="review-link"><button class="btn soft" data-review-route="teamcoaching">打开团队辅导工作台</button></div>') +
      '</div><div>' +
        panel("03 · Outcome 信号","不问“做完了吗”, 而问客户行为和业务里程碑发生了什么",'<div class="review-outcomes">' + renderManagerReviewOutcomes() + '</div>') +
      '</div></div>' +
      '<div class="grid-equal mt-16"><div>' +
        panel("04 · Champion Pattern","把有效打法从个人经验变成下周可以复制的团队动作",
          champion ? '<div class="review-champion"><span>CHAMPION</span><strong>' + esc(champion.name) + ' · ' + esc(champion.strength) + '</strong><p>' + esc(champion.next) + '</p><div><b>承诺率 ' + esc(champion.commitmentRate) + '%</b><b>NBA ' + esc(champion.nbaCompletion) + '%</b></div><button class="btn ' + (state.teamPlaybook?"soft":"primary") + '" data-review-adopt-playbook>' + (state.teamPlaybook?"✓ 已进入团队 Playbook":"采纳为团队 Playbook") + '</button></div>' : '<div class="empty-state">暂无 Champion Pattern</div>') +
      '</div><div>' +
        panel("05 · 下周只做这些","AI 根据本周 Context 生成, 经理勾选确认而不是照单全收",renderManagerReviewPlan()) +
      '</div></div>' +
      '<div class="review-close-bar"><div><span>REVIEW GATE</span><strong>' + (state.managerReviewClosed ? "本周已关闭, 下周重点已锁定" : "确认下周重点后结束本周 Review") + '</strong><p>' + (state.managerReviewGenerated ? "当前已确认 " + planSelected + " 项下周行动." : "尚未生成下周行动计划.") + '</p></div><button class="btn primary" data-review-close>' + (state.managerReviewClosed ? "重新打开 Review" : "完成本周 Review") + '</button></div>';
  }

  function renderTeamCoaching() {
    var allReps = (data.teamCoaching && data.teamCoaching.reps || []).map(function(rep){
      return Object.assign({},rep,{runtime:teamRepRuntime(rep)});
    });
    var reps = teamCoachingReps();
    var avg = Math.round(allReps.reduce(function(sum,r){return sum+r.runtime.score;},0) / Math.max(1,allReps.length));
    var critical = allReps.filter(function(r){return r.runtime.priority >= 85;}).length;
    var practiceDone = allReps.filter(function(r){return r.runtime.practiceDone || r.practice === "已通过";}).length;
    var avgCommitment = Math.round(allReps.reduce(function(sum,r){return sum+Number(r.commitmentRate||0);},0) / Math.max(1,allReps.length));

    var filters = [
      ["priority","辅导优先级"],
      ["critical","需立即辅导"],
      ["practice","陪练未完成"],
      ["improving","正在改善"]
    ].map(function(f){
      return '<button class="filter-chip ' + (state.teamCoachingFilter===f[0]?"active":"") + '" data-team-filter="' + f[0] + '">' + f[1] + '</button>';
    }).join("");

    var queue = reps.map(function(rep,index){
      var rt = rep.runtime;
      var trendDelta = Number(rep.score) - Number(rep.previousScore);
      var practiceLabel = rt.practiceDone ? "陪练通过 " + rt.practiceScore : (rep.practice === "已通过" ? "历史已通过 " + rep.practiceScore : rep.practice);
      return '<article class="team-rep-card ' + (rt.priority>=90?"critical":"") + '">' +
        '<div class="team-rep-rank"><span>#' + (index+1) + '</span><strong>' + rt.priority + '</strong><small>辅导优先</small></div>' +
        '<div class="team-rep-main"><div class="team-rep-head"><div><strong>' + esc(rep.name) + '</strong><span>' + esc(rep.territory) + ' · ' + esc(rep.coachingStatus) + '</span></div><span class="status ' + (rt.priority>=90?"risk":(rt.priority>=75?"doing":"done")) + '">' + esc(rep.issue) + '</span></div>' +
        '<div class="team-rep-insight"><p><b>重复出现 ' + esc(rep.repeated) + ' 次</b> · ' + esc(rep.risk) + '</p><span>下一步: ' + esc(rep.next) + '</span></div>' +
        '<div class="team-rep-meta"><div><span>最近拜访</span><strong>' + rt.score + '</strong><small>' + (trendDelta>=0?"+":"") + trendDelta + ' vs 上次</small></div><div><span>行为承诺率</span><strong>' + esc(rep.commitmentRate) + '%</strong></div><div><span>NBA 完成</span><strong>' + esc(rep.nbaCompletion) + '%</strong></div><div><span>陪练</span><strong class="' + (rt.practiceDone?"good-text":"") + '">' + esc(practiceLabel) + '</strong></div><div class="team-trend-cell"><span>4 次趋势</span>' + renderTeamTrend(rep) + '</div></div>' +
        '<div class="team-rep-actions"><button class="btn ghost" data-team-detail="' + rep.id + '">查看拜访</button>' +
        ((rep.id === "rep1" || rep.id === "rep2" || rep.id === "rep3")
          ? '<button class="btn ' + (rt.practiceDone?"soft":"primary") + '" data-team-practice="' + rep.id + '">' + (rt.practiceDone?"查看陪练证据":"立即开始陪练") + '</button>'
          : '<button class="btn soft" data-team-detail="' + rep.id + '">查看辅导建议</button>') +
        '</div></div>' +
      '</article>';
    }).join("");
    if (!queue) queue = '<div class="empty-state"><strong>当前筛选没有代表</strong><span>换一个筛选条件查看团队情况.</span></div>';

    var patterns = (data.teamCoaching.patterns || []).map(function(p){
      var width = Math.min(100,Math.max(12,Number(p.rate||0)*2.5));
      return '<div class="pattern-row"><div><strong>' + esc(p.name) + '</strong><span>' + esc(p.dimension) + ' · 本周 ' + esc(p.count) + ' 次</span></div><div class="pattern-bar"><i style="width:' + width + '%"></i></div><b>' + esc(p.rate) + '%</b><em class="' + (p.change<=0?"good":"warn") + '">' + (p.change>0?"+":"") + esc(p.change) + '%</em><p>' + esc(p.action) + '</p></div>';
    }).join("");

    var dimensions = ["目标清晰","探询质量","证据匹配","异议处理","推进承诺"];
    var heatHead = dimensions.map(function(d){return '<th>' + esc(d) + '</th>';}).join("");
    var heatRows = allReps.map(function(rep){
      var dims = teamRepDimensions(rep);
      return '<tr><td><b>' + esc(rep.name) + '</b><span>' + esc(rep.territory) + '</span></td>' + dimensions.map(function(d){
        var score = dims[d];
        var cls = score>=85?"high":(score>=70?"mid":"low");
        return '<td><div class="heat-score ' + cls + '">' + score + '</div></td>';
      }).join("") + '</tr>';
    }).join("");

    var practiceCards = allReps.map(function(rep){
      var rt = rep.runtime;
      var stateText = rt.practiceDone ? "已通过" : (rt.conversationRounds ? "进行中 " + rt.conversationRounds + "/4" : "未开始");
      var pct = rt.practiceDone ? 100 : Math.round(rt.conversationRounds/4*100);
      var targetAttr = (rep.id === "rep1" || rep.id === "rep2" || rep.id === "rep3")
        ? 'data-team-practice="' + rep.id + '"'
        : 'data-team-detail="' + rep.id + '"';
      return '<button class="practice-progress-card" ' + targetAttr + '><div><strong>' + esc(rep.name) + '</strong><span>' + esc(rep.issue) + '</span></div><div class="practice-progress-bar"><i style="width:' + pct + '%"></i></div><b>' + esc(stateText) + '</b></button>';
    }).join("");

    return '<div class="page-banner"><div><span class="banner-kicker">TEAM COACHING WORKSPACE</span><h2>经理今天先辅导谁?</h2><p>先看团队里最影响结果、最可改进、最值得今天介入的行为, 再钻进一次具体拜访.</p></div><div class="banner-side"><strong>' + critical + '</strong><span>高优先辅导对象</span></div></div>' +
      '<div class="metric-grid">' +
        metric("团队拜访质量",avg,"5 人最近重点拜访均值",avg>=75?"+3":"需提升","分") +
        metric("高优先辅导",critical,"优先解决重复失效行为",critical?"今天处理":"良好","辅") +
        metric("陪练完成",practiceDone+"/5","四轮 AI 模拟通过",practiceDone>=3?"+1":"需推进","练") +
        metric("明确承诺率",avgCommitment+"%","拜访结束形成可验证下一步",avgCommitment>=70?"改善":"重点","诺") +
      '</div>' +
      '<div class="filter-bar"><div class="filter-group">' + filters + '</div><span class="small-note">优先级 = 业务影响 × 问题重复 × 可改进性 × 当前训练状态</span></div>' +
      '<div class="grid-equal mt-16"><div>' + renderWeeklyAgenda() + '</div><div>' + renderTeamTrendPanel() + '</div></div>' +
      '<div class="mt-16">' + renderTeamPlaybook() + '</div>' +
      '<div class="team-coaching-layout mt-16"><div class="stack"><div class="team-coaching-queue">' + queue + '</div></div><div class="stack">' +
        panel("团队反复失效模式","不是逐个人讲经验, 先看团队最值得系统修复什么",'<div class="pattern-list">' + patterns + '</div>') +
        panel("AI 陪练完成度","点击代表可直接进入对应四轮训练",'<div class="practice-progress-list">' + practiceCards + '</div>') +
      '</div></div>' +
      '<div class="mt-16">' + panel("团队能力热力图","真实拜访评分 + AI 陪练结果会共同影响能力画像",'<div class="heat-table-wrap"><table class="team-heat-table"><thead><tr><th>代表</th>' + heatHead + '</tr></thead><tbody>' + heatRows + '</tbody></table></div>') + '</div>';
  }

  function coachingReviewSession(visitId) {
    if (!state.reviewSessions[visitId]) {
      state.reviewSessions[visitId] = {
        generated: false,
        issueAccepted: false,
        nextActionAccepted: false,
        completed: false
      };
    }
    return state.reviewSessions[visitId];
  }

  function coachingRoleplaySession(visitId) {
    if (!state.roleplaySessions[visitId]) {
      state.roleplaySessions[visitId] = {
        round: 0,
        history: [],
        dimensionScores: {},
        conversationDone: false,
        completed: false,
        lockedAt: null
      };
    }
    var session = state.roleplaySessions[visitId];

    if (!Array.isArray(session.history)) {
      session.round = 0;
      session.history = [];
      session.dimensionScores = {};
      session.conversationDone = false;
      session.completed = false;
      session.lockedAt = null;
    }
    if (!session.dimensionScores) session.dimensionScores = {};
    if (session.round == null) session.round = session.history.length;
    return session;
  }

  function roleplayScenario(v) {
    if (v.issue === "推进不够") {
      return {
        title: "从“有兴趣”推进到明确承诺",
        target: "连续完成场景确认、异议处理、时间锁定和最终承诺.",
        rounds: [
          {
            dimension: "探询质量",
            stage: "01 识别意愿",
            doctor: "这几个病例挺有意思的, 我回头再看看.",
            choices: [
              { text: "好的, 您有空再看看, 我下次再来.", score: 38, reply: "好, 有需要再联系.", feedback: "直接结束了对话, 没有把兴趣转成任何可验证行为." },
              { text: "您觉得这三个病例里, 哪一类最值得在住院组再判断一次?", score: 91, reply: "第二类吧, 这种边界患者我们组里意见确实不太一致.", feedback: "先确认了医生真正愿意继续讨论的场景, 为后续承诺创造 Context." },
              { text: "我再给您发几篇最新研究, 内容比较完整.", score: 58, reply: "可以发我邮箱, 我有空看看.", feedback: "增加了内容, 但没有确认医生下一步愿意做什么." }
            ]
          },
          {
            dimension: "证据匹配",
            stage: "02 聚焦场景",
            doctor: "第二类患者比较复杂, 指南说得清楚, 但真实病人经常没那么标准.",
            choices: [
              { text: "那我把整套指南和研究都发给您, 信息会更完整.", score: 55, reply: "资料太多了, 我不一定有时间仔细看.", feedback: "证据数量增加, 但没有针对医生刚才指出的边界患者问题." },
              { text: "那我们只拿 1 例类似的边界患者, 对照您最关心的两个判断标准来看.", score: 94, reply: "这样可以, 如果病例够接近的话会更有意义.", feedback: "把证据范围缩到医生真实决策标准, 降低了沟通负担." },
              { text: "其实我们产品在很多患者里效果都不错.", score: 42, reply: "我现在不是在问产品整体效果.", feedback: "偏离了医生当前 Context, 又回到了泛化产品介绍." }
            ]
          },
          {
            dimension: "异议处理",
            stage: "03 处理时间异议",
            doctor: "不过这周我们组里比较忙, 不一定能专门安排时间.",
            choices: [
              { text: "没问题, 那我下周再联系您.", score: 49, reply: "好, 到时候再看吧.", feedback: "接受了异议但没有缩小动作, 机会再次变成模糊跟进." },
              { text: "不用单独开会. 下次住院组原本讨论病例时, 留 10 分钟一起判断 1 例就行.", score: 92, reply: "这个可以, 不额外占时间的话比较现实.", feedback: "保留了医生的时间约束, 同时把动作缩小为可执行的最小承诺." },
              { text: "这个内容很重要, 我还是建议专门安排半小时.", score: 51, reply: "半小时确实比较难安排.", feedback: "没有顺着客户约束调整方案, 继续增加了执行成本." }
            ]
          },
          {
            dimension: "推进承诺",
            stage: "04 锁定下一步",
            doctor: "可以, 下次住院组讨论时顺便看一例.",
            choices: [
              { text: "好的, 那我到时候提前联系您.", score: 67, reply: "可以.", feedback: "已有积极意愿, 但仍缺具体时间、病例和代表下一步动作." },
              { text: "那就定周四下午. 我周三把 1 例边界病例卡发您确认, 周四讨论时一起判断.", score: 97, reply: "可以, 你周三先发我, 周四我们组里一起看.", feedback: "形成了时间、对象、准备动作和客户行为, 是完整可验证承诺." },
              { text: "好的, 我把资料准备充分一些再说.", score: 54, reply: "行, 你准备好再联系.", feedback: "又把已经出现的机会推回未来, 没有锁定承诺." }
            ]
          }
        ]
      };
    }

    if (v.issue === "可复制经验") {
      return {
        title: "把正向兴趣复制成病例共识会",
        target: "把流程问题认可转成日期、参与人、病例和会后跟进.",
        rounds: [
          {
            dimension: "探询质量",
            stage: "01 确认问题",
            doctor: "这个患者识别问题确实一直存在, 不同医生的判断差异挺大.",
            choices: [
              { text: "我们的产品正好可以解决这个问题.", score: 46, reply: "我说的是流程标准不一致, 不只是产品.", feedback: "把客户流程问题过早转成产品价值, 丢失了当前最强 Context." },
              { text: "如果只能先统一一个环节, 您觉得最值得先解决的是患者识别还是随访?", score: 95, reply: "先识别吧, 前面都不一致, 后面更难统一.", feedback: "让医生自己定义最优先流程节点, 后续动作更容易获得支持." },
              { text: "这个问题很多医院都有, 我们有不少成功案例.", score: 68, reply: "案例可以看看, 但我们科具体怎么改还得再讨论.", feedback: "建立了一定相关性, 但还没有进一步确认当前科室的优先节点." }
            ]
          },
          {
            dimension: "证据匹配",
            stage: "02 设计小实验",
            doctor: "患者识别要统一的话, 最好别一开始搞得太复杂.",
            choices: [
              { text: "那我们做一次完整培训, 把指南和研究都系统讲一遍.", score: 53, reply: "完整培训可能大家时间不够.", feedback: "动作过大, 与医生要求的“小而简单”相反." },
              { text: "不做培训. 只拿 3 类最常见病例, 20 分钟把判断标准跑一遍.", score: 97, reply: "这个可以, 20 分钟比较容易安排.", feedback: "把业务问题转成一个低成本、可验证的小实验." },
              { text: "我先给大家建一个资料群, 后面慢慢看.", score: 58, reply: "资料群可以, 但未必有人会统一看.", feedback: "仍然是信息分发, 不是改变决策流程." }
            ]
          },
          {
            dimension: "异议处理",
            stage: "03 确认参与人",
            doctor: "不过病例讨论不能只有我一个人, 门诊组最好也有人参加.",
            choices: [
              { text: "那您看谁方便就叫谁吧.", score: 62, reply: "到时候再看谁有空.", feedback: "把关键参与人留成模糊状态, 会降低会议真正发生的概率." },
              { text: "同意. 您定 2 位门诊组核心医生, 我们就围绕他们最常遇到的病例准备.", score: 94, reply: "可以, 我让李医生和孙医生一起参加.", feedback: "顺着医生的真实约束, 同时把参与人明确下来." },
              { text: "其实您作为主任参加就够了.", score: 39, reply: "流程要落地还是得让门诊组的人一起参与.", feedback: "忽略了执行层, 与流程共识的业务目标冲突." }
            ]
          },
          {
            dimension: "推进承诺",
            stage: "04 锁定病例会",
            doctor: "那就找个时间试一次吧.",
            choices: [
              { text: "好, 我回去准备完再和您约.", score: 64, reply: "行, 你准备好了再说.", feedback: "已有明确机会, 但没有把口头意愿锁成日期." },
              { text: "下周四病例会留 20 分钟怎么样? 我周二前把 3 个病例和议程发给您确认.", score: 98, reply: "周四可以, 你先和秘书把时间锁一下.", feedback: "日期、时长、病例、准备动作都明确, 可以进入执行." },
              { text: "我们下个月安排一个更正式的大型活动.", score: 47, reply: "先别搞那么大, 小范围试一次更合适.", feedback: "从小实验又跳回重投入活动, 放大了客户执行成本." }
            ]
          }
        ]
      };
    }

    return {
      title: "从“证据展示”转成真实决策对话",
      target: "先补 Context, 再精准证据, 处理异议, 最后锁定 MDT 承诺.",
      rounds: [
        {
          dimension: "探询质量",
          stage: "01 补 Context",
          doctor: "数据我看过一些, 但我现在更关心这类患者到底怎么选.",
          choices: [
            { text: "我们这组真实世界数据纳入了很多高风险患者, 长期结果也比较完整.", score: 52, reply: "我的问题还是哪些患者值得现在就调整方案.", feedback: "继续呈现证据, 没有回应医生正在提出的“怎么选”这个决策问题." },
            { text: "您判断这类患者时, 现在最看重哪两个指标? 是既往事件、长期风险, 还是当前控制情况?", score: 95, reply: "我主要看既往事件和长期风险, 但安全性也很重要.", feedback: "先确认医生自己的判断标准, 后续证据才能真正场景匹配." },
            { text: "指南其实对这类患者已经有比较明确的推荐.", score: 63, reply: "指南我知道, 但实际患者没有那么标准.", feedback: "靠近决策问题, 但仍没有先确认医生在真实病例里的标准." }
          ]
        },
        {
          dimension: "证据匹配",
          stage: "02 精准证据",
          doctor: "我主要看既往事件和长期风险, 但安全性也很重要.",
          choices: [
            { text: "那我把研究全文和完整安全性数据都发给您.", score: 60, reply: "资料太多了, 我主要想知道这类患者是不是值得现在调整.", feedback: "信息过载, 没有把证据压缩到当前两个判断标准." },
            { text: "那我们只看与既往事件和长期风险直接相关的这一组结果, 再单独看安全性边界.", score: 96, reply: "这样比较清楚. 不过这些患者和我们科的病人真的接近吗?", feedback: "证据直接映射医生刚刚说出的决策标准, 沟通效率高." },
            { text: "其实这项研究总体结果都很好.", score: 49, reply: "总体结果我知道, 我关心的是具体哪些患者.", feedback: "再次回到总体产品价值, 丢掉了亚组 Context." }
          ]
        },
        {
          dimension: "异议处理",
          stage: "03 处理外推异议",
          doctor: "这些研究患者和我们科的真实病人真的接近吗?",
          choices: [
            { text: "研究设计很严格, 所以结果是可信的.", score: 57, reply: "可信不代表和我们患者一样.", feedback: "回答了研究质量, 没回答医生担心的患者外推问题." },
            { text: "这是关键问题. 我们先对照这例患者的既往事件和风险特征, 看她与研究亚组差在哪里.", score: 94, reply: "可以, 如果差异不大, 周三 MDT 可以一起讨论.", feedback: "承认不确定性, 回到具体病例进行匹配, 没有过度承诺." },
            { text: "很多医院都已经在用类似方案了.", score: 45, reply: "别的医院怎么用不能直接代表我们科.", feedback: "用社会证明替代临床匹配, 没解决医生真实异议." }
          ]
        },
        {
          dimension: "推进承诺",
          stage: "04 锁定 MDT",
          doctor: "如果这例患者差异不大, 周三 MDT 可以一起讨论.",
          choices: [
            { text: "好的, 我到时候再看看您是否方便.", score: 66, reply: "可以, 到时候再说.", feedback: "医生已经给出机会, 但代表没有锁定准备动作和讨论对象." },
            { text: "那我周二前把这例患者与研究亚组的差异整理成一页, 周三 MDT 只讨论这一例, 可以吗?", score: 98, reply: "可以, 你周二先发我看看, 周三拿这一例讨论.", feedback: "把医生意愿转成时间、病例、准备动作和可验证客户承诺." },
            { text: "那我把所有相关资料都准备好带过去.", score: 61, reply: "不用太多, 这例患者相关的就行.", feedback: "已有正确方向, 但动作仍然偏重, 没有充分收敛." }
          ]
        }
      ]
    };
  }

  function roleplayScorecard(session, scenario) {
    var dimensions = ["探询质量","证据匹配","异议处理","推进承诺"];
    var scores = dimensions.map(function(dim){
      var item = (session.history || []).find(function(h){ return h.dimension === dim; });
      return { dimension: dim, score: item ? Number(item.score || 0) : 0 };
    });
    var completedScores = scores.filter(function(x){ return x.score > 0; });
    var overall = completedScores.length
      ? Math.round(completedScores.reduce(function(sum,x){ return sum + x.score; },0) / completedScores.length)
      : 0;
    var weakest = scores.slice().sort(function(a,b){ return a.score - b.score; })[0];
    var strongest = scores.slice().sort(function(a,b){ return b.score - a.score; })[0];
    return {
      scores: scores,
      overall: overall,
      weakest: weakest,
      strongest: strongest,
      passed: session.conversationDone && overall >= 85,
      title: scenario.title
    };
  }

  function renderThreeMinuteReview(v, liveSession) {
    var review = coachingReviewSession(v.id);
    var audio = state.audioReviews[v.id];
    var fieldNote = liveSession && liveSession.notes && liveSession.notes.length ? liveSession.notes[liveSession.notes.length - 1] : "";
    var commitment = liveSession && liveSession.commitment ? liveSession.commitment : "";
    var generated = review.generated && audio;
    var summaryBody = generated
      ? '<div class="review-summary-grid"><div class="review-summary-card"><span>本次目标</span><strong>' + esc(commitment || "推进一个明确的客户下一步行为") + '</strong></div><div class="review-summary-card"><span>客户关键信号</span><strong>' + esc(fieldNote || audio.diagnosis.evidence) + '</strong></div><div class="review-summary-card critical"><span>TOP 1 改进点</span><strong>' + esc(v.issue) + '</strong></div><div class="review-summary-card"><span>下一次动作</span><strong>' + esc(v.nextScript) + '</strong></div></div>'
      : '<div class="review-empty"><div class="review-mic">REC</div><div><strong>生成 3 分钟复盘</strong><p>原型会模拟语音转写、摘要、评分和 Top 1 问题识别.</p></div><button class="btn primary" data-start-three-review>使用演示录音生成</button></div>';

    var steps = [
      ["00:00–00:45","自动摘要",generated],
      ["00:45–01:30","Top 1 诊断",generated],
      ["01:30–02:30","AI 陪练",(coachingRoleplaySession(v.id).history || []).length > 0],
      ["02:30–03:00","确认下一步",coachingRoleplaySession(v.id).completed]
    ].map(function(s){
      return '<div class="review-step ' + (s[2] ? "done" : "") + '"><span>' + (s[2] ? "✓" : "") + '</span><div><b>' + esc(s[0]) + '</b><strong>' + esc(s[1]) + '</strong></div></div>';
    }).join('<div class="review-step-arrow">→</div>');

    return panel("拜访后 3 分钟复盘", "不写长报告, 只保留影响下一次行动的事实、问题和改进",
      '<div class="review-timeline">' + steps + '</div>' + summaryBody +
      (generated ? '<div class="review-next"><span>AI 诊断</span><strong>' + esc(audio.diagnosis.topIssue) + ' · ' + esc(audio.diagnosis.score) + ' 分</strong><p>' + esc(audio.diagnosis.nextAction) + '</p><button class="btn soft" data-review-accept-issue>' + (review.issueAccepted ? "✓ 已确认首要问题" : "确认首要问题并开始陪练") + '</button></div>' : '')
    );
  }

  function renderRoleplay(v) {
    var review = coachingReviewSession(v.id);
    var session = coachingRoleplaySession(v.id);
    if (!review.issueAccepted) {
      return panel("AI 多轮角色扮演", "先完成 3 分钟复盘并确认首要问题",
        '<div class="roleplay-locked"><span>LOCKED</span><strong>确认 Top 1 改进点后开始 4 轮陪练</strong><p>一轮只做一件事: 补 Context → 匹配证据 → 处理异议 → 锁定承诺.</p></div>'
      );
    }

    var scenario = roleplayScenario(v);
    var roundIndex = Math.min(Number(session.round || 0), scenario.rounds.length);
    var currentRound = roundIndex < scenario.rounds.length ? scenario.rounds[roundIndex] : null;
    var scorecard = roleplayScorecard(session, scenario);

    var progress = scenario.rounds.map(function(round,i){
      var done = i < roundIndex;
      var active = i === roundIndex && !session.conversationDone;
      return '<div class="multi-round-step ' + (done ? "done" : "") + (active ? " active" : "") + '"><span>' + (done ? "✓" : "0" + (i+1)) + '</span><div><b>' + esc(round.dimension) + '</b><small>' + esc(round.stage) + '</small></div></div>';
    }).join('<div class="multi-round-arrow">→</div>');

    var history = (session.history || []).map(function(item){
      return '<div class="conversation-block">' +
        '<div class="conversation-message doctor"><span>医生</span><p>“' + esc(item.doctor) + '”</p></div>' +
        '<div class="conversation-message rep"><span>代表</span><p>' + esc(item.rep) + '</p></div>' +
        '<div class="conversation-message doctor reply"><span>医生回应</span><p>“' + esc(item.reply) + '”</p></div>' +
        '<div class="conversation-feedback ' + (item.score >= 85 ? "good" : (item.score >= 65 ? "mid" : "bad")) + '"><b>' + esc(item.dimension) + ' · ' + item.score + '</b><span>' + esc(item.feedback) + '</span></div>' +
      '</div>';
    }).join("");

    var current = "";
    if (currentRound && !session.conversationDone) {
      var choices = currentRound.choices.map(function(choice,i){
        return '<button class="multi-roleplay-choice" data-roleplay-round-choice="' + i + '"><span>' + String.fromCharCode(65+i) + '</span><p>' + esc(choice.text) + '</p></button>';
      }).join("");
      current =
        '<div class="current-round-card"><div class="current-round-head"><span>' + esc(currentRound.stage) + '</span><strong>' + esc(currentRound.dimension) + '</strong></div>' +
        '<div class="conversation-message doctor current"><span>医生</span><p>“' + esc(currentRound.doctor) + '”</p></div>' +
        '<div class="multi-roleplay-choices">' + choices + '</div></div>';
    }

    var scorecardHtml = "";
    if (session.conversationDone) {
      var dimensions = scorecard.scores.map(function(item){
        return '<div class="scorecard-dimension"><div class="flex-between"><span>' + esc(item.dimension) + '</span><strong>' + item.score + '</strong></div><div class="bar"><i style="width:' + item.score + '%"></i></div></div>';
      }).join("");
      var passText = scorecard.passed ? "通过" : "需再练";
      scorecardHtml =
        '<div class="simulation-scorecard ' + (scorecard.passed ? "passed" : "retry") + '">' +
          '<div class="scorecard-head"><div><span>SIMULATION SCORECARD</span><h3>完整拜访模拟评分卡</h3><p>' + esc(scenario.target) + '</p></div><div class="scorecard-total"><strong>' + scorecard.overall + '</strong><span>' + passText + '</span></div></div>' +
          '<div class="scorecard-grid">' + dimensions + '</div>' +
          '<div class="scorecard-insight"><div><span>最强维度</span><strong>' + esc(scorecard.strongest.dimension) + ' · ' + scorecard.strongest.score + '</strong></div><div><span>下一轮优先练</span><strong>' + esc(scorecard.weakest.dimension) + ' · ' + scorecard.weakest.score + '</strong></div></div>' +
          (scorecard.passed
            ? '<div class="practice-proof"><span>READY FOR MANAGER CHECK</span><strong>完整模拟已通过 · 总分 ' + scorecard.overall + '</strong><p>四个关键环节均已完成, 可以锁定为下一次拜访前的经理检查证据.</p></div>'
            : '<div class="scorecard-warning"><strong>总分未达到 85</strong><span>建议重新挑战, 重点改善 “' + esc(scorecard.weakest.dimension) + '”.</span></div>') +
          '<div class="roleplay-actions"><button class="btn ghost" data-roleplay-restart>重新挑战 4 轮</button><button class="btn primary" data-roleplay-lock ' + (!scorecard.passed || session.completed ? "disabled" : "") + '>' + (session.completed ? "✓ 已锁定为经理证据" : "锁定训练结果") + '</button></div>' +
        '</div>';
    }

    var managerProof = session.completed
      ? '<div class="practice-proof"><span>MANAGER CHECK EVIDENCE</span><strong>4 轮 AI 模拟已完成 · 总分 ' + scorecard.overall + '</strong><p>探询、证据匹配、异议处理、推进承诺均已形成可检查训练记录.</p></div>'
      : "";

    return panel("AI 多轮角色扮演", "完整模拟: " + scenario.title,
      '<div class="multi-roleplay-head"><div><span>TRAINING TARGET</span><strong>' + esc(scenario.target) + '</strong></div><div><span>进度</span><strong>' + Math.min(roundIndex,4) + ' / 4</strong></div></div>' +
      '<div class="multi-round-progress">' + progress + '</div>' +
      '<div class="conversation-thread">' + history + current + '</div>' +
      scorecardHtml +
      managerProof
    );
  }
  function renderCoaching() {
    var v = data.visits.find(function (x) { return x.id === state.selectedVisit; }) || data.visits[0];
    var visitOptions = data.visits.map(function (x) {
      return '<option value="' + x.id + '"' + (x.id === v.id ? " selected" : "") + '>' + esc(x.rep) + ' → ' + esc(x.doctor) + ' · ' + esc(x.time) + '</option>';
    }).join("");

    var dims = v.dimensions.map(function (x) {
      return '<div class="dimension-row"><span>' + esc(x[0]) + '</span><div class="bar"><i style="width:' + x[1] + '%"></i></div><b>' + x[1] + '</b></div>';
    }).join("");

    var repVisit = (data.repDay && data.repDay.visits || []).find(function (rv) {
      if (state.selectedVisit === "v1") return rv.id === "rv2";
      if (state.selectedVisit === "v3") return rv.id === "rv3";
      return rv.id === "rv1" || rv.id === "rv4";
    });
    var liveSession = repVisit && state.liveVisitSessions[repVisit.id];
    var fieldSignal = liveSession && liveSession.ended
      ? '<div class="field-return"><span>REP FIELD RETURN</span><strong>代表刚刚完成拜访并形成承诺</strong><p>' + esc(liveSession.commitment) + '</p>' + (liveSession.notes && liveSession.notes.length ? '<small>现场记录: ' + esc(liveSession.notes[liveSession.notes.length - 1]) + '</small>' : '') + '</div>'
      : "";

    var tabs = [
      ["review", "拜访复盘"],
      ["diagnosis", "问题诊断"],
      ["next", "下一次脚本"]
    ].map(function (t) {
      return '<button class="tab-btn ' + (state.coachingTab === t[0] ? "active" : "") + '" data-coaching-tab="' + t[0] + '">' + t[1] + '</button>';
    }).join("");

    var tabBody = "";
    if (state.coachingTab === "review") {
      tabBody = '<div class="grid-equal"><div><h4 style="font-size:10px;margin-top:0">本次结果</h4><div class="drawer-callout"><strong>' + esc(v.result) + '</strong><p>' + esc(v.summary) + '</p></div><h4 style="font-size:10px;margin:14px 0 8px">关键片段</h4><div class="quote-box">' + esc(v.quote) + '</div></div><div><h4 style="font-size:10px;margin-top:0">能力维度</h4>' + dims + '</div></div>';
    } else if (state.coachingTab === "diagnosis") {
      tabBody = '<div class="diagnosis-grid"><div class="diagnosis-card"><b>目标不清</b><span>目标模糊 / 优先级不明</span></div><div class="diagnosis-card ' + (v.issue === "探询不足" ? "active" : "") + '"><b>探询不足</b><span>信息不全 / 需求不深</span></div><div class="diagnosis-card"><b>呈值不准</b><span>价值不匹配 / 证据不足</span></div><div class="diagnosis-card ' + (v.issue === "推进不够" ? "active" : "") + '"><b>推进不够</b><span>未达成下一步动作</span></div></div><div class="drawer-callout mt-16"><strong>AI 优先诊断: ' + esc(v.issue) + '</strong><p>优先诊断 = 影响程度 × 可改进性, 并结合医生反馈、关键场景和代表能力短板.</p></div>';
    } else {
      tabBody = '<div class="script-box"><span class="label">NEXT VISIT COACHING PLAN</span><div class="script-line"><b>首要改进</b><span>' + esc(v.issue) + '</span></div><div class="script-line"><b>下一次打法</b><span>' + esc(v.nextScript) + '</span></div><div class="script-line"><b>经理检查证据</b><span>角色演练记录 + 下一次拜访结果 + 医生是否形成明确行为承诺</span></div></div><button class="btn primary mt-12" data-custom-action="coach-adopt">采纳为下一次拜访计划</button>';
    }

    return '<div class="page-banner"><div><span class="banner-kicker">VISIT COACHING AGENT</span><h2>从一次真实拜访到下一次行动提升</h2><p>经理不再只给经验反馈. 系统还原发生了什么、诊断真正卡点、替换关键句, 并把改进带入下一次拜访.</p></div><div class="banner-side"><strong>' + v.score + '</strong><span>本次拜访质量 / 100</span></div></div>' +
      '<div class="filter-bar"><select class="select-box" id="visitSelect">' + visitOptions + '</select><div class="filter-group"><span class="status ' + (v.severity === "高" ? "risk" : "done") + '">' + esc(v.severity) + '优先级</span><span class="date-chip">' + esc(v.hospital) + '</span></div></div>' +
      renderManagementSignal(managementForVisit(v.id), "经理辅导") +
      fieldSignal +
      '<div class="mt-16">' + renderThreeMinuteReview(v, liveSession) + '</div>' +
      '<div class="grid-2 mt-16">' +
        panel("拜访质量诊断", v.rep + ' → ' + v.doctor + ' · ' + v.time,
          '<div class="coaching-score"><div class="score-ring" style="background:conic-gradient(#5879df 0 ' + v.score + '%,#e8edf5 ' + v.score + '% 100%)"><div><strong>' + v.score + '</strong><span>综合得分</span></div></div><div>' + dims + '</div></div>'
        ) +
        panel("AI 首要判断", "下一次先改一个最影响结果的问题",
          '<div class="insight-card"><div class="insight-head"><strong>' + esc(v.issue) + '</strong><span class="insight-tag">TOP 1</span></div><p>' + esc(v.summary) + '</p></div><div class="divider"></div><div class="flex-between"><span class="small-note">系统将改进点映射到下一次真实拜访</span><button class="btn soft" data-ai-generate="coaching">AI 生成辅导 NBA</button></div>'
        ) +
      '</div>' +
      '<section class="panel mt-16"><div class="panel-head"><div class="panel-title"><div><h3>结构化辅导工作台</h3><span>复盘 → 诊断 → 改进 → 演练 → 跟进</span></div></div></div><div class="panel-body"><div class="section-tabs">' + tabs + '</div>' + tabBody + '</div></section>' +
      '<div class="mt-16">' + renderCoachingRewrite(v) + '</div>' +
      '<div class="mt-16">' + renderRoleplay(v) + '</div>' +
      '<div class="mt-16">' + renderVoiceReview(v) + '</div>';
  }

  function renderCoachingRewrite(v) {
    var original = v.issue === "推进不够"
      ? "好的, 那您有空再看看, 我下次再来."
      : "我这里有一组新的真实世界数据, 想和您快速看一下.";
    var improved = v.issue === "推进不够"
      ? "下次住院组讨论时, 我们能不能一起判断 1 例边界患者? 我周四下午把病例卡带过来."
      : "对于这类高风险患者, 您现在决定方案时最看重哪两个标准? 我只看与这两个标准直接相关的证据.";
    var evidence = v.issue === "推进不够"
      ? "医生确认具体病例 / 时间 / 下一步承诺"
      : "代表在呈现证据前完成至少 2 个有效探询问题";

    return panel("关键句替换", "不是告诉代表“加强沟通”, 而是把下一次真正要说的话改出来",
      '<div class="rewrite-grid">' +
        '<div class="rewrite-card before"><span>本次原话</span><p>' + esc(original) + '</p><b>问题: ' + esc(v.issue) + '</b></div>' +
        '<div class="rewrite-arrow">→</div>' +
        '<div class="rewrite-card after"><span>下一次建议</span><p>' + esc(improved) + '</p><b>目标: 形成可验证行为推进</b></div>' +
      '</div>' +
      '<div class="coach-proof"><span>经理下次检查证据</span><strong>' + esc(evidence) + '</strong><button class="btn soft" data-custom-action="coach-adopt">采纳到下一次计划</button></div>'
    );
  }

  function renderManagementWorkbench() {
    var cards = (data.risks || []).map(function (r) {
      var selected = state.managementDecisions[r.id] || "";
      var recommended = r.recommended || "";
      var buttons = Object.keys(MANAGEMENT_ACTIONS).map(function (key) {
        var meta = MANAGEMENT_ACTIONS[key];
        var classes = "management-choice " + meta.tone + (selected === key ? " selected" : "") + (recommended === key ? " recommended" : "");
        return '<button class="' + classes + '" data-management-risk="' + esc(r.id) + '" data-management-decision="' + key + '"><span>' + esc(meta.label) + '</span>' + (recommended === key ? '<small>AI 推荐</small>' : '') + '</button>';
      }).join("");
      var current = selected
        ? '<div class="management-current"><span>已决策</span><strong>' + esc(managementLabel(selected)) + '</strong><button data-management-clear="' + esc(r.id) + '">撤销</button></div>'
        : '<div class="management-current pending"><span>等待管理层决策</span><strong>请选择动作</strong></div>';

      return '<article class="management-card ' + (selected ? "resolved" : "") + '">' +
        '<div class="management-card-head"><div><span class="status ' + (r.level === "高" ? "risk" : "doing") + '">' + esc(r.level) + '</span><strong>' + esc(r.object) + '</strong></div><span class="management-owner">Owner · ' + esc(r.owner) + '</span></div>' +
        '<p class="management-issue">' + esc(r.issue) + '</p>' +
        '<div class="management-ai"><b>AI 判断</b><span>' + esc(r.reason) + '</span></div>' +
        '<div class="management-choices">' + buttons + '</div>' +
        current +
      '</article>';
    }).join("");

    return panel("管理决策工作台", "每个问题必须收敛到 加资源 / 保持 / 纠偏 / 升级 / 停止 中的一个明确动作",
      '<div class="management-grid">' + cards + '</div>'
    );
  }

  function renderManagementHistory() {
    var items = (state.managementHistory || []).slice(0, 6).map(function (item) {
      var time = "";
      try { time = new Date(item.at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }); } catch (e) { time = ""; }
      return '<div class="decision-history-item"><time>' + esc(time) + '</time><div><strong>' + esc(item.object) + '</strong><span>' + esc(item.label) + ' · ' + esc(item.owner) + '</span></div><p>' + esc(item.reason) + '</p></div>';
    }).join("");
    if (!items) items = '<div class="empty-state"><strong>还没有管理决策</strong><span>在上方选择一个管理动作, 这里会形成经营决策记录.</span></div>';
    return panel("本周管理决策记录", "这些决策会反向改变医院资源、代表行动和 Pilot 指标",
      '<div class="decision-history">' + items + '</div>'
    );
  }

  function renderCockpit() {
    var pm = computePilotMetrics();
    var unresolved = Math.max(0, (data.risks || []).length - pm.resolved);
    var questions = [
      ["01", "哪 3 家医院本周最值得我关注?", "重点医院下一步动作"],
      ["02", "哪 5 个医生下一步最值得推进?", "关键医生下一步推进"],
      ["03", "哪些代表行动正在偏离策略?", "代表下一步行动状态"],
      ["04", "哪些拜访需要经理立即辅导?", "辅导下一步计划"],
      ["05", "我下一步要加资源、纠偏、升级还是停止什么?", "管理层下一步决策"]
    ].map(function (q, i) {
      return '<div class="question-card" data-cockpit="' + i + '"><div class="question-no">' + q[0] + '</div><h4>' + q[1] + '</h4><p>' + q[2] + '</p></div>';
    }).join("");

    var rows = (data.risks || []).map(function (r) {
      var decision = state.managementDecisions[r.id];
      return '<tr><td><span class="status ' + (r.level === "高" ? "risk" : "doing") + '">' + esc(r.level) + '</span></td><td><b>' + esc(r.object) + '</b></td><td>' + esc(r.issue) + '</td><td>' + esc(r.owner) + '</td><td>' +
        (decision ? '<span class="management-result ' + esc(decision) + '">' + esc(managementLabel(decision)) + '</span>' : '<button class="tiny-btn primary" data-risk="' + esc(r.object) + '">查看动作</button>') +
      '</td></tr>';
    }).join("");

    return '<div class="page-banner"><div><span class="banner-kicker">DIRECTOR DECISION COCKPIT</span><h2>不是看更多数据, 而是更快做管理决策</h2><p>所有视图都收敛到一件事: 哪些行动应该推进、纠偏、升级、停止或沉淀为组织打法.</p></div><div class="banner-side"><strong>' + unresolved + '</strong><span>仍待管理层决策</span></div></div>' +
      '<div class="cockpit-questions">' + questions + '</div>' +
      '<div class="metric-grid">' +
        metric("管理事项已决策", pm.resolved + "/4", "决策会回写到执行页面", pm.resolved ? "+" + pm.resolved : "", "决") +
        metric("NBA 采纳率", pm.nbaAdoption + "%", "管理动作会推动关键 NBA 进入执行", "+" + Math.max(0, pm.nbaAdoption - 76) + "%", "A") +
        metric("行动完成率", pm.actionCompletion + "%", "当前原型动作状态实时计算", pm.actionCompletion >= 75 ? "达标" : "需提升", "%") +
        metric("Review 覆盖率", pm.reviewCoverage + "%", "已决策事项进入周度复盘", "+" + Math.max(0, pm.reviewCoverage - 71) + "%", "审") +
      '</div>' +
      renderManagementWorkbench() +
      '<div class="mt-16">' +
        panel("执行风险与管理结果", "决策以后, 风险事项不再只停留在列表里",
          '<table class="risk-table"><thead><tr><th>风险</th><th>对象</th><th>为什么需要介入</th><th>Owner</th><th>管理动作</th></tr></thead><tbody>' + rows + '</tbody></table>'
        ) +
      '</div>' +
      '<div class="grid-equal mt-16">' +
        panel("区域资源策略", "管理动作会改变 Hospital Agent 的资源计划",
          '<div class="insight-card"><div class="insight-head"><strong>华东附一 MDT 场景</strong><span class="insight-tag">' + esc(state.managementDecisions.m1 ? managementLabel(state.managementDecisions.m1) : "待决策") + '</span></div><p>证据缺口是当前最高价值杠杆. 推荐增加场景化医学支持, 不增加泛化活动预算.</p></div>' +
          '<div class="insight-card"><div class="insight-head"><strong>海川大型活动筹备</strong><span class="insight-tag">' + esc(state.managementDecisions.m3 ? managementLabel(state.managementDecisions.m3) : "待决策") + '</span></div><p>决策链尚未清晰. 推荐先购买信息并完成影响者地图, 暂缓高成本活动.</p></div>'
        ) +
        panel("Action → Outcome", "管理层看到行动是否真正改变业务里程碑",
          '<div class="dimension-row"><span>行动完成</span><div class="bar"><i style="width:' + pm.actionCompletion + '%"></i></div><b>' + pm.actionCompletion + '%</b></div>' +
          '<div class="dimension-row"><span>NBA 采纳</span><div class="bar"><i style="width:' + pm.nbaAdoption + '%"></i></div><b>' + pm.nbaAdoption + '%</b></div>' +
          '<div class="dimension-row"><span>Outcome 转化</span><div class="bar"><i style="width:' + pm.outcomeRate + '%"></i></div><b>' + pm.outcomeRate + '%</b></div>' +
          '<div class="dimension-row"><span>扩展准备度</span><div class="bar"><i style="width:' + pm.scaleReadiness + '%"></i></div><b>' + pm.scaleReadiness + '%</b></div>'
        ) +
      '</div>' +
      '<div class="mt-16">' + renderManagementHistory() + '</div>';
  }

  function renderTeamPlaybookLearningSignal() {
    if (!state.teamPlaybook) return "";
    var rep = (data.teamCoaching && data.teamCoaching.reps || []).find(function(r){ return r.id === state.teamPlaybook.repId; });
    if (!rep) return "";
    var visit = data.visits.find(function(v){ return v.id === rep.visitId; }) || data.visits[0];
    return '<div class="team-playbook-signal"><div><span>TEAM PLAYBOOK CANDIDATE</span><strong>' + esc(rep.name) + ' · ' + esc(rep.strength) + '</strong><p>本周已由地区经理采纳为团队打法候选. 继续观察 2–3 次同类场景 Outcome 后, 再决定是否沉淀为 Decision Rule.</p></div><div class="team-playbook-chain"><b>Context</b><em>→</em><span>' + esc(visit.summary) + '</span><b>Action</b><em>→</em><span>' + esc(visit.nextScript) + '</span></div><button class="btn soft" data-route-jump="teamcoaching">返回团队辅导</button></div>';
  }

  function renderLearning() {
    var allRules = data.rules.concat(state.customRules || []);
    var validated = allRules.filter(function (r) { return r.status === "validated"; }).length;
    var testing = allRules.length - validated;
    var totalUses = allRules.reduce(function (sum, r) { return sum + Number(r.uses || 0); }, 0);
    var summary = state.domainSummary || {};
    var outcomeCount = Math.max(Number(summary.outcomes || 0), (state.outcomes || []).length);
    var decisionCount = Math.max(Number(summary.decisions || 0), (state.recentDecisions || []).length);

    var cards = allRules.map(function (r) {
      return '<div class="rule-card"><div class="rule-head"><span class="rule-id">' + esc(r.id) + '</span><span class="status ' + (r.status === "validated" ? "done" : "doing") + '">' + (r.status === "validated" ? "已验证" : "验证中") + '</span></div><h4>' + esc(r.title) + '</h4><div class="rule-chain"><div class="rule-cell"><b>CONTEXT</b><span>' + esc(r.context) + '</span></div><div class="rule-cell"><b>DECISION</b><span>' + esc(r.decision) + '</span></div><div class="rule-cell"><b>ACTION</b><span>' + esc(r.action) + '</span></div><div class="rule-cell"><b>OUTCOME</b><span>' + esc(r.outcome) + '</span></div></div><div class="rule-foot"><span class="confidence">置信度 <strong>' + r.confidence + '%</strong> · 已调用 ' + r.uses + ' 次</span><button class="tiny-btn" data-rule="' + r.id + '">查看证据</button></div></div>';
    }).join("");

    var decisionRows = (state.recentDecisions || []).slice(0, 8).map(function (d) {
      var nba = (state.recentNBAs || []).find(function (n) { return n.decisionId === d.id; });
      return '<tr><td><span class="status todo">' + esc(d.decisionType) + '</span></td><td><b>' + esc(d.priorityScore) + '</b></td><td>' + esc(d.rationale) + '</td><td>' + esc((d.ruleIds || []).join(", ") || "-") + '</td><td>' + (nba ? esc(nba.what) : "-") + '</td></tr>';
    }).join("");
    if (!decisionRows) decisionRows = '<tr><td colspan="5" class="muted">还没有 Decision Trace. 从 Hospital / Doctor / Coaching Agent 生成一次 NBA 即可产生.</td></tr>';

    var outcomeRows = (state.outcomes || []).slice(0, 8).map(function (o) {
      return '<tr><td><b>' + esc(o.result) + '</b></td><td>' + esc(o.signal) + '</td><td>' + esc(o.effectiveness) + '</td><td>' + esc(o.recordedBy || "-") + '</td></tr>';
    }).join("");
    if (!outcomeRows) outcomeRows = '<tr><td colspan="4" class="muted">暂无 Outcome. 生成 NBA 后点击“记录 Outcome”即可把真实业务信号回流.</td></tr>';

    var validationRows = (state.ruleValidations || []).slice(0, 10).map(function (v) {
      var canReview = v.status === "review_required";
      var actions = canReview
        ? '<button class="tiny-btn primary" data-rule-validation="' + esc(v.id) + '" data-review-action="approve">批准</button> <button class="tiny-btn" data-rule-validation="' + esc(v.id) + '" data-review-action="reject">驳回</button>'
        : '<span class="status ' + (v.status === "applied" || v.status === "approved" ? "done" : "doing") + '">' + esc(v.status) + '</span>';
      return '<tr><td><b>' + esc(v.ruleId) + '</b></td><td>' + esc(v.previousConfidence) + ' → ' + esc(v.proposedConfidence) + '</td><td>' + esc(v.evidenceDirection) + '</td><td>' + esc(v.effectiveness) + '</td><td>' + actions + '</td></tr>';
    }).join("");
    if (!validationRows) validationRows = '<tr><td colspan="5" class="muted">暂无 RuleValidation. Outcome 回流后系统会自动生成验证提案.</td></tr>';

    var pendingReview = (state.ruleValidations || []).filter(function (v) { return v.status === "review_required"; }).length;

    return '<div class="page-banner"><div><span class="banner-kicker">LEARNING ENGINE</span><h2>把冠军打法从个人经验变成组织资产</h2><p>每一个有效或无效的下一步行动, 都回流为 Context → Decision → NBA → Action → Outcome 证据, 持续更新 Decision Rules.</p></div><div class="banner-side"><strong>' + validated + '/' + allRules.length + '</strong><span>当前规则已验证</span></div></div>' +
      renderTeamPlaybookLearningSignal() +
      '<div class="learning-summary">' +
        metric("Decision Trace", String(decisionCount), "浏览器内模拟的结构化判断", "", "D") +
        metric("Outcome", String(outcomeCount), "真实业务信号回流", outcomeCount ? "+" + outcomeCount : "", "O") +
        metric("验证中 Rule", String(testing), "等待更多 Outcome 证据", "", "测") +
        metric("Rule 调用", String(totalUses), "进入 Decision Pipeline 的累计次数", "+" + totalUses, "R") +
      '</div>' +
      '<div class="grid-equal">' +
        panel("最近 Decision Trace", "ContextSnapshot → Decision → NBA → Rule",
          '<table class="risk-table"><thead><tr><th>类型</th><th>优先级</th><th>判断理由</th><th>Rules</th><th>NBA</th></tr></thead><tbody>' + decisionRows + '</tbody></table>',
          '<button class="tiny-btn" id="refreshDecisionTrace">刷新</button>'
        ) +
        panel("Outcome 回流", "Action 是否真正改变了客户行为或业务里程碑",
          '<table class="risk-table"><thead><tr><th>结果</th><th>业务信号</th><th>有效性</th><th>记录人</th></tr></thead><tbody>' + outcomeRows + '</tbody></table>'
        ) +
      '</div>' +
      '<div class="mt-16">' +
        panel("Rule Validation Queue", "Outcome 不直接改规则. 系统先形成置信度更新提案, 高风险项必须 Human Review",
          '<div class="flex-between" style="margin-bottom:10px"><span class="small-note">待人工审核: ' + pendingReview + '</span><span class="soft-chip">Human Review Gate</span></div><table class="risk-table"><thead><tr><th>Rule</th><th>Confidence</th><th>证据方向</th><th>Effectiveness</th><th>处理</th></tr></thead><tbody>' + validationRows + '</tbody></table>'
        ) +
      '</div>' +
      '<div class="mt-16">' +
        panel("Decision Rules", "AI 不只记住内容, 更沉淀情境下的判断规则",
          '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px" class="rule-grid">' + cards + '</div>',
          '<button class="btn soft" id="newRuleBtn">+ 新建 Rule</button>'
        ) +
      '</div>' +
      '<div class="grid-equal mt-16">' +
        panel("Learning Loop", "从真实结果反推下一轮判断",
          '<div class="flow-strip"><div class="flow-step active"><b>Context</b><span>事实 / 信号</span></div><div class="flow-step active"><b>Decision</b><span>规则 + 判断</span></div><div class="flow-step active"><b>NBA</b><span>下一步行动</span></div><div class="flow-step active"><b>Action</b><span>一线执行</span></div><div class="flow-step ' + (outcomeCount ? "active" : "") + '"><b>Outcome</b><span>真实结果</span></div><div class="flow-step ' + (outcomeCount ? "active" : "") + '"><b>Rule</b><span>验证 / 更新</span></div></div><div class="drawer-success mt-16"><span>→</span><span>Rule 不因为一次 AI 生成而自动“学会”. 必须有 Outcome 证据, 并在关键规则发布前保留 Human Review.</span></div>'
        ) +
        panel("Rule 更新原则", "专业判断、证据与合规门槛不能被模型绕过",
          '<div class="insight-card"><div class="insight-head"><strong>FACT</strong><span class="insight-tag">可追溯</span></div><p>真实行动、医生反馈、业务里程碑、知识证据.</p></div><div class="insight-card"><div class="insight-head"><strong>INFERENCE</strong><span class="insight-tag">需验证</span></div><p>Agent 对情境、优先级、因果关系的推断必须带置信度和验证计划.</p></div><div class="insight-card"><div class="insight-head"><strong>HUMAN REVIEW</strong><span class="insight-tag">关键门槛</span></div><p>高风险 NBA、医学边界和规则正式发布必须经过授权角色审核.</p></div>'
        ) +
      '</div>';
  }

  function renderManagementSignal(items, contextLabel) {
    if (!items || !items.length) return "";
    var html = items.map(function (item) {
      var meta = MANAGEMENT_ACTIONS[item.decision] || {};
      return '<div class="management-signal ' + esc(meta.tone || '') + '"><div><span>DIRECTOR DECISION · ' + esc(contextLabel || "管理层") + '</span><strong>' + esc(managementLabel(item.decision)) + ' · ' + esc(item.risk.object) + '</strong><p>' + esc(item.risk.action) + '</p></div><button class="tiny-btn" data-route-jump="cockpit">查看总监决策</button></div>';
    }).join("");
    return '<div class="management-signal-wrap">' + html + '</div>';
  }

  function managementForDoctor(doc) {
    var ids = [];
    if (doc.id === "d1") ids = ["m1"];
    if (doc.id === "d2") ids = ["m2"];
    if (doc.id === "d3") ids = ["m4"];
    return ids.filter(function (id) { return state.managementDecisions[id]; }).map(function (id) {
      return { risk: data.risks.find(function (r) { return r.id === id; }), decision: state.managementDecisions[id] };
    }).filter(function (x) { return x.risk; });
  }

  function renderPatientFlow(h) {
    var flow = (h.patientFlow || []).map(function (step, i) {
      var width = Math.max(10, Number(step.rate || 0));
      var cls = step.status === "risk" ? "risk" : (step.status === "watch" ? "watch" : "stable");
      return '<button class="patient-flow-step ' + cls + '" data-patient-flow="' + i + '">' +
        '<div class="patient-flow-head"><span>' + esc(step.stage) + '</span><strong>' + esc(step.volume) + '</strong></div>' +
        '<div class="patient-flow-bar"><i style="width:' + width + '%"></i></div>' +
        '<div class="patient-flow-foot"><b>' + esc(step.rate) + '%</b><span>' + esc(step.note) + '</span></div>' +
      '</button>';
    }).join('<div class="patient-flow-arrow">→</div>');

    return panel("患者流与关键流失点", "从目标患者到持续管理, 直接定位最值得改变的环节",
      '<div class="patient-flow">' + flow + '</div>' +
      '<div class="flow-diagnosis"><span>AI 判断</span><strong>' + esc(h.levers[0].title) + '</strong><p>' + esc(h.levers[0].why) + '</p><button class="btn soft" data-ai-generate="hospital">基于流失点重新生成 NBA</button></div>'
    );
  }

  function renderResourcePlan(h) {
    var decisions = managementForHospital(h.id);
    var decisionBanner = decisions.length ? decisions.map(function (item) {
      var meta = MANAGEMENT_ACTIONS[item.decision] || {};
      return '<div class="management-inline ' + esc(meta.tone || '') + '"><span>销售总监已决策</span><strong>' + esc(managementLabel(item.decision)) + '</strong><p>' + esc(item.risk.action) + '</p></div>';
    }).join("") : "";

    var rows = (h.resources || []).map(function (r, i) {
      var currentStatus = resourceStatus(h.id, r);
      var statusClass = currentStatus === "ready" ? "done" : (currentStatus === "doing" ? "doing" : (currentStatus === "hold" ? "risk" : "todo"));
      var statusText = { ready: "已就绪", doing: "执行中", planned: "计划中", hold: "暂缓" }[currentStatus] || currentStatus;
      return '<tr data-resource-row="' + i + '"><td><span class="resource-type">' + esc(r.type) + '</span></td><td><b>' + esc(r.item) + '</b></td><td>' + esc(r.owner) + '</td><td>' + esc(r.timing) + '</td><td><span class="soft-chip">' + esc(r.lever) + '</span></td><td><button class="status ' + statusClass + '" data-resource-toggle="' + i + '">' + esc(statusText) + '</button></td></tr>';
    }).join("");

    return panel("资源配置计划", "每一份资源都必须映射到具体杠杆点, 而不是平均铺开",
      decisionBanner +
      '<table class="risk-table resource-table"><thead><tr><th>资源</th><th>动作</th><th>Owner</th><th>时间</th><th>对应杠杆</th><th>状态</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="resource-summary"><div><span>本周资源策略</span><strong>' + (h.id === "h3" ? "先买信息, 暂缓重投入" : "聚焦 Top 1-2 杠杆, 资源不平均分配") + '</strong></div><button class="btn primary" data-resource-review>生成经理 Review</button></div>'
    );
  }

  function openPatientFlowDetail(index) {
    var h = data.hospitals.find(function (x) { return x.id === state.selectedHospital; }) || data.hospitals[0];
    var step = h.patientFlow && h.patientFlow[index];
    if (!step) return;
    var next = h.patientFlow[index + 1];
    var loss = next ? Math.max(0, Number(step.volume) - Number(next.volume)) : 0;
    var body =
      '<div class="drawer-section"><h4>患者旅程节点</h4><div class="drawer-callout"><strong>' + esc(step.stage) + ' · ' + esc(step.volume) + '</strong><p>' + esc(step.note) + '</p></div></div>' +
      '<div class="drawer-section"><h4>流失判断</h4><div class="drawer-meta"><div class="meta-cell"><b>当前转化</b><span>' + esc(step.rate) + '%</span></div><div class="meta-cell"><b>下一节点流失</b><span>' + esc(loss) + ' 人</span></div></div></div>' +
      '<div class="drawer-section"><h4>下一步该做什么</h4><div class="drawer-success"><span>→</span><span>' + esc(index <= 1 ? h.levers[1].what : h.levers[0].what) + '</span></div></div>';
    openDrawer(step.stage, body, null);
  }

  function openStakeholderDetail(index) {
    var h = data.hospitals.find(function (x) { return x.id === state.selectedHospital; }) || data.hospitals[0];
    var s = h.stakeholders && h.stakeholders[index];
    if (!s) return;
    var body =
      '<div class="drawer-section"><h4>关键关系人</h4><div class="drawer-callout"><strong>' + esc(s.name) + ' · ' + esc(s.role) + '</strong><p>当前关系状态: ' + esc(s.relation) + '</p></div></div>' +
      '<div class="drawer-section"><h4>影响与支持</h4><div class="drawer-meta"><div class="meta-cell"><b>影响力</b><span>' + esc(s.influence) + ' / 100</span></div><div class="meta-cell"><b>支持度</b><span>' + esc(s.support) + ' / 100</span></div></div></div>' +
      '<div class="drawer-section"><h4>推荐动作</h4><div class="drawer-success"><span>→</span><span>' + esc(s.action) + '</span></div></div>';
    openDrawer(s.name, body, null);
  }

  function renderHospitalEcology(h) {
    var positions = [
      { left: 26, top: 24 },
      { left: 75, top: 24 },
      { left: 80, top: 70 },
      { left: 22, top: 72 },
      { left: 50, top: 16 }
    ];
    var centerX = 50, centerY = 50;
    var lines = "";
    var nodes = (h.stakeholders || []).map(function (s, i) {
      var p = positions[i] || { left: 50 + ((i % 2) ? 25 : -25), top: 20 + (i * 13) % 60 };
      var dx = p.left - centerX;
      var dy = p.top - centerY;
      var len = Math.sqrt(dx * dx + dy * dy);
      var angle = Math.atan2(dy, dx) * 180 / Math.PI;
      lines += '<div class="eco-line" style="left:' + centerX + '%;top:' + centerY + '%;width:' + len + '%;transform:rotate(' + angle + 'deg)"></div>';
      var cls = s.influence >= 85 ? "key" : "";
      return '<button class="eco-node ' + cls + '" style="left:' + p.left + '%;top:' + p.top + '%" data-stakeholder="' + i + '"><strong>' + esc(s.name) + '</strong><span>' + esc(s.role) + '</span><small>影响 ' + esc(s.influence) + ' · 支持 ' + esc(s.support) + '</small></button>';
    }).join("");

    var map =
      '<div class="ecology-map">' +
        lines +
        '<button class="eco-node primary" style="left:50%;top:50%"><strong>' + esc(h.name) + '</strong><span>' + esc(h.department) + '</span><small>当前作战中心</small></button>' +
        nodes +
      '</div>' +
      '<div class="eco-legend"><span><i class="a"></i>作战中心</span><span><i class="b"></i>高影响角色</span><span><i class="c"></i>协同角色</span><span>点击节点查看关系、支持度和推荐动作</span></div>';
    return panel("医院生态关系图", "不只看名单, 还要看影响力、支持度和下一步动作", map);
  }

  function renderPreVisitWorkspace(doc) {
    var p = doc.preVisit || {};
    var checklist = (p.checklist || []).map(function (item, i) {
      var checked = state.prepStatus && state.prepStatus[doc.id] && state.prepStatus[doc.id][i];
      return '<button class="prep-check ' + (checked ? 'done' : '') + '" data-prep-check="' + i + '"><span class="prep-box">' + (checked ? '✓' : '') + '</span><span>' + esc(item) + '</span></button>';
    }).join("");
    var questions = (p.questions || []).map(function (q) { return '<li>' + esc(q) + '</li>'; }).join("");
    var objections = (p.objections || []).map(function (q) { return '<li>' + esc(q) + '</li>'; }).join("");

    return panel("拜访前准备工作台", "5 分钟把“资料很多”收敛成这一次拜访唯一目标",
      '<div class="previsit-hero"><div><span>THIS VISIT OBJECTIVE</span><strong>' + esc(p.objective || doc.targetBehavior) + '</strong></div><button class="btn primary" data-ai-generate="doctor">AI 检查准备质量</button></div>' +
      '<div class="previsit-grid">' +
        '<div class="previsit-card"><span>开场策略</span><p>' + esc(p.opening || "") + '</p></div>' +
        '<div class="previsit-card"><span>结束承诺</span><p>' + esc(p.commitment || "") + '</p></div>' +
        '<div class="previsit-card list"><span>优先探询</span><ol>' + questions + '</ol></div>' +
        '<div class="previsit-card list"><span>预判异议</span><ol>' + objections + '</ol></div>' +
      '</div>' +
      '<div class="prep-checklist"><div class="flex-between"><strong>拜访前检查清单</strong><span class="small-note">点击模拟完成准备</span></div><div class="prep-check-grid">' + checklist + '</div></div>'
    );
  }

  function renderDoctorJourney(doc) {
    var journey =
      '<div class="journey-line">' +
        '<div class="journey-step done"><div class="journey-dot">01</div><div><b>患者识别</b><span>已建立共同语言</span></div></div>' +
        '<div class="journey-step done"><div class="journey-dot">02</div><div><b>诊断判断</b><span>证据接受度较高</span></div></div>' +
        '<div class="journey-step active"><div class="journey-dot">03</div><div><b>方案选择</b><span>' + esc(doc.stage) + '</span></div></div>' +
        '<div class="journey-step"><div class="journey-dot">04</div><div><b>治疗执行</b><span>等待行为承诺</span></div></div>' +
        '<div class="journey-step"><div class="journey-dot">05</div><div><b>随访管理</b><span>未来追踪</span></div></div>' +
      '</div>' +
      '<div class="touchpoint-list mt-16">' +
        '<div class="touchpoint"><time>09.18</time><div><strong>学术沟通</strong><p>医生明确提出“患者到底怎么选”的疑问, 形成新的触发信号.</p></div><span class="status doing">关键</span></div>' +
        '<div class="touchpoint"><time>09.11</time><div><strong>资料跟进</strong><p>指南和真实世界数据已阅读, 但尚未绑定具体患者场景.</p></div><span class="status done">完成</span></div>' +
        '<div class="touchpoint"><time>08.28</time><div><strong>首次深度拜访</strong><p>确认其主要关注长期获益与安全性平衡.</p></div><span class="status done">完成</span></div>' +
      '</div>';
    return panel("医生决策旅程", "把互动历史放回医生真实决策路径, 识别最值得切入的时机", journey,
      '<button class="btn soft" data-ai-generate="doctor">AI 重新判断下一步</button>');
  }

  function renderVoiceReview(v) {
    var body =
      '<label class="upload-zone" for="visitAudio">' +
        '<input id="visitAudio" type="file" accept="audio/*,.m4a,.mp3,.wav">' +
        '<div class="upload-icon">REC</div><strong>上传拜访录音 / 语音复盘</strong><span>支持 m4a、mp3、wav. 原型会模拟转写、关键片段识别与辅导诊断.</span>' +
      '</label>' +
      '<div class="flex-between mt-12"><span class="small-note">当前对象: ' + esc(v.rep) + ' → ' + esc(v.doctor) + '</span><button class="tiny-btn" id="demoVoiceBtn">使用演示录音</button></div>';
    return panel("语音复盘入口", "说完即记录 → 转写 → 结构化诊断 → 生成下一次行动", body);
  }

  function renderPilot() {
    var pm = computePilotMetrics();
    var currentWeek = Math.max(1, Math.min(8, Number(state.pilotWeek || 4)));
    var weekDefs = [["W1","启动"],["W2","诊断"],["W3","运行"],["W4","运行"],["W5","运行"],["W6","运行"],["W7","复盘"],["W8","扩展"]];
    var weeks = weekDefs.map(function (w, i) {
      var no = i + 1;
      var cls = no < currentWeek ? "done" : (no === currentWeek ? "active" : "");
      return '<button class="week-item ' + cls + '" data-pilot-week="' + no + '"><b>' + w[0] + '</b><span>' + w[1] + '</span></button>';
    }).join("");

    var gate = function (value, target, suffix) {
      var ok = value >= target;
      return '<span class="health-pill ' + (ok ? '' : 'warn') + '">' + (ok ? "达标" : "需提升") + '</span>';
    };

    var table =
      '<table class="pilot-table"><thead><tr><th>验证目标</th><th>当前</th><th>8 周目标</th><th>状态</th></tr></thead><tbody>' +
      '<tr><td>经理周活跃率</td><td>' + pm.weeklyActive + '%</td><td>≥ 80%</td><td>' + gate(pm.weeklyActive,80) + '</td></tr>' +
      '<tr><td>NBA 采纳率</td><td>' + pm.nbaAdoption + '%</td><td>≥ 70%</td><td>' + gate(pm.nbaAdoption,70) + '</td></tr>' +
      '<tr><td>行动完成率</td><td>' + pm.actionCompletion + '%</td><td>≥ 75%</td><td>' + gate(pm.actionCompletion,75) + '</td></tr>' +
      '<tr><td>Review 覆盖率</td><td>' + pm.reviewCoverage + '%</td><td>≥ 70%</td><td>' + gate(pm.reviewCoverage,70) + '</td></tr>' +
      '<tr><td>Rule 有效复用</td><td>' + pm.ruleReuse + ' 条</td><td>≥ 8 条</td><td>' + gate(pm.ruleReuse,8) + '</td></tr>' +
      '</tbody></table>';

    var nbaCount = 96 + (state.recentNBAs || []).length;
    var adoptedCount = 73 + (state.serverActions || []).length + pm.resolved;
    var executedCount = 65 + pm.resolved + (state.serverActions || []).filter(function (a) { return a.status === "done"; }).length;
    var outcomeCount = 41 + (state.outcomes || []).length;

    var history = (state.managementHistory || []).slice(0, 4).map(function (item) {
      return '<div class="pilot-decision"><span>' + esc(item.label) + '</span><strong>' + esc(item.object) + '</strong><p>' + esc(item.reason) + '</p></div>';
    }).join("");
    if (!history) history = '<div class="empty-state"><strong>还没有经营决策回流</strong><span>去总监驾驶舱做出管理动作, 这里的 Pilot 指标会随之变化.</span></div>';

    return '<div class="page-banner"><div><span class="banner-kicker">8-WEEK PAID PILOT</span><h2>不是“上线一个 AI”, 而是验证一套行动系统</h2><p>同时验证 Market Proof 与 Product Proof: 客户愿意付费、经理愿意使用、行动能被追踪、结果能回流、规则能学习.</p></div><div class="banner-side"><strong>W' + currentWeek + '</strong><span>当前模拟周</span></div></div>' +
      '<div class="pilot-week-head"><div><span class="eyebrow">PILOT TIMELINE</span><strong>点击周次可模拟 Pilot 推进</strong></div><div class="pilot-week-actions"><button class="btn ghost" data-pilot-prev ' + (currentWeek === 1 ? 'disabled' : '') + '>上一周</button><button class="btn primary" data-pilot-next ' + (currentWeek === 8 ? 'disabled' : '') + '>推进到下一周</button></div></div>' +
      '<div class="week-track">' + weeks + '</div>' +
      '<div class="metric-grid mt-16">' +
        metric("管理事项已决策", pm.resolved + "/4", "管理决策直接影响 Pilot 验证", pm.resolved ? "+" + pm.resolved : "", "决") +
        metric("NBA 采纳率", pm.nbaAdoption + "%", "从生成建议到被一线采纳", "+" + Math.max(0,pm.nbaAdoption-76) + "%", "A") +
        metric("Outcome 转化", pm.outcomeRate + "%", "Action 以后产生真实业务信号", pm.outcomes ? "+" + pm.outcomes : "", "O") +
        metric("Scale Readiness", pm.scaleReadiness + "%", "是否具备扩区与扩 Agent 条件", "+" + Math.max(0,pm.scaleReadiness-63) + "%", "扩") +
      '</div>' +
      '<div class="pilot-grid">' +
        panel("价值漏斗", "从“AI 给建议”一直追到业务结果",
          '<div class="funnel"><div class="funnel-step"><strong>' + nbaCount + '</strong><span>NBA 生成</span><b>100%</b></div><div class="funnel-step"><strong>' + adoptedCount + '</strong><span>被一线采纳</span><b>' + pm.nbaAdoption + '%</b></div><div class="funnel-step"><strong>' + executedCount + '</strong><span>形成执行</span><b>' + pm.actionCompletion + '%</b></div><div class="funnel-step"><strong>' + outcomeCount + '</strong><span>产生 Outcome</span><b>' + pm.outcomeRate + '%</b></div></div><div class="divider"></div><p class="small-note">重点不是追求生成量, 而是持续提高 NBA → Action → Outcome 的转化质量.</p>'
        ) +
        panel("Pilot Gate", "W8 是否扩展由这些可量化证据决定", table) +
      '</div>' +
      '<div class="grid-equal mt-16">' +
        panel("Market Proof / Product Proof", "销售项目和产品使用必须同时成立",
          '<div class="proof-grid"><div class="proof-card"><span>MARKET PROOF</span><strong>' + pm.marketProof + '%</strong><p>付费意愿、经理参与、业务问题足够刚性.</p><div class="bar"><i style="width:' + pm.marketProof + '%"></i></div></div><div class="proof-card"><span>PRODUCT PROOF</span><strong>' + pm.productProof + '%</strong><p>NBA 被采纳、Action 被执行、Outcome 能回流.</p><div class="bar"><i style="width:' + pm.productProof + '%"></i></div></div></div>'
        ) +
        panel("扩展准备度", "Land → Prove → Expand → Operate",
          '<div class="dimension-row"><span>Market Proof</span><div class="bar"><i style="width:' + pm.marketProof + '%"></i></div><b>' + pm.marketProof + '%</b></div><div class="dimension-row"><span>Product Proof</span><div class="bar"><i style="width:' + pm.productProof + '%"></i></div><b>' + pm.productProof + '%</b></div><div class="dimension-row"><span>Data Readiness</span><div class="bar"><i style="width:' + pm.dataReadiness + '%"></i></div><b>' + pm.dataReadiness + '%</b></div><div class="dimension-row"><span>Scale Readiness</span><div class="bar"><i style="width:' + pm.scaleReadiness + '%"></i></div><b>' + pm.scaleReadiness + '%</b></div><button class="btn primary full mt-12" data-ai-generate="cockpit">生成本周 Pilot 决策简报</button>'
        ) +
      '</div>' +
      '<div class="grid-equal mt-16">' +
        panel("本周经营决策回流", "总监驾驶舱做出的动作会在这里进入 Pilot 运营复盘", '<div class="pilot-decisions">' + history + '</div>') +
        panel("GPS Operations", "每周不是看报表, 而是持续跑同一个学习循环",
          '<div class="timeline"><div class="timeline-item done"><span class="timeline-dot"></span><b>周一 · 更新 Context</b><span>医院、医生、事件和资源约束更新.</span></div><div class="timeline-item ' + (currentWeek >= 4 ? 'done' : '') + '"><span class="timeline-dot"></span><b>周三 · Action Review</b><span>检查高优先 NBA 是否真正进入执行.</span></div><div class="timeline-item ' + (pm.outcomes ? 'done' : '') + '"><span class="timeline-dot"></span><b>周五 · Outcome & Rule Review</b><span>复盘有效/无效判断, 更新候选规则.</span></div></div>'
        ) +
      '</div>';
  }

  function startAIGeneration(type) {
    var titleMap = { hospital: "医院作战 AI 生成", doctor: "医生下一步 AI 生成", coaching: "拜访辅导 AI 生成", cockpit: "管理决策 AI 生成" };
    var targetId = type === "hospital" ? state.selectedHospital :
      (type === "doctor" ? state.selectedDoctor :
      (type === "coaching" ? state.selectedVisit : "national"));
    var context = {
      route: state.route,
      role: state.role,
      actor: state.session && state.session.name,
      targetId: targetId,
      hospitalId: state.selectedHospital,
      doctorId: state.selectedDoctor,
      visitId: state.selectedVisit
    };
    var body =
      '<div class="ai-stream"><div class="ai-stream-head"><strong>Decision Engine 正在生成</strong><span class="stream-status"><i class="stream-dot"></i>Streaming</span></div><p id="streamText"></p><div class="ai-stream-actions"><button class="btn ghost" id="recordGeneratedOutcome" style="display:none">记录 Outcome</button><button class="btn primary" id="adoptGenerated" disabled>采纳为下一步行动</button></div></div>' +
      '<div id="decisionTraceSlot"></div>' +
      '<div class="drawer-section mt-16"><h4>生成依据</h4><p class="small-note">Context Builder → Decision Rules → Decision → NBA. 前端原型会在浏览器内保存完整 Decision Trace 与交互状态, 不依赖后端服务.</p></div>';
    openDrawer(titleMap[type] || "AI 生成", body, null);
    var target = $("#streamText");
    var adopt = $("#adoptGenerated");

    window.ZG_API.generateNBA(type, context, function (token, done) {
      if (target) target.textContent += token;
      if (done && adopt) {
        adopt.disabled = false;
        var status = $(".stream-status");
        if (status) status.innerHTML = "✓ 生成完成";
      }
    }).then(function (result) {
      if (!result) return;

      var acceptedAction = null;

      if (result.decision && result.nba) {
        state.recentDecisions.unshift(result.decision);
        state.recentNBAs.unshift(result.nba);
        state.recentDecisions = state.recentDecisions.slice(0, 20);
        state.recentNBAs = state.recentNBAs.slice(0, 20);

        var rules = (result.rules || []).map(function (r) {
          return '<span class="profile-tag">' + esc(r.id) + ' · ' + esc(r.title) + '</span>';
        }).join("");
        var trace = $("#decisionTraceSlot");
        if (trace) {
          trace.innerHTML =
            '<div class="drawer-section mt-16"><h4>DECISION TRACE</h4>' +
            '<div class="drawer-meta"><div class="meta-cell"><b>Context</b><span>' + esc(result.context.targetType) + ':' + esc(result.context.targetId) + '</span></div>' +
            '<div class="meta-cell"><b>Priority</b><span>' + esc(result.decision.priorityScore) + ' / 100</span></div>' +
            '<div class="meta-cell"><b>Risk</b><span>' + esc(result.decision.riskLevel) + '</span></div>' +
            '<div class="meta-cell"><b>Human Review</b><span>' + (result.decision.humanReviewRequired ? 'Required' : 'Not required') + '</span></div></div>' +
            '<div class="nba-grid mt-12"><div class="nba-item"><b>WHO</b><span>' + esc(result.nba.who) + '</span></div><div class="nba-item"><b>WHEN</b><span>' + esc(result.nba.when) + '</span></div><div class="nba-item"><b>WHAT</b><span>' + esc(result.nba.what) + '</span></div><div class="nba-item"><b>WHY</b><span>' + esc(result.nba.why) + '</span></div><div class="nba-item"><b>SUCCESS</b><span>' + esc(result.nba.success) + '</span></div></div>' +
            '<div class="profile-tags mt-12">' + rules + '</div></div>';
        }
        var outcomeBtn = $("#recordGeneratedOutcome");
        if (outcomeBtn) {
          outcomeBtn.addEventListener("click", function () { openOutcomeRecorder(result.nba, acceptedAction); });
        }
      }

      if (adopt) adopt.addEventListener("click", async function () {
        if (!result.nba) {
          closeDrawer();
          return;
        }
        adopt.disabled = true;
        adopt.textContent = "正在创建 Action...";
        var accepted = await window.ZG_API.acceptNBA(result.nba.id, {
          actor: state.session && state.session.name,
          priority: result.decision && result.decision.priorityScore >= 85 ? 1 : 2
        });
        acceptedAction = accepted && accepted.action ? accepted.action : null;
        if (acceptedAction) {
          state.serverActions.unshift(acceptedAction);
          state.actionStatus[acceptedAction.id] = acceptedAction.status || "todo";
          saveState();
        }
        adopt.textContent = accepted && accepted.existing ? "Action 已存在" : "已创建 Action";
        showToast("NBA 已采纳并生成原型 Action");
        var outcomeBtn = $("#recordGeneratedOutcome");
        if (outcomeBtn) outcomeBtn.style.display = "inline-flex";
      });
    });
  }

  function openOutcomeRecorder(nba, action) {
    if (!nba || !nba.id) {
      showToast("当前原型状态异常, 未生成 NBA ID");
      return;
    }
    var body =
      '<div class="rule-form"><div class="drawer-callout"><strong>' + esc(nba.what) + '</strong><p>Success Signal: ' + esc(nba.success) + '</p></div>' +
      '<div class="rule-form-grid"><div><label>执行结果</label><select id="outcomeResult"><option>已达成</option><option>部分达成</option><option>未达成</option><option>条件变化</option></select></div><div><label>有效性 0-100</label><input id="outcomeEffectiveness" type="number" min="0" max="100" value="80"></div></div>' +
      '<div><label>实际业务信号</label><textarea id="outcomeSignal" placeholder="例如: 周主任同意在周三 MDT 讨论 1 例匹配患者"></textarea></div>' +
      '<div><label>证据 / 反馈</label><textarea id="outcomeEvidence" placeholder="记录医生反馈、会议结果、病例推进或其他可验证证据"></textarea></div>' +
      '<div class="rule-actions"><button class="btn ghost" id="cancelOutcome">取消</button><button class="btn primary" id="saveOutcome">写入 Outcome</button></div></div>';
    openDrawer("记录 Action Outcome", body, null);
    $("#cancelOutcome").addEventListener("click", closeDrawer);
    $("#saveOutcome").addEventListener("click", async function () {
      var signal = $("#outcomeSignal").value.trim();
      if (!signal) { showToast("请填写实际业务信号"); return; }
      var result = await window.ZG_API.recordOutcome({
        nbaId: nba.id,
        actionId: action && action.id ? action.id : null,
        result: $("#outcomeResult").value,
        signal: signal,
        evidence: $("#outcomeEvidence").value.trim(),
        effectiveness: Number($("#outcomeEffectiveness").value || 50),
        actor: state.session && state.session.name
      });
      if (result && result.outcome) state.outcomes.unshift(result.outcome);
      if (result && result.ruleValidations) {
        state.ruleValidations = result.ruleValidations.concat(state.ruleValidations || []);
      }
      closeDrawer();
      showToast("Outcome 已回流原型 Learning Engine");
      refreshDecisionData();
    });
  }

  async function refreshDecisionData() {
    var trace = await window.ZG_API.getDecisions();
    state.recentDecisions = trace.decisions || [];
    state.recentNBAs = trace.nbas || [];
    var outcomeResult = await window.ZG_API.getOutcomes();
    state.outcomes = outcomeResult.outcomes || [];
    var actionResult = await window.ZG_API.getActions();
    state.serverActions = actionResult.actions || [];
    var validationResult = await window.ZG_API.getRuleValidations();
    state.ruleValidations = validationResult.ruleValidations || [];
    if (state.route === "learning") render();
  }

  function openRuleEditor() {
    var body =
      '<div class="rule-form">' +
        '<div class="rule-form-grid"><div><label>Rule 标题</label><input id="ruleTitle" placeholder="例如: 先确认决策标准再呈现证据"></div><div><label>初始置信度</label><input id="ruleConfidence" type="number" min="0" max="100" value="60"></div></div>' +
        '<div><label>CONTEXT</label><textarea id="ruleContext" placeholder="什么情境下成立"></textarea></div>' +
        '<div><label>DECISION</label><textarea id="ruleDecision" placeholder="应该做出什么判断"></textarea></div>' +
        '<div><label>ACTION</label><textarea id="ruleAction" placeholder="对应什么动作"></textarea></div>' +
        '<div><label>OUTCOME</label><textarea id="ruleOutcome" placeholder="用什么结果验证"></textarea></div>' +
        '<div class="rule-actions"><button class="btn ghost" id="cancelRule">取消</button><button class="btn primary" id="saveRule">保存为验证中 Rule</button></div>' +
      '</div>';
    openDrawer("新建 Decision Rule", body, null);
    $("#cancelRule").addEventListener("click", closeDrawer);
    $("#saveRule").addEventListener("click", async function () {
      var title = $("#ruleTitle").value.trim();
      if (!title) { showToast("请填写 Rule 标题"); return; }
      var result = await window.ZG_API.saveRule({
        title: title,
        context: $("#ruleContext").value.trim() || "待补充 Context",
        decision: $("#ruleDecision").value.trim() || "待验证 Decision",
        action: $("#ruleAction").value.trim() || "待验证 Action",
        outcome: $("#ruleOutcome").value.trim() || "等待 Outcome",
        confidence: $("#ruleConfidence").value,
        status: "testing",
        uses: 0
      });
      state.customRules.unshift(result.rule);
      saveState();
      closeDrawer();
      render();
      showToast("新 Rule 已进入验证队列");
    });
  }

  async function processVisitAudio(file, inlineMode) {
    showToast("正在转写并识别关键片段");
    var result = await window.ZG_API.transcribeVisit(file || { name: "demo-visit.m4a" });
    var v = data.visits.find(function (x) { return x.id === state.selectedVisit; }) || data.visits[0];

    result.diagnosis.topIssue = v.issue;
    result.diagnosis.score = v.score;
    result.diagnosis.evidence = v.summary;
    result.diagnosis.nextAction = v.nextScript;

    if (v.id === "v2") {
      result.transcript = [
        { speaker: "代表", time: "00:22", text: "陈医生, 上次您问到边界患者, 我把几个病例放到了一起." },
        { speaker: "医生", time: "04:18", text: "这几个病例挺有意思的, 我回头再看看." },
        { speaker: "代表", time: "07:36", text: "好的, 那您有空再看看, 我下次再来." }
      ];
    } else if (v.id === "v3") {
      result.transcript = [
        { speaker: "代表", time: "00:31", text: "王主任, 贵科真正的机会可能是把患者识别流程先统一起来." },
        { speaker: "医生", time: "03:52", text: "这个问题确实一直存在, 你说的病例讨论方式可以试试." },
        { speaker: "代表", time: "07:10", text: "那我们下周用 20 分钟, 先拿三个病例把标准跑一遍." }
      ];
    }

    state.audioReviews[v.id] = result;
    var review = coachingReviewSession(v.id);
    review.generated = true;
    saveState();

    if (inlineMode) {
      render();
      showToast("3 分钟复盘已生成");
      return result;
    }

    var transcript = result.transcript.map(function (x) {
      return '<div class="transcript-item"><span class="speaker">' + esc(x.speaker) + '</span><time>' + esc(x.time) + '</time><p>' + esc(x.text) + '</p></div>';
    }).join("");
    var body =
      '<div class="drawer-section"><h4>自动转写 · ' + esc(result.duration) + '</h4><div class="transcript-list">' + transcript + '</div></div>' +
      '<div class="drawer-section"><h4>AI 诊断</h4><div class="drawer-callout"><strong>' + esc(result.diagnosis.topIssue) + ' · ' + result.diagnosis.score + ' 分</strong><p>' + esc(result.diagnosis.evidence) + '</p></div></div>' +
      '<div class="drawer-success"><span>→</span><span>' + esc(result.diagnosis.nextAction) + '</span></div>';
    openDrawer("语音复盘结果", body, null);
    return result;
  }

  function ensureLogin() {
    if (state.session) return;
    var wrap = document.createElement("div");
    wrap.className = "login-screen";
    wrap.id = "loginScreen";
    wrap.innerHTML =
      '<div class="login-card"><section class="login-intro"><div class="brand-mark">ZG</div><span class="eyebrow" style="color:#9db4ef">PHARMA SALES AI GPS</span><h1>让每一次销售判断<br>落到下一步行动</h1><p>连接医院策略、医生行动、拜访辅导与管理决策, 用 Action → Outcome → Learning 把经验变成组织能力.</p><div class="login-flow"><div><b>01 CONTEXT</b><span>看清机会</span></div><div><b>02 NBA</b><span>做对下一步</span></div><div><b>03 LEARNING</b><span>越做越准</span></div></div></section><section class="login-form"><span class="eyebrow">DEMO WORKSPACE</span><h2>进入客户拜访演示环境</h2><p>使用脱敏数据体验完整的 System of Action 闭环.</p><div class="login-field"><label>姓名</label><input id="loginName" value="李明"></div><div class="login-field"><label>角色</label><select id="loginRole"><option>地区经理</option><option>医药代表</option><option>销售总监</option></select></div><button class="btn primary full" id="loginSubmit">进入 AI GPS</button><span class="login-hint">演示环境不会连接真实客户数据. 登录信息仅保存在当前浏览器 localStorage.</span></section></div>';
    document.body.appendChild(wrap);
    $("#loginSubmit").addEventListener("click", function () {
      var role = $("#loginRole").value;
      state.role = role;
      state.session = { name: $("#loginName").value.trim() || "演示用户", role: role, loginAt: new Date().toISOString() };
      if (role === "销售总监") state.route = "cockpit";
      else if (role === "医药代表") state.route = "rep";
      else state.route = "dashboard";
      saveState();
      wrap.classList.add("hidden");
      render();
      showToast("欢迎进入 " + role + " 工作视角");
      window.ZG_API.createSession(state.session).then(function (result) {
        if (result && result.session && !result.offline) {
          state.session = result.session;
          saveState();
        }
      });
    });
  }


  function renderAdmin() {
    var org = state.org || { organization: { name: "ZG AI GPS Demo", regions: [] }, users: [], roles: [] };
    var regions = (org.organization.regions || []).map(function (r) {
      return '<div class="metric-card"><div class="metric-top"><span>' + esc(r.name) + '</span><span class="metric-icon">区</span></div><div class="metric-value">' + esc(r.hospitals) + '</div><div class="metric-foot"><span>' + esc(r.manager) + '</span><span> · ' + esc(r.reps) + ' 名代表</span></div></div>';
    }).join("");
    if (!regions) {
      regions = '<div class="empty-state"><strong>正在加载组织数据</strong><span>纯前端原型中仍可使用完整 Agent 演示数据.</span></div>';
    }

    var users = (org.users || []).map(function (u) {
      return '<tr><td><b>' + esc(u.name) + '</b></td><td>' + esc(u.role) + '</td><td>' + esc(u.region) + '</td><td><span class="status todo">' + esc(u.scope) + '</span></td></tr>';
    }).join("");
    if (!users) users = '<tr><td colspan="4" class="muted">组织演示数据尚未加载</td></tr>';

    var roles = (org.roles || []).map(function (r) {
      var permissions = (r.permissions || []).map(function (p) { return '<span class="profile-tag">' + esc(p) + '</span>'; }).join("");
      return '<div class="role-permission-card"><div class="flex-between"><strong>' + esc(r.role) + '</strong><span class="soft-chip">' + (r.permissions || []).length + ' 权限</span></div><div class="profile-tags">' + permissions + '</div></div>';
    }).join("");
    if (!roles) roles = '<div class="empty-state"><strong>RBAC 演示数据加载中</strong><span>当前全部数据由前端原型模拟.</span></div>';

    var auditRows = (state.audit || []).slice(0, 10).map(function (a) {
      var at = a.at ? new Date(a.at).toLocaleString("zh-CN", { hour12: false }) : "-";
      return '<tr><td>' + esc(at) + '</td><td><b>' + esc(a.actor) + '</b></td><td>' + esc(a.event) + '</td><td>' + esc(a.object) + '</td><td>' + esc(a.detail) + '</td></tr>';
    }).join("");
    if (!auditRows) auditRows = '<tr><td colspan="5" class="muted">暂无原型审计事件. 执行登录、NBA 生成、行动完成或 CRM 同步演示后会自动记录.</td></tr>';

    var mode = "Frontend Prototype";
    return '<div class="page-banner"><div><span class="banner-kicker">ORGANIZATION & ACCESS</span><h2>组织、辖区、角色与审计</h2><p>把 Agent 的“聪明”放进企业边界里. 用户只能访问自己职责范围内的医院、医生、行动和管理视图, 所有关键操作留下审计轨迹.</p></div><div class="banner-side"><strong>' + mode + '</strong><span>当前运行模式</span></div></div>' +
      '<div class="metric-grid">' + regions + '</div>' +
      '<div class="grid-equal">' +
        panel("用户与数据范围", "最小权限 + 角色工作台", '<table class="risk-table"><thead><tr><th>用户</th><th>角色</th><th>辖区</th><th>数据范围</th></tr></thead><tbody>' + users + '</tbody></table>') +
        panel("RBAC 权限模型", "原型阶段使用角色权限, 后续可接企业 IAM / SSO", '<div class="permission-grid">' + roles + '</div>') +
      '</div>' +
      '<div class="mt-16">' +
        panel("审计日志", "登录、AI 判断、规则、行动状态与外部同步均可追溯",
          '<table class="risk-table"><thead><tr><th>时间</th><th>操作者</th><th>事件</th><th>对象</th><th>详情</th></tr></thead><tbody>' + auditRows + '</tbody></table>',
          '<button class="btn soft" id="refreshAudit">刷新审计</button>'
        ) +
      '</div>';
  }

  async function refreshAudit() {
    var result = await window.ZG_API.getAudit();
    state.audit = result.audit || [];
    if (state.route === "admin") render();
  }

  async function loadRuntimeContext() {
    await window.ZG_API.health();
    state.runtimeOnline = false;
    var mode = $("#runtimeMode");
    if (mode) {
      mode.innerHTML = '<span class="system-dot"></span>System of Action · Frontend Prototype';
    }

    var boot = await window.ZG_API.bootstrap();
    if (boot) {
      state.actionStatus = Object.assign({}, boot.actionStatus || {}, state.actionStatus || {});
      var combined = (boot.customRules || []).concat(state.customRules || []);
      var seen = {};
      state.customRules = combined.filter(function (r) {
        if (!r || !r.id || seen[r.id]) return false;
        seen[r.id] = true;
        return true;
      });
      state.crmSync = boot.crmSync || null;
      state.domainSummary = boot.domainSummary || null;
      saveState();
    }

    var orgResult = await window.ZG_API.getOrg();
    if (orgResult && orgResult.organization) state.org = orgResult;
    var auditResult = await window.ZG_API.getAudit();
    if (auditResult) state.audit = auditResult.audit || [];
    await refreshDecisionData();

    if (state.route === "admin" || state.route === "guardrails" || state.route === "pilot" || state.route === "learning") render();
  }

  function renderGuardrails() {
    var cards =
      '<div class="guard-card"><div class="guard-icon">' + icon("i-book") + '</div><h3>内容防火墙</h3><p>所有医学内容必须有证据来源和适应症边界, 显式区分 FACT / INFERENCE / UNKNOWN.</p><ul class="guard-list"><li>医学证据版本管理</li><li>来源与引用可追溯</li><li>超边界内容自动拦截</li></ul></div>' +
      '<div class="guard-card"><div class="guard-icon">' + icon("i-alert") + '</div><h3>行为防火墙</h3><p>把企业合规规则嵌入拜访、会议、资源使用与 NBA 生成过程.</p><ul class="guard-list"><li>敏感场景预警</li><li>高风险 NBA Human Review</li><li>违规动作不可直接执行</li></ul></div>' +
      '<div class="guard-card"><div class="guard-icon">' + icon("i-shield") + '</div><h3>数据安全</h3><p>客户、拜访与业务数据按企业规则分级授权, 全链路记录访问与操作.</p><ul class="guard-list"><li>角色与数据域权限</li><li>敏感信息脱敏</li><li>传输 / 存储加密与审计</li></ul></div>' +
      '<div class="guard-card"><div class="guard-icon">' + icon("i-grid") + '</div><h3>部署方式</h3><p>支持 SaaS、私有化与混合架构, 根据客户 IT 和合规边界选择模型与数据流.</p><ul class="guard-list"><li>企业 SSO / IAM</li><li>模型与知识库可替换</li><li>关键数据不出域</li></ul></div>';

    var sources =
      '<div class="source-row"><div><div class="source-name">CRM / SFE</div><div class="source-meta">医院、医生、互动、辖区</div></div><div class="source-meta">每 15 分钟同步</div><div class="source-health"><span class="health-dot"></span>正常</div><button class="tiny-btn" data-crm-sync>立即同步</button></div>' +
      '<div class="source-row"><div><div class="source-name">医学知识库</div><div class="source-meta">指南、研究、证据、批准材料</div></div><div class="source-meta">版本 2026.09</div><div class="source-health"><span class="health-dot"></span>正常</div><button class="tiny-btn">证据策略</button></div>' +
      '<div class="source-row"><div><div class="source-name">拜访记录 / 语音复盘</div><div class="source-meta">转写、结构化片段、Outcome</div></div><div class="source-meta">实时 / 批量</div><div class="source-health"><span class="health-dot"></span>正常</div><button class="tiny-btn">隐私策略</button></div>' +
      '<div class="source-row"><div><div class="source-name">Decision Rules</div><div class="source-meta">组织打法与判断规则</div></div><div class="source-meta">128 条规则</div><div class="source-health"><span class="health-dot warn"></span>31 条验证中</div><button class="tiny-btn">进入规则库</button></div>';

    return '<div class="page-banner"><div><span class="banner-kicker">ENTERPRISE GUARDRAILS</span><h2>专业、合规、数据安全、可追溯</h2><p>AI 帮助合规的人做出更专业的下一步行动, 不绕过医学证据、企业流程和人工判断边界.</p></div><div class="banner-side"><strong>100%</strong><span>关键 NBA 可追溯</span></div></div>' +
      '<div class="guard-grid">' + cards + '</div>' +
      '<div class="grid-equal mt-16">' +
        panel("企业数据接入", "AI GPS 位于 CRM、知识、培训与业务执行之上的行动层", sources) +
        panel("当前审计摘要", "Pilot 环境 · 最近 7 天",
          '<div class="metric-grid" style="grid-template-columns:repeat(2,1fr);margin-bottom:12px">' + metric("AI 调用", "2,418", "全部带用户与业务上下文", "", "AI") + metric("Human Review", "37", "高风险 NBA / 医学边界", "", "审") + '</div><div class="drawer-success"><span>✓</span><span>最近 7 天未发现越权数据访问. 4 次高风险建议均在 Human Review 阶段被修订后再进入执行.</span></div><div class="divider"></div><p class="small-note">原则: AI 不替代医药代表, 不直接面向处方药患者推销, 不绕过企业合规边界.</p>'
        ) +
      '</div>';
  }

  function render() {
    $("#pageTitle").textContent = titles[state.route] || "ZG AI GPS";
    $("#roleName").textContent = state.role;
    $$(".nav-item").forEach(function (btn) {
      var navRoute = btn.getAttribute("data-route");
      btn.classList.toggle("active", navRoute === state.route || (state.route === "visitlive" && navRoute === "rep"));
    });

    var view = "";
    if (state.route === "rep") view = renderRep();
    else if (state.route === "visitlive") view = renderVisitLive();
    else if (state.route === "teamcoaching") view = renderTeamCoaching();
    else if (state.route === "managerreview") view = renderManagerReview();
    else if (state.route === "hospital") view = renderHospital();
    else if (state.route === "doctor") view = renderDoctor();
    else if (state.route === "coaching") view = renderCoaching();
    else if (state.route === "cockpit") view = renderCockpit();
    else if (state.route === "pilot") view = renderPilot();
    else if (state.route === "learning") view = renderLearning();
    else if (state.route === "guardrails") view = renderGuardrails();
    else if (state.route === "admin") view = renderAdmin();
    else view = renderDashboard();

    $("#appContent").innerHTML = view;
    bindViewEvents();
    ensureDemoTourShell();
    updateDemoTourShell();
    saveState();
  }

  function bindViewEvents() {
    $$("[data-action-id]").forEach(function (el) {
      el.addEventListener("click", function () { openAction(el.getAttribute("data-action-id")); });
    });

    $$("[data-scenario]").forEach(function (el) {
      el.addEventListener("click", function () {
        selectScenario(el.getAttribute("data-scenario"));
      });
    });

    $$("[data-start-tour]").forEach(function (el) {
      el.addEventListener("click", function () { startDemoTour(); });
    });

    $$("[data-reset-prototype]").forEach(function (el) {
      el.addEventListener("click", resetFrontendPrototype);
    });

    $$("[data-filter]").forEach(function (el) {
      el.addEventListener("click", function () {
        state.actionFilter = el.getAttribute("data-filter");
        render();
      });
    });

    $$("[data-route-jump]").forEach(function (el) {
      el.addEventListener("click", function () { navigate(el.getAttribute("data-route-jump")); });
    });

    $$("[data-patient-flow]").forEach(function (el) {
      el.addEventListener("click", function () {
        openPatientFlowDetail(Number(el.getAttribute("data-patient-flow")));
      });
    });

    $$("[data-stakeholder]").forEach(function (el) {
      el.addEventListener("click", function () {
        openStakeholderDetail(Number(el.getAttribute("data-stakeholder")));
      });
    });

    $$("[data-resource-toggle]").forEach(function (el) {
      el.addEventListener("click", function () {
        var i = Number(el.getAttribute("data-resource-toggle"));
        var h = data.hospitals.find(function (x) { return x.id === state.selectedHospital; }) || data.hospitals[0];
        var r = h.resources && h.resources[i];
        if (!r) return;
        var current = resourceStatus(h.id, r);
        var order = ["planned","ready","doing"];
        var idx = order.indexOf(current);
        var next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : (current === "hold" ? "planned" : "ready");
        state.resourceOverrides[h.id + ":" + r.id] = next;
        saveState();
        showToast(r.item + " · " + ({ ready: "已就绪", doing: "执行中", planned: "计划中", hold: "暂缓" }[next] || next));
        render();
      });
    });

    $$("[data-resource-review]").forEach(function (el) {
      el.addEventListener("click", function () {
        startAIGeneration("hospital");
      });
    });

    $$("[data-prep-check]").forEach(function (el) {
      el.addEventListener("click", function () {
        var i = Number(el.getAttribute("data-prep-check"));
        var docId = state.selectedDoctor;
        if (!state.prepStatus[docId]) state.prepStatus[docId] = {};
        state.prepStatus[docId][i] = !state.prepStatus[docId][i];
        saveState();
        render();
      });
    });

    $$("[data-evidence-index]").forEach(function (el) {
      el.addEventListener("click", function () {
        openEvidenceTrace(Number(el.getAttribute("data-evidence-index")));
      });
    });

    $$("[data-rep-visit]").forEach(function (el) {
      el.addEventListener("click", function () {
        var visit = repVisitById(el.getAttribute("data-rep-visit"));
        syncRepVisitSelection(visit);
        saveState();
        render();
      });
    });

    $$("[data-rep-task]").forEach(function (el) {
      el.addEventListener("click", function () {
        var id = el.getAttribute("data-rep-task");
        state.repQuickTasks[id] = !state.repQuickTasks[id];
        saveState();
        render();
      });
    });

    $$("[data-rep-open-doctor]").forEach(function (el) {
      el.addEventListener("click", function () {
        state.route = "doctor";
        state.role = "医药代表";
        render();
      });
    });

    $$("[data-rep-prepare]").forEach(function (el) {
      el.addEventListener("click", function () {
        state.route = "doctor";
        state.role = "医药代表";
        render();
        setTimeout(function(){ var p=$(".previsit-hero"); if(p) p.scrollIntoView({behavior:"smooth",block:"center"}); },50);
      });
    });

    $$("[data-doctor-live]").forEach(function (el) {
      el.addEventListener("click", startLiveVisitForDoctor);
    });

    $$("[data-rep-start-visit]").forEach(function (el) {
      el.addEventListener("click", function () {
        var session = liveVisitSession();
        if (session) { session.started = true; session.startedAt = new Date().toISOString(); }
        state.liveVisitTab = "evidence";
        state.route = "visitlive";
        state.role = "医药代表";
        saveState();
        render();
      });
    });

    $$("[data-live-tab]").forEach(function (el) {
      el.addEventListener("click", function () {
        state.liveVisitTab = el.getAttribute("data-live-tab");
        render();
      });
    });

    $$("[data-live-back]").forEach(function (el) {
      el.addEventListener("click", function () {
        state.route = "rep";
        render();
      });
    });

    $$("[data-live-evidence]").forEach(function (el) {
      el.addEventListener("click", function () {
        openEvidenceTrace(Number(el.getAttribute("data-live-evidence")));
      });
    });

    $$("[data-live-objection]").forEach(function (el) {
      el.addEventListener("click", function () {
        var session = liveVisitSession();
        if (session) session.objection = el.getAttribute("data-objection-text");
        saveState();
        render();
      });
    });

    $$("[data-live-commitment]").forEach(function (el) {
      el.addEventListener("click", function () {
        var session = liveVisitSession();
        if (session) session.commitment = el.getAttribute("data-commitment-text");
        saveState();
        render();
      });
    });

    $$("[data-live-finish]").forEach(function (el) {
      el.addEventListener("click", finishLiveVisit);
    });

    $$("[data-start-three-review]").forEach(function (el) {
      el.addEventListener("click", function () {
        processVisitAudio(null, true);
      });
    });

    $$("[data-review-accept-issue]").forEach(function (el) {
      el.addEventListener("click", function () {
        var review = coachingReviewSession(state.selectedVisit);
        review.issueAccepted = true;
        saveState();
        render();
        showToast("已锁定本次 Top 1 改进点");
      });
    });

    $$("[data-roleplay-round-choice]").forEach(function (el) {
      el.addEventListener("click", function () {
        var v = data.visits.find(function (x) { return x.id === state.selectedVisit; }) || data.visits[0];
        var session = coachingRoleplaySession(v.id);
        var scenario = roleplayScenario(v);
        var roundIndex = Number(session.round || 0);
        var round = scenario.rounds[roundIndex];
        var choiceIndex = Number(el.getAttribute("data-roleplay-round-choice"));
        var choice = round && round.choices[choiceIndex];
        if (!round || !choice || session.conversationDone) return;

        session.history.push({
          round: roundIndex + 1,
          dimension: round.dimension,
          stage: round.stage,
          doctor: round.doctor,
          rep: choice.text,
          reply: choice.reply,
          score: choice.score,
          feedback: choice.feedback,
          at: new Date().toISOString()
        });
        session.dimensionScores[round.dimension] = choice.score;
        session.round = roundIndex + 1;

        if (session.round >= scenario.rounds.length) {
          session.conversationDone = true;
        }

        saveState();
        render();
        showToast(round.dimension + " · " + choice.score + " 分");
      });
    });

    $$("[data-roleplay-restart]").forEach(function (el) {
      el.addEventListener("click", function () {
        var session = coachingRoleplaySession(state.selectedVisit);
        session.round = 0;
        session.history = [];
        session.dimensionScores = {};
        session.conversationDone = false;
        session.completed = false;
        session.lockedAt = null;
        saveState();
        render();
        showToast("已重新开始 4 轮模拟");
      });
    });

    $$("[data-roleplay-lock]").forEach(function (el) {
      el.addEventListener("click", function () {
        var v = data.visits.find(function (x) { return x.id === state.selectedVisit; }) || data.visits[0];
        var session = coachingRoleplaySession(v.id);
        var scenario = roleplayScenario(v);
        var scorecard = roleplayScorecard(session, scenario);
        if (!scorecard.passed) {
          showToast("总分需要达到 85 才能锁定训练结果");
          return;
        }

        session.completed = true;
        session.lockedAt = new Date().toISOString();

        var review = coachingReviewSession(v.id);
        review.nextActionAccepted = true;
        review.completed = true;
        if (v.id === "v2") state.actionStatus.a7 = "doing";
        else state.actionStatus.a3 = "doing";

        saveState();
        render();
        showToast("4 轮模拟已锁定为经理检查证据");
      });
    });

    $$("[data-review-route]").forEach(function (el) {
      el.addEventListener("click", function (event) {
        event.stopPropagation();
        var route = el.getAttribute("data-review-route");
        var hospitalId = el.getAttribute("data-review-hospital");
        if (hospitalId) state.selectedHospital = hospitalId;
        navigate(route);
      });
    });

    $$("[data-review-coach]").forEach(function (el) {
      el.addEventListener("click", function () {
        openTeamRepCoaching(el.getAttribute("data-review-coach"), false);
      });
    });

    $$("[data-review-generate]").forEach(function (el) {
      el.addEventListener("click", generateManagerReviewPlan);
    });

    $$("[data-review-plan]").forEach(function (el) {
      el.addEventListener("click", function (event) {
        if (event.target && event.target.hasAttribute("data-review-route")) return;
        toggleManagerReviewPlan(el.getAttribute("data-review-plan"));
      });
    });

    $$("[data-review-adopt-playbook]").forEach(function (el) {
      el.addEventListener("click", function () {
        var best = bestTeamPlaybookCandidate();
        if (!best) return;
        if (state.teamPlaybook && state.teamPlaybook.repId === best.id) {
          state.teamPlaybook = null;
          showToast("已取消团队 Playbook");
        } else {
          state.teamPlaybook = { repId:best.id, name:best.name, issue:best.issue, adoptedAt:new Date().toISOString() };
          showToast(best.name + " 的打法已进入团队 Playbook");
        }
        saveState();
        render();
      });
    });

    $$("[data-review-close]").forEach(function (el) {
      el.addEventListener("click", closeManagerReview);
    });

    $$("[data-reset-agenda]").forEach(function (el) {
      el.addEventListener("click", resetCoachingAgenda);
    });

    $$("[data-agenda-open]").forEach(function (el) {
      el.addEventListener("click", function () {
        openTeamRepCoaching(el.getAttribute("data-agenda-open"), true);
      });
    });

    $$("[data-agenda-done]").forEach(function (el) {
      el.addEventListener("click", function () {
        var id = el.getAttribute("data-agenda-done");
        state.coachingAgendaStatus[id] = !state.coachingAgendaStatus[id];
        saveState();
        render();
        showToast(state.coachingAgendaStatus[id] ? "已完成本周 15 分钟辅导" : "已取消本周辅导完成状态");
      });
    });

    $$("[data-adopt-playbook]").forEach(function (el) {
      el.addEventListener("click", function () {
        var repId = el.getAttribute("data-adopt-playbook");
        var rep = (data.teamCoaching.reps || []).find(function(r){return r.id===repId;});
        if (!rep) return;
        if (state.teamPlaybook && state.teamPlaybook.repId === repId) {
          state.teamPlaybook = null;
          showToast("已取消本周团队打法");
        } else {
          state.teamPlaybook = { repId:repId, name:rep.name, issue:rep.issue, adoptedAt:new Date().toISOString() };
          showToast(rep.name + " 的打法已采纳为本周团队打法");
        }
        saveState();
        render();
      });
    });

    $$("[data-team-filter]").forEach(function (el) {
      el.addEventListener("click", function () {
        state.teamCoachingFilter = el.getAttribute("data-team-filter");
        saveState();
        render();
      });
    });

    $$("[data-team-detail]").forEach(function (el) {
      el.addEventListener("click", function () {
        openTeamRepCoaching(el.getAttribute("data-team-detail"), false);
      });
    });

    $$("[data-team-practice]").forEach(function (el) {
      el.addEventListener("click", function () {
        openTeamRepCoaching(el.getAttribute("data-team-practice"), true);
      });
    });

    $$("[data-doctor-id]").forEach(function (el) {
      el.addEventListener("click", function () {
        state.selectedDoctor = el.getAttribute("data-doctor-id");
        render();
      });
    });

    $$("[data-coaching-tab]").forEach(function (el) {
      el.addEventListener("click", function () {
        state.coachingTab = el.getAttribute("data-coaching-tab");
        render();
      });
    });

    var hs = $("#hospitalSelect");
    if (hs) hs.addEventListener("change", function () { state.selectedHospital = hs.value; render(); });

    var vs = $("#visitSelect");
    if (vs) vs.addEventListener("change", function () { state.selectedVisit = vs.value; render(); });

    $$("[data-custom-action]").forEach(function (el) {
      el.addEventListener("click", function () { openCustom(el.getAttribute("data-custom-action")); });
    });

    $$("[data-management-decision]").forEach(function (el) {
      el.addEventListener("click", function () {
        applyManagementDecision(el.getAttribute("data-management-risk"), el.getAttribute("data-management-decision"));
      });
    });

    $$("[data-management-clear]").forEach(function (el) {
      el.addEventListener("click", function () {
        clearManagementDecision(el.getAttribute("data-management-clear"));
      });
    });

    $$("[data-pilot-week]").forEach(function (el) {
      el.addEventListener("click", function () {
        state.pilotWeek = Number(el.getAttribute("data-pilot-week"));
        saveState();
        render();
        showToast("Pilot 已切换到 W" + state.pilotWeek);
      });
    });

    $$("[data-pilot-next]").forEach(function (el) {
      el.addEventListener("click", function () {
        if (state.pilotWeek < 8) state.pilotWeek += 1;
        saveState();
        render();
        showToast("Pilot 推进到 W" + state.pilotWeek);
      });
    });

    $$("[data-pilot-prev]").forEach(function (el) {
      el.addEventListener("click", function () {
        if (state.pilotWeek > 1) state.pilotWeek -= 1;
        saveState();
        render();
        showToast("Pilot 回到 W" + state.pilotWeek);
      });
    });

    $$("[data-risk]").forEach(function (el) {
      el.addEventListener("click", function () {
        openCustom("risk", el.getAttribute("data-risk"));
      });
    });

    $$("[data-cockpit]").forEach(function (el) {
      el.addEventListener("click", function () {
        openCustom("cockpit", el.getAttribute("data-cockpit"));
      });
    });

    $$("[data-rule]").forEach(function (el) {
      el.addEventListener("click", function () {
        openCustom("rule", el.getAttribute("data-rule"));
      });
    });

    $$("[data-ai-generate]").forEach(function (el) {
      el.addEventListener("click", function () {
        startAIGeneration(el.getAttribute("data-ai-generate"));
      });
    });

    var newRule = $("#newRuleBtn");
    if (newRule) newRule.addEventListener("click", openRuleEditor);

    var refreshDecisionTrace = $("#refreshDecisionTrace");
    if (refreshDecisionTrace) refreshDecisionTrace.addEventListener("click", refreshDecisionData);

    $$("[data-rule-validation]").forEach(function (el) {
      el.addEventListener("click", async function () {
        var id = el.getAttribute("data-rule-validation");
        var action = el.getAttribute("data-review-action");
        el.disabled = true;
        var result = await window.ZG_API.reviewRuleValidation(id, action, state.session && state.session.name);
        showToast(action === "approve" ? "RuleValidation 演示状态已批准" : "RuleValidation 演示状态已驳回");
        await refreshDecisionData();
      });
    });

    var audio = $("#visitAudio");
    if (audio) audio.addEventListener("change", function () {
      if (audio.files && audio.files[0]) processVisitAudio(audio.files[0]);
    });

    var demoVoice = $("#demoVoiceBtn");
    if (demoVoice) demoVoice.addEventListener("click", function () { processVisitAudio(null); });

    $$(".eco-node").forEach(function (el) {
      el.addEventListener("click", function () {
        showToast(el.querySelector("strong").textContent + " · 已定位关系节点");
      });
    });

    var crmSync = $("[data-crm-sync]");
    if (crmSync) crmSync.addEventListener("click", async function () {
      crmSync.disabled = true;
      crmSync.textContent = "同步中...";
      var result = await window.ZG_API.syncCRM({ actor: state.session && state.session.name, records: 1286 });
      state.crmSync = result.crmSync || { status: "healthy", lastSyncedAt: new Date().toISOString(), records: 1286 };
      showToast("CRM / SFE 同步演示完成");
      render();
    });

    var refreshAuditBtn = $("#refreshAudit");
    if (refreshAuditBtn) refreshAuditBtn.addEventListener("click", refreshAudit);

    var gen = $("#generateNba");
    if (gen) gen.addEventListener("click", function () {
      startAIGeneration("cockpit");
    });
  }

  function navigate(route) {
    state.route = route;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    $(".sidebar").classList.remove("show");
  }

  function openDrawer(title, body, selectedAction) {
    state.selectedAction = selectedAction || null;
    $("#drawerTitle").textContent = title;
    $("#drawerBody").innerHTML = body;
    $("#actionDrawer").classList.add("open");
    $("#drawerMask").classList.add("show");
    $("#actionDrawer").setAttribute("aria-hidden", "false");
    $("#drawerDone").style.display = selectedAction ? "inline-flex" : "none";
  }

  function closeDrawer() {
    $("#actionDrawer").classList.remove("open");
    $("#drawerMask").classList.remove("show");
    $("#actionDrawer").setAttribute("aria-hidden", "true");
    state.selectedAction = null;
  }

  function openAction(id) {
    var a = data.actions.find(function (x) { return x.id === id; });
    if (!a) return;
    var status = getActionStatus(a);
    var body =
      '<div class="drawer-section"><h4>为什么是现在</h4><div class="drawer-callout"><strong>' + esc(a.why) + '</strong><p>' + esc(a.desc) + '</p></div></div>' +
      '<div class="drawer-section"><h4>执行信息</h4><div class="drawer-meta"><div class="meta-cell"><b>对象</b><span>' + esc(a.entity) + '</span></div><div class="meta-cell"><b>Owner</b><span>' + esc(a.owner) + '</span></div><div class="meta-cell"><b>截止</b><span>' + esc(a.due) + '</span></div><div class="meta-cell"><b>来源 Agent</b><span>' + esc(a.source) + '</span></div></div></div>' +
      '<div class="drawer-section"><h4>成功信号</h4><div class="drawer-success"><span>✓</span><span>' + esc(a.success) + '</span></div></div>' +
      '<div class="drawer-section"><h4>当前状态</h4><span class="status ' + status + '">' + esc(statusLabel(status)) + '</span></div>' +
      '<div class="drawer-section"><h4>Action → Outcome</h4><p class="small-note">执行后请记录客户反馈、业务里程碑变化与证据. 系统会用 Outcome 更新下一轮 NBA 与 Decision Rules.</p></div>';
    openDrawer(a.title, body, a);
  }

  function openCustom(type, param) {
    var title = "下一步行动";
    var body = "";

    if (type === "hospital") {
      var h = data.hospitals.find(function (x) { return x.id === state.selectedHospital; }) || data.hospitals[0];
      var l = h.levers[0];
      title = "医院作战 NBA";
      body = '<div class="drawer-section"><h4>TOP LEVER</h4><div class="drawer-callout"><strong>' + esc(l.title) + '</strong><p>' + esc(l.detail) + '</p></div></div><div class="drawer-section"><h4>WHO / WHEN / WHAT</h4><div class="drawer-meta"><div class="meta-cell"><b>WHO</b><span>' + esc(l.who) + '</span></div><div class="meta-cell"><b>WHEN</b><span>' + esc(l.when) + '</span></div><div class="meta-cell"><b>WHAT</b><span>' + esc(l.what) + '</span></div><div class="meta-cell"><b>SUCCESS</b><span>' + esc(l.success) + '</span></div></div></div><div class="drawer-success"><span>✓</span><span>计划已绑定到本周医院目标. 执行结果将进入周度 Review.</span></div>';
    } else if (type === "doctor") {
      var doc = data.doctors.find(function (x) { return x.id === state.selectedDoctor; }) || data.doctors[0];
      title = doc.name + " · 下一次拜访 NBA";
      body = '<div class="drawer-section"><h4>WHY NOW</h4><div class="drawer-callout"><strong>' + esc(doc.trigger) + '</strong><p>' + esc(doc.gap) + '</p></div></div><div class="drawer-section"><h4>目标行为</h4><div class="drawer-success"><span>→</span><span>' + esc(doc.targetBehavior) + '</span></div></div><div class="drawer-section"><h4>建议动作</h4><p class="small-note">' + esc(doc.script[0][1]) + '<br><br>' + esc(doc.script[3][1]) + '</p></div>';
    } else if (type === "visit-start") {
      title = "拜访中 · AI 证据助手";
      body = '<div class="drawer-section"><h4>当前场景</h4><div class="drawer-callout"><strong>方案选择 · 高风险患者</strong><p>系统只显示经过审核且与当前医生关注点相关的证据, 不自动替代表达.</p></div></div><div class="drawer-section"><h4>3 秒证据调用</h4><div class="evidence-list"><div class="evidence-item"><div class="evidence-icon">RWE</div><div><strong>高风险患者真实世界证据</strong><span>医学审核通过 · 可追溯</span></div></div><div class="evidence-item"><div class="evidence-icon">FAQ</div><div><strong>长期获益常见异议</strong><span>企业批准话术边界</span></div></div></div></div><div class="drawer-success"><span>!</span><span>合规提醒: 仅讨论批准适应症内内容. 超出边界的问题建议转医学团队.</span></div>';
    } else if (type === "coach" || type === "coach-adopt") {
      var v = data.visits.find(function (x) { return x.id === state.selectedVisit; }) || data.visits[0];
      title = "下一次拜访辅导 NBA";
      body = '<div class="drawer-section"><h4>首要改进点</h4><div class="drawer-callout"><strong>' + esc(v.issue) + '</strong><p>' + esc(v.nextScript) + '</p></div></div><div class="drawer-section"><h4>经理检查证据</h4><div class="drawer-meta"><div class="meta-cell"><b>拜访前</b><span>完成 1 次角色演练</span></div><div class="meta-cell"><b>拜访后</b><span>记录医生行为承诺</span></div></div></div><div class="drawer-success"><span>✓</span><span>采纳后将同步到代表的“今日行动”.</span></div>';
    } else if (type === "risk") {
      var risk = data.risks.find(function (x) { return x.object === param; }) || data.risks[0];
      title = risk.object + " · 管理动作";
      body = '<div class="drawer-section"><h4>为什么需要介入</h4><div class="drawer-callout"><strong>' + esc(risk.issue) + '</strong><p>风险等级: ' + esc(risk.level) + ' · Owner: ' + esc(risk.owner) + '</p></div></div><div class="drawer-section"><h4>推荐管理动作</h4><div class="drawer-success"><span>→</span><span>' + esc(risk.action) + '</span></div></div>';
    } else if (type === "cockpit") {
      var idx = Number(param || 0);
      var messages = [
        ["本周优先医院", "华东附一、滨江中心、海川人民医院. 三家对应的管理动作分别是: 加医学资源、锁定病例会、暂停活动先补情报."],
        ["关键医生", "周敏、王静、陈浩优先级最高. 当前最值得推动的是明确的病例、会议或治疗决策承诺."],
        ["策略偏离", "4 个偏离动作集中在“增加覆盖但没有目标行为”. 建议经理把检查口径从拜访次数改成 NBA 成功信号."],
        ["辅导队列", "张蕾和刘晨需要本周完成结构化辅导. 前者修复探询, 后者修复结束阶段的推进承诺."],
        ["管理建议", "增加华东附一场景化医学支持, 保持滨江病例会投入, 暂停海川大型活动, 升级连续 3 次无承诺的代表辅导."]
      ];
      title = messages[idx][0];
      body = '<div class="drawer-callout"><strong>AI Decision Brief</strong><p>' + esc(messages[idx][1]) + '</p></div><div class="drawer-section mt-16"><h4>决策原则</h4><p class="small-note">管理层只介入无法由一线自行解决、影响高价值里程碑或需要跨部门资源的动作.</p></div>';
    } else if (type === "rule") {
      var rule = data.rules.find(function (x) { return x.id === param; }) || data.rules[0];
      title = rule.id + " · " + rule.title;
      body = '<div class="drawer-section"><h4>证据链</h4><div class="drawer-meta"><div class="meta-cell"><b>CONTEXT</b><span>' + esc(rule.context) + '</span></div><div class="meta-cell"><b>DECISION</b><span>' + esc(rule.decision) + '</span></div><div class="meta-cell"><b>ACTION</b><span>' + esc(rule.action) + '</span></div><div class="meta-cell"><b>OUTCOME</b><span>' + esc(rule.outcome) + '</span></div></div></div><div class="drawer-success"><span>✓</span><span>置信度 ' + rule.confidence + '%, 已在 ' + rule.uses + ' 次判断中调用. 正式规则更新仍需 Human Review.</span></div>';
    }

    openDrawer(title, body, null);
  }

  function showToast(message) {
    $("#toastText").textContent = message;
    $("#toast").classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () { $("#toast").classList.remove("show"); }, 2300);
  }

  $$(".nav-item").forEach(function (btn) {
    btn.addEventListener("click", function () { navigate(btn.getAttribute("data-route")); });
  });

  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#drawerMask").addEventListener("click", closeDrawer);
  $("#drawerLater").addEventListener("click", function () {
    closeDrawer();
    showToast("已保留在待执行队列");
  });
  $("#drawerDone").addEventListener("click", function () {
    if (!state.selectedAction) return;
    var actionId = state.selectedAction.id;
    state.actionStatus[actionId] = "done";
    saveState();
    closeDrawer();
    showToast("行动已完成, 等待 Outcome 回流");
    render();
    window.ZG_API.updateActionStatus(actionId, "done", state.session && state.session.name).then(function (result) {
      if (result && !result.offline && state.route === "admin") refreshAudit();
    });
  });

  $("#roleSwitch").addEventListener("click", function (event) {
    event.stopPropagation();
    $("#rolePopover").classList.toggle("show");
  });

  $$("#rolePopover [data-role]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.role = btn.getAttribute("data-role");
      $("#rolePopover").classList.remove("show");
      if (state.role === "销售总监") state.route = "cockpit";
      else if (state.role === "医药代表") state.route = "rep";
      else state.route = "dashboard";
      render();
      showToast("已切换到 " + state.role + " 工作视角");
    });
  });

  document.addEventListener("click", function (event) {
    if (!$("#rolePopover").contains(event.target) && !$("#roleSwitch").contains(event.target)) {
      $("#rolePopover").classList.remove("show");
    }
  });

  $("#mobileMenu").addEventListener("click", function () {
    $(".sidebar").classList.toggle("show");
  });

  $("#notifyBtn").addEventListener("click", function () {
    showToast("3 条提醒: 2 个高优先辅导, 1 个医院 NBA 即将到期");
  });

  $("#globalSearch").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      var q = event.target.value.trim();
      if (!q) return;
      var foundDoctor = data.doctors.find(function (x) { return x.name.indexOf(q) >= 0 || x.hospital.indexOf(q) >= 0; });
      var foundHospital = data.hospitals.find(function (x) { return x.name.indexOf(q) >= 0; });
      if (foundDoctor) {
        state.selectedDoctor = foundDoctor.id;
        navigate("doctor");
        showToast("已定位到医生 " + foundDoctor.name);
      } else if (foundHospital) {
        state.selectedHospital = foundHospital.id;
        navigate("hospital");
        showToast("已定位到医院 " + foundHospital.name);
      } else {
        showToast("演示数据中未找到 “" + q + "”");
      }
      event.target.value = "";
    }
  });

  document.addEventListener("keydown", function (event) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      $("#globalSearch").focus();
    }
    if (event.key === "Escape") closeDrawer();
  });

  ensureLogin();
  render();
  loadRuntimeContext();
})();
