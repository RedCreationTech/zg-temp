"use strict";

const hospitals = [
  {
    id: "h1",
    type: "Hospital",
    name: "华东大学附属第一医院",
    tier: "战略重点",
    department: "心内科",
    product: "产品 A",
    regionId: "r-east",
    ownerUserId: "u-rm-01",
    opportunityScore: 86,
    changeabilityScore: 78,
    patientValue: "高",
    stage: "方案选择",
    target: "本季度推动核心科室形成 2 个稳定规范化治疗路径",
    progress: 64,
    updatedAt: "2026-09-21T09:00:00.000Z"
  },
  {
    id: "h2",
    type: "Hospital",
    name: "滨江中心医院",
    tier: "增长型",
    department: "内分泌科",
    product: "产品 B",
    regionId: "r-east",
    ownerUserId: "u-rm-01",
    opportunityScore: 74,
    changeabilityScore: 88,
    patientValue: "中高",
    stage: "认知建立",
    target: "提高目标患者识别率并建立科室共识",
    progress: 51,
    updatedAt: "2026-09-21T09:00:00.000Z"
  },
  {
    id: "h3",
    type: "Hospital",
    name: "海川人民医院",
    tier: "培育型",
    department: "呼吸科",
    product: "产品 C",
    regionId: "r-east",
    ownerUserId: "u-rm-01",
    opportunityScore: 62,
    changeabilityScore: 57,
    patientValue: "中",
    stage: "准入准备",
    target: "完成关键利益相关者地图和准入前教育",
    progress: 37,
    updatedAt: "2026-09-21T09:00:00.000Z"
  }
];

const doctors = [
  {
    id: "d1",
    type: "Doctor",
    hospitalId: "h1",
    name: "周敏",
    title: "主任医师",
    department: "心内科",
    influenceScore: 94,
    support: "中立偏支持",
    stage: "方案选择",
    nextActionScore: 93,
    focus: "复杂患者的长期获益与风险平衡",
    trigger: "周三 MDT 有一例高风险患者进入治疗方案讨论",
    gap: "认可疾病管理价值, 但对目标亚组的真实世界获益仍有疑问",
    targetBehavior: "愿意在 MDT 中主动讨论产品 A 适用方案",
    ownerUserId: "u-rep-01",
    updatedAt: "2026-09-21T09:10:00.000Z"
  },
  {
    id: "d2",
    type: "Doctor",
    hospitalId: "h1",
    name: "陈浩",
    title: "副主任医师",
    department: "心内科",
    influenceScore: 82,
    support: "观望",
    stage: "认知深化",
    nextActionScore: 86,
    focus: "指南一致性与患者筛选标准",
    trigger: "本周承担住院组病例讨论",
    gap: "对患者识别边界不够清晰",
    targetBehavior: "能准确识别目标患者并愿意进一步了解",
    ownerUserId: "u-rep-02",
    updatedAt: "2026-09-21T09:10:00.000Z"
  },
  {
    id: "d3",
    type: "Doctor",
    hospitalId: "h2",
    name: "王静",
    title: "科主任",
    department: "内分泌科",
    influenceScore: 91,
    support: "中立",
    stage: "认知建立",
    nextActionScore: 88,
    focus: "患者长期管理与科室流程效率",
    trigger: "下周病例讨论会",
    gap: "尚未形成一致患者识别与随访路径",
    targetBehavior: "同意组织一次病例共识讨论",
    ownerUserId: "u-rep-01",
    updatedAt: "2026-09-21T09:10:00.000Z"
  }
];

const visits = [
  {
    id: "v1",
    type: "Visit",
    hospitalId: "h1",
    doctorId: "d1",
    repUserId: "u-rep-01",
    repName: "张蕾",
    occurredAt: "2026-09-21T10:20:00+08:00",
    result: "部分推进",
    score: 72,
    primaryIssue: "探询不足",
    severity: "高",
    summary: "代表快速进入证据呈现, 没有先确认周主任本次对高风险患者最关注的决策标准.",
    nextScript: "先用 2 个问题确认周主任的患者选择标准, 再调用与该标准直接对应的证据. 结束时明确请求在周三 MDT 中讨论一例匹配患者."
  },
  {
    id: "v2",
    type: "Visit",
    hospitalId: "h1",
    doctorId: "d2",
    repUserId: "u-rep-02",
    repName: "刘晨",
    occurredAt: "2026-09-20T16:40:00+08:00",
    result: "未形成承诺",
    score: 61,
    primaryIssue: "推进不够",
    severity: "高",
    summary: "沟通内容清楚, 但结尾没有形成可验证的下一步承诺.",
    nextScript: "保留原有病例沟通, 结尾改为请求在下次住院组讨论中共同判断 1 例边界患者, 并约定具体时间."
  },
  {
    id: "v3",
    type: "Visit",
    hospitalId: "h2",
    doctorId: "d3",
    repUserId: "u-rep-01",
    repName: "赵倩",
    occurredAt: "2026-09-18T14:00:00+08:00",
    result: "目标达成",
    score: 86,
    primaryIssue: "可复制经验",
    severity: "低",
    summary: "代表从科室流程问题切入, 先确认患者识别差异, 再引入同级医院案例, 成功获得病例讨论会邀请.",
    nextScript: "复制该结构: 流程问题 → 真实探询 → 同级案例 → 小范围下一步承诺."
  }
];

const rules = [
  {
    id: "R-023",
    type: "DecisionRule",
    title: "流程问题优先于产品介绍",
    context: "增长型医院, 科室患者量充足但识别流程不一致",
    decision: "先诊断流程差异, 不直接进入产品价值",
    action: "用 3 个典型病例建立科室共识",
    outcome: "获得病例讨论会邀请",
    confidence: 91,
    status: "validated",
    uses: 12,
    appliesTo: ["hospital", "doctor"]
  },
  {
    id: "R-019",
    type: "DecisionRule",
    title: "高影响力医生的证据必须绑定具体决策场景",
    context: "医生认可疾病价值但对方案选择仍有疑虑",
    decision: "不增加泛化覆盖, 聚焦下一次具体决策场景",
    action: "用场景匹配证据推动一次可验证承诺",
    outcome: "目标行为推进率提升",
    confidence: 86,
    status: "validated",
    uses: 27,
    appliesTo: ["doctor", "coaching"]
  },
  {
    id: "R-031",
    type: "DecisionRule",
    title: "没有下一步承诺的拜访不算完成",
    context: "沟通满意但医生未形成明确下一步",
    decision: "必须在结束前形成时间或行为承诺",
    action: "把模糊跟进改成具体病例/会议/时间点",
    outcome: "连续跟进率改善",
    confidence: 74,
    status: "testing",
    uses: 8,
    appliesTo: ["doctor", "coaching"]
  },
  {
    id: "R-037",
    type: "DecisionRule",
    title: "决策链不清晰时优先购买信息",
    context: "培育型医院, 关键影响者与准入链路未知",
    decision: "暂停高成本活动资源",
    action: "优先完成生态图和影响关系验证",
    outcome: "减少低确定性资源消耗",
    confidence: 68,
    status: "testing",
    uses: 5,
    appliesTo: ["hospital", "cockpit"]
  }
];

const actions = [
  {
    id: "a1",
    type: "Action",
    sourceType: "doctor",
    sourceEntityId: "d1",
    hospitalId: "h1",
    doctorId: "d1",
    ownerUserId: "u-rep-01",
    priority: 1,
    title: "确认周三 MDT 的病例切入",
    status: "todo",
    successSignal: "确认周三 MDT 中讨论一例匹配患者"
  },
  {
    id: "a2",
    type: "Action",
    sourceType: "hospital",
    sourceEntityId: "h1",
    hospitalId: "h1",
    ownerUserId: "u-rm-01",
    priority: 1,
    title: "完成重点医院 4 周资源节奏表",
    status: "doing",
    successSignal: "所有跨部门资源均有明确目标与成功信号"
  }
];

function createSeedDomain() {
  return {
    hospitals: JSON.parse(JSON.stringify(hospitals)),
    doctors: JSON.parse(JSON.stringify(doctors)),
    visits: JSON.parse(JSON.stringify(visits)),
    rules: JSON.parse(JSON.stringify(rules)),
    actions: JSON.parse(JSON.stringify(actions)),
    contextSnapshots: [],
    decisions: [],
    nbas: [],
    outcomes: []
  };
}

module.exports = {
  createSeedDomain,
  hospitals,
  doctors,
  visits,
  rules,
  actions
};
