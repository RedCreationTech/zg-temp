
(function () {
  "use strict";

  var data = window.ZG_DATA;
  var STORAGE_KEY = "zg-ai-gps-demo-v1";
  var titles = {
    dashboard: "今日行动",
    hospital: "医院作战",
    doctor: "医生导航",
    coaching: "拜访辅导",
    cockpit: "总监驾驶舱",
    learning: "组织学习",
    guardrails: "合规与安全"
  };

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
    coachingTab: "review",
    actionFilter: "all",
    selectedAction: null,
    actionStatus: saved.actionStatus || {}
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
      actionStatus: state.actionStatus
    }));
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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

  function renderDashboard() {
    var all = data.actions;
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

    var insights =
      '<div class="insight-card"><div class="insight-head"><strong>医院机会变化</strong><span class="insight-tag">Hospital Agent</span></div><p>华东附一的机会不在增加拜访频次, 而在周三 MDT 的方案选择节点. 建议把资源从泛化覆盖切换到场景证据.</p><button class="tiny-btn primary" data-route-jump="hospital">查看医院作战</button></div>' +
      '<div class="insight-card"><div class="insight-head"><strong>需要立即辅导</strong><span class="insight-tag">Coaching</span></div><p>张蕾本次拜访探询质量仅 54 分. 下一次拜访前建议完成一次经理角色演练, 替换开场与关键问题.</p><button class="tiny-btn" data-route-jump="coaching">进入辅导</button></div>' +
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
      '<div class="flex-between mt-12"><span class="small-note">证据: 患者旅程 + 医院生态 + 历史互动 + 当前资源约束</span><button class="btn primary" data-custom-action="hospital">生成本周行动计划</button></div></div>';

    var timeline =
      '<div class="timeline">' +
      '<div class="timeline-item done"><span class="timeline-dot"></span><b>作战前 · 机会诊断完成</b><span>患者流、患者旅程、医院生态已更新.</span></div>' +
      '<div class="timeline-item done"><span class="timeline-dot"></span><b>优先级 · Top 3 杠杆点已确认</b><span>影响大小 × 可改变程度 × 紧迫度 × 资源匹配.</span></div>' +
      '<div class="timeline-item"><span class="timeline-dot"></span><b>本周执行 · 关键医生与资源动作</b><span>当前 4 / 6 个动作已启动.</span></div>' +
      '<div class="timeline-item"><span class="timeline-dot"></span><b>周度 Review · Outcome 回流</b><span>周五 16:30, 更新有效/无效判断.</span></div>' +
      '</div>';

    return '<div class="page-banner"><div><span class="banner-kicker">HOSPITAL AGENT</span><h2>医院下一步行动导航</h2><p>从患者流、患者旅程与医院生态中筛出 Top 1–3 杠杆点, 让地区经理不再平均用力.</p></div><div class="banner-side"><strong>' + h.opportunity + '</strong><span>机会指数 / 100</span></div></div>' +
      '<div class="filter-bar"><select class="select-box" id="hospitalSelect">' + options + '</select><div class="filter-group"><span class="soft-chip">' + esc(h.tier) + '</span><span class="date-chip">' + esc(h.product) + '</span><span class="date-chip">本季度</span></div></div>' +
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
      '<div class="grid-equal mt-16">' +
        panel("医院 NBA", "谁负责、何时切入、做什么、为什么做、成功信号", nba) +
        panel("作战闭环", "目标: " + h.target, timeline) +
      '</div>';
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
    var evidence = doc.evidence.map(function (e) {
      return '<div class="evidence-item"><div class="evidence-icon">' + esc(e[0]) + '</div><div><strong>' + esc(e[1]) + '</strong><span>' + esc(e[2]) + '</span></div></div>';
    }).join("");

    return '<div class="page-banner"><div><span class="banner-kicker">DOCTOR AGENT</span><h2>医生下一步行动导航</h2><p>不是生成一段话术, 而是结合医院目标、医生画像、关键时机和证据, 判断“这一次最应该推进什么”.</p></div><div class="banner-side"><strong>' + doc.nextScore + '</strong><span>行动优先分 / 100</span></div></div>' +
      '<div class="doctor-layout">' +
        panel("重点医生", "按下一步行动优先级排序", '<div class="doctor-list">' + list + '</div>') +
        '<div class="stack">' +
          panel(doc.name + ' · ' + doc.title, doc.hospital + ' · ' + doc.department,
            '<div class="profile-head"><div class="profile-name"><h2>' + esc(doc.focus) + '</h2><p>当前态度: ' + esc(doc.support) + ' · 阶段: ' + esc(doc.stage) + '</p><div class="profile-tags">' + tags + '</div></div><button class="btn soft" data-custom-action="doctor">生成拜访 NBA</button></div>' +
            '<div class="signal-grid"><div class="signal-card"><b>关键触发场景</b><strong>NOW</strong><span>' + esc(doc.trigger) + '</span></div><div class="signal-card"><b>当前 GAP</b><strong>1 个</strong><span>' + esc(doc.gap) + '</span></div><div class="signal-card"><b>目标行为</b><strong>推进</strong><span>' + esc(doc.targetBehavior) + '</span></div>'
          ) +
          '<div class="grid-equal">' +
            panel("下一次拜访脚本", "围绕 WHY → WHEN → WHAT → HOW → NEXT", '<div class="script-box"><span class="label">AI RECOMMENDED TALK TRACK</span>' + script + '</div>') +
            panel("核心证据包", "来源可追溯, 医学审核通过", '<div class="evidence-list">' + evidence + '</div><button class="btn primary full mt-12" data-custom-action="visit-start">开始拜访演示</button>') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderCoaching() {
    var v = data.visits.find(function (x) { return x.id === state.selectedVisit; }) || data.visits[0];
    var visitOptions = data.visits.map(function (x) {
      return '<option value="' + x.id + '"' + (x.id === v.id ? " selected" : "") + '>' + esc(x.rep) + ' → ' + esc(x.doctor) + ' · ' + esc(x.time) + '</option>';
    }).join("");

    var dims = v.dimensions.map(function (x) {
      return '<div class="dimension-row"><span>' + esc(x[0]) + '</span><div class="bar"><i style="width:' + x[1] + '%"></i></div><b>' + x[1] + '</b></div>';
    }).join("");

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
      '<div class="grid-2">' +
        panel("拜访质量诊断", v.rep + ' → ' + v.doctor + ' · ' + v.time,
          '<div class="coaching-score"><div class="score-ring" style="background:conic-gradient(#5879df 0 ' + v.score + '%,#e8edf5 ' + v.score + '% 100%)"><div><strong>' + v.score + '</strong><span>综合得分</span></div></div><div>' + dims + '</div></div>'
        ) +
        panel("AI 首要判断", "下一次先改一个最影响结果的问题",
          '<div class="insight-card"><div class="insight-head"><strong>' + esc(v.issue) + '</strong><span class="insight-tag">TOP 1</span></div><p>' + esc(v.summary) + '</p></div><div class="divider"></div><div class="flex-between"><span class="small-note">系统将改进点映射到下一次真实拜访</span><button class="btn soft" data-custom-action="coach">生成辅导 NBA</button></div>'
        ) +
      '</div>' +
      '<section class="panel mt-16"><div class="panel-head"><div class="panel-title"><div><h3>结构化辅导工作台</h3><span>复盘 → 诊断 → 改进 → 演练 → 跟进</span></div></div></div><div class="panel-body"><div class="section-tabs">' + tabs + '</div>' + tabBody + '</div></section>';
  }

  function renderCockpit() {
    var questions = [
      ["01", "哪 3 家医院本周最值得我关注?", "重点医院下一步动作"],
      ["02", "哪 5 个医生下一步最值得推进?", "关键医生下一步推进"],
      ["03", "哪些代表行动正在偏离策略?", "代表下一步行动状态"],
      ["04", "哪些拜访需要经理立即辅导?", "辅导下一步计划"],
      ["05", "我下一步要加资源、纠偏、升级还是停止什么?", "管理层下一步决策"]
    ].map(function (q, i) {
      return '<div class="question-card" data-cockpit="' + i + '"><div class="question-no">' + q[0] + '</div><h4>' + q[1] + '</h4><p>' + q[2] + '</p></div>';
    }).join("");

    var rows = data.risks.map(function (r) {
      return '<tr><td><span class="status ' + (r.level === "高" ? "risk" : "doing") + '">' + esc(r.level) + '</span></td><td><b>' + esc(r.object) + '</b></td><td>' + esc(r.issue) + '</td><td>' + esc(r.owner) + '</td><td><button class="tiny-btn primary" data-risk="' + esc(r.object) + '">查看动作</button></td></tr>';
    }).join("");

    return '<div class="page-banner"><div><span class="banner-kicker">DIRECTOR DECISION COCKPIT</span><h2>不是看更多数据, 而是更快做管理决策</h2><p>所有视图都收敛到一件事: 哪些行动应该推进、纠偏、升级、停止或沉淀为组织打法.</p></div><div class="banner-side"><strong>4</strong><span>需要管理层介入</span></div></div>' +
      '<div class="cockpit-questions">' + questions + '</div>' +
      '<div class="metric-grid">' +
        metric("重点医院 NBA 完成", "78%", "目标 85%", "+6%", "院") +
        metric("关键医生推进", "14/19", "5 个动作尚未形成承诺", "", "医") +
        metric("策略偏离", "4", "较上周减少", "-2", "偏") +
        metric("Rule 学习速度", "6", "本月新增验证规则", "+3", "R") +
      '</div>' +
      panel("执行风险与管理下一步", "只展示需要管理层做决定的事项",
        '<table class="risk-table"><thead><tr><th>风险</th><th>对象</th><th>为什么需要介入</th><th>Owner</th><th>下一步</th></tr></thead><tbody>' + rows + '</tbody></table>'
      ) +
      '<div class="grid-equal mt-16">' +
        panel("区域资源建议", "从平均投入切换到高价值动作",
          '<div class="insight-card"><div class="insight-head"><strong>增加 · 华东附一 MDT 场景</strong><span class="insight-tag">+ 医学资源</span></div><p>证据缺口是当前最高价值杠杆, 建议增加一次医学支持, 不增加泛化活动预算.</p></div>' +
          '<div class="insight-card"><div class="insight-head"><strong>停止 · 海川大型活动筹备</strong><span class="insight-tag">- 低确定性</span></div><p>医院决策链尚未清晰. 暂停活动预算, 先购买信息并完成影响者地图.</p></div>'
        ) +
        panel("Action → Outcome", "管理层看到行动是否真正改变业务里程碑",
          '<div class="dimension-row"><span>行动完成</span><div class="bar"><i style="width:78%"></i></div><b>78%</b></div><div class="dimension-row"><span>行为承诺</span><div class="bar"><i style="width:67%"></i></div><b>67%</b></div><div class="dimension-row"><span>医院里程碑</span><div class="bar"><i style="width:59%"></i></div><b>59%</b></div><div class="dimension-row"><span>规则复用</span><div class="bar"><i style="width:71%"></i></div><b>71%</b></div>'
        ) +
      '</div>';
  }

  function renderLearning() {
    var validated = data.rules.filter(function (r) { return r.status === "validated"; }).length;
    var cards = data.rules.map(function (r) {
      return '<div class="rule-card"><div class="rule-head"><span class="rule-id">' + esc(r.id) + '</span><span class="status ' + (r.status === "validated" ? "done" : "doing") + '">' + (r.status === "validated" ? "已验证" : "验证中") + '</span></div><h4>' + esc(r.title) + '</h4><div class="rule-chain"><div class="rule-cell"><b>CONTEXT</b><span>' + esc(r.context) + '</span></div><div class="rule-cell"><b>DECISION</b><span>' + esc(r.decision) + '</span></div><div class="rule-cell"><b>ACTION</b><span>' + esc(r.action) + '</span></div><div class="rule-cell"><b>OUTCOME</b><span>' + esc(r.outcome) + '</span></div></div><div class="rule-foot"><span class="confidence">置信度 <strong>' + r.confidence + '%</strong> · 已调用 ' + r.uses + ' 次</span><button class="tiny-btn" data-rule="' + r.id + '">查看证据</button></div></div>';
    }).join("");

    return '<div class="page-banner"><div><span class="banner-kicker">LEARNING ENGINE</span><h2>把冠军打法从个人经验变成组织资产</h2><p>每一个有效或无效的下一步行动, 都回流为 Context → Decision → Action → Outcome 证据, 持续更新 Decision Rules.</p></div><div class="banner-side"><strong>' + validated + '/' + data.rules.length + '</strong><span>当前规则已验证</span></div></div>' +
      '<div class="learning-summary">' +
        metric("规则总量", "128", "本月新增 11 条", "+11", "R") +
        metric("已验证", "84", "跨区域重复成立", "+6", "验") +
        metric("验证中", "31", "等待更多 Outcome", "", "测") +
        metric("规则复用率", "71%", "进入 NBA 判断流程", "+9%", "%") +
      '</div>' +
      panel("Decision Rules", "AI 不只记住内容, 更沉淀情境下的判断规则",
        '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px" class="rule-grid">' + cards + '</div>'
      ) +
      '<div class="grid-equal mt-16">' +
        panel("本周学习事件", "哪些 Outcome 正在改变规则",
          '<div class="timeline"><div class="timeline-item done"><span class="timeline-dot"></span><b>滨江病例切入打法获得正向 Outcome</b><span>候选 Rule R-041, 正进入第二家同类医院验证.</span></div><div class="timeline-item"><span class="timeline-dot"></span><b>周敏拜访出现“证据先于探询”的负向证据</b><span>R-019 将增加“必须先确认决策标准”的前置条件.</span></div><div class="timeline-item"><span class="timeline-dot"></span><b>海川资源调整等待结果</b><span>两周后验证“先买信息再投资源”是否提高资源效率.</span></div></div>'
        ) +
        panel("Rule 更新原则", "Human Review 保留行业判断权",
          '<div class="insight-card"><div class="insight-head"><strong>FACT</strong><span class="insight-tag">可追溯</span></div><p>真实行动、医生反馈、业务里程碑、知识证据.</p></div><div class="insight-card"><div class="insight-head"><strong>INFERENCE</strong><span class="insight-tag">需验证</span></div><p>Agent 对情境、优先级、因果关系的推断必须带置信度和验证计划.</p></div><div class="insight-card"><div class="insight-head"><strong>HUMAN REVIEW</strong><span class="insight-tag">关键门槛</span></div><p>高风险 NBA、医学边界和规则正式发布必须经过授权角色审核.</p></div>'
        ) +
      '</div>';
  }

  function renderGuardrails() {
    var cards =
      '<div class="guard-card"><div class="guard-icon">' + icon("i-book") + '</div><h3>内容防火墙</h3><p>所有医学内容必须有证据来源和适应症边界, 显式区分 FACT / INFERENCE / UNKNOWN.</p><ul class="guard-list"><li>医学证据版本管理</li><li>来源与引用可追溯</li><li>超边界内容自动拦截</li></ul></div>' +
      '<div class="guard-card"><div class="guard-icon">' + icon("i-alert") + '</div><h3>行为防火墙</h3><p>把企业合规规则嵌入拜访、会议、资源使用与 NBA 生成过程.</p><ul class="guard-list"><li>敏感场景预警</li><li>高风险 NBA Human Review</li><li>违规动作不可直接执行</li></ul></div>' +
      '<div class="guard-card"><div class="guard-icon">' + icon("i-shield") + '</div><h3>数据安全</h3><p>客户、拜访与业务数据按企业规则分级授权, 全链路记录访问与操作.</p><ul class="guard-list"><li>角色与数据域权限</li><li>敏感信息脱敏</li><li>传输 / 存储加密与审计</li></ul></div>' +
      '<div class="guard-card"><div class="guard-icon">' + icon("i-grid") + '</div><h3>部署方式</h3><p>支持 SaaS、私有化与混合架构, 根据客户 IT 和合规边界选择模型与数据流.</p><ul class="guard-list"><li>企业 SSO / IAM</li><li>模型与知识库可替换</li><li>关键数据不出域</li></ul></div>';

    var sources =
      '<div class="source-row"><div><div class="source-name">CRM / SFE</div><div class="source-meta">医院、医生、互动、辖区</div></div><div class="source-meta">每 15 分钟同步</div><div class="source-health"><span class="health-dot"></span>正常</div><button class="tiny-btn">查看映射</button></div>' +
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
      btn.classList.toggle("active", btn.getAttribute("data-route") === state.route);
    });

    var view = "";
    if (state.route === "hospital") view = renderHospital();
    else if (state.route === "doctor") view = renderDoctor();
    else if (state.route === "coaching") view = renderCoaching();
    else if (state.route === "cockpit") view = renderCockpit();
    else if (state.route === "learning") view = renderLearning();
    else if (state.route === "guardrails") view = renderGuardrails();
    else view = renderDashboard();

    $("#appContent").innerHTML = view;
    bindViewEvents();
    saveState();
  }

  function bindViewEvents() {
    $$("[data-action-id]").forEach(function (el) {
      el.addEventListener("click", function () { openAction(el.getAttribute("data-action-id")); });
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

    var gen = $("#generateNba");
    if (gen) gen.addEventListener("click", function () {
      showToast("AI 已基于最新 Context 重新计算优先级");
      setTimeout(function () { openAction("a1"); }, 260);
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
    state.actionStatus[state.selectedAction.id] = "done";
    saveState();
    closeDrawer();
    showToast("行动已完成, 等待 Outcome 回流");
    render();
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
      else if (state.role === "医药代表") state.route = "doctor";
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

  render();
})();
