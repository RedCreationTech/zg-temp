window.ZG_DATA = {
  hospitals: [
    {
      id: "h1",
      name: "华东大学附属第一医院",
      tier: "战略重点",
      department: "心内科",
      product: "产品 A",
      opportunity: 86,
      changeability: 78,
      patientValue: "高",
      stage: "方案选择",
      target: "本季度推动核心科室形成 2 个稳定规范化治疗路径",
      progress: 64,
      levers: [
        { rank: 1, title: "方案选择节点的证据缺口", score: 92, detail: "覆盖频次足够, 但关键医生在患者方案选择节点缺少针对性真实世界证据.", who: "周主任 / 核心治疗组", when: "周三 MDT 前", what: "用真实世界研究证据澄清高风险患者获益", why: "当前主要流失发生在方案选择而非患者发现", success: "周主任同意在下一例符合条件患者中讨论该方案" },
        { rank: 2, title: "年轻医生临床路径认知不一致", score: 81, detail: "治疗组内部对目标患者的识别标准存在差异, 影响患者向规范路径转化.", who: "治疗组 4 位主治医生", when: "科室晨会后", what: "用病例卡统一目标患者识别要点", why: "减少患者筛选阶段的非必要流失", success: "4 位医生能复述 3 个关键识别条件" },
        { rank: 3, title: "准入后资源未形成协同", score: 73, detail: "医学、市场和代表的资源投入未围绕同一医院目标排布.", who: "地区经理 + 医学 + 市场", when: "本周五前", what: "完成 4 周资源节奏表", why: "避免平均投入和重复动作", success: "跨部门资源全部映射到 Top 3 杠杆点" }
      ]
    },
    {
      id: "h2",
      name: "滨江中心医院",
      tier: "增长型",
      department: "内分泌科",
      product: "产品 B",
      opportunity: 74,
      changeability: 88,
      patientValue: "中高",
      stage: "认知建立",
      target: "提高目标患者识别率并建立科室共识",
      progress: 51,
      levers: [
        { rank: 1, title: "患者识别标准仍不统一", score: 89, detail: "门诊患者量充足, 但目标患者筛选口径不一致.", who: "王主任 / 门诊组", when: "下周病例讨论", what: "围绕 3 类典型患者做病例共识", why: "机会主要卡在患者识别而非治疗意愿", success: "形成科室内部患者识别共识" },
        { rank: 2, title: "核心医生缺少同级案例", score: 78, detail: "现有证据充分, 但本地区同级医院可参考实践不足.", who: "王主任", when: "本周四", what: "提供同级医院脱敏实践案例", why: "降低采用新路径的不确定性", success: "确认一次病例实践交流" },
        { rank: 3, title: "代表跟进节奏不连续", score: 68, detail: "拜访有覆盖但缺少明确承诺和后续动作.", who: "负责代表", when: "每次拜访结束", what: "必须记录下一次承诺与成功信号", why: "保证动作可以追踪", success: "连续 4 周 NBA 完成率 > 85%" }
      ]
    },
    {
      id: "h3",
      name: "海川人民医院",
      tier: "培育型",
      department: "呼吸科",
      product: "产品 C",
      opportunity: 62,
      changeability: 57,
      patientValue: "中",
      stage: "准入准备",
      target: "完成关键利益相关者地图和准入前教育",
      progress: 37,
      levers: [
        { rank: 1, title: "关键影响者地图不完整", score: 76, detail: "现阶段最大的未知是决策链和跨科室影响关系.", who: "科主任 / 药学 / 准入角色", when: "未来两周", what: "补齐医院生态图与角色影响力", why: "准入前需要先确认真正决策链", success: "完成 90% 关键角色映射" },
        { rank: 2, title: "医学教育需要前置", score: 65, detail: "部分核心角色对疾病管理新路径认知不足.", who: "核心学术骨干", when: "月度学术会", what: "围绕诊疗路径组织小型学术沟通", why: "为后续准入创造共同语言", success: "关键角色认可目标患者价值" },
        { rank: 3, title: "当前资源投入过早", score: 54, detail: "在决策链未清晰前不宜扩大活动资源.", who: "地区经理", when: "立即", what: "暂缓大型活动资源, 先完成关键情报", why: "避免低确定性投入", success: "资源转向高信息增益动作" }
      ]
    }
  ],
  doctors: [
    {
      id: "d1",
      name: "周敏",
      title: "主任医师",
      hospital: "华东大学附属第一医院",
      department: "心内科",
      influence: 94,
      support: "中立偏支持",
      stage: "方案选择",
      nextScore: 93,
      tags: ["科室决策者", "学术驱动", "关注长期获益"],
      focus: "复杂患者的长期获益与风险平衡",
      trigger: "周三 MDT 有一例高风险患者进入治疗方案讨论",
      gap: "认可疾病管理价值, 但对目标亚组的真实世界获益仍有疑问",
      targetBehavior: "愿意在 MDT 中主动讨论产品 A 适用方案",
      script: [
        ["开场", "周主任, 上次您提到高风险患者最担心长期获益与安全性的平衡. 我准备了一个和您本周 MDT 病例非常接近的数据."],
        ["探询", "对于这类合并多重风险因素的患者, 您现在决定治疗方案时最看重哪两个指标?"],
        ["呈值", "这组真实世界数据可以直接回答您刚才提到的两个指标, 并且患者基线与贵科最近讨论的病例非常接近."],
        ["推进", "如果周三 MDT 的患者条件匹配, 您是否愿意把这个证据作为方案讨论的一部分?"]
      ],
      evidence: [
        ["RWE", "真实世界研究摘要", "2026-08 更新 · 企业医学审核通过"],
        ["GUIDE", "治疗路径指南摘录", "证据等级 A · 来源可追溯"],
        ["CASE", "同级医院脱敏病例", "已完成合规审核 · 可用于专业沟通"]
      ]
    },
    {
      id: "d2",
      name: "陈浩",
      title: "副主任医师",
      hospital: "华东大学附属第一医院",
      department: "心内科",
      influence: 82,
      support: "观望",
      stage: "认知深化",
      nextScore: 86,
      tags: ["治疗组骨干", "数据敏感", "年轻医生影响者"],
      focus: "指南一致性与患者筛选标准",
      trigger: "本周承担住院组病例讨论",
      gap: "对患者识别边界不够清晰",
      targetBehavior: "能准确识别目标患者并愿意进一步了解",
      script: [
        ["开场", "陈医生, 上次您问到目标患者边界, 我把指南和几个真实病例放到了一起."],
        ["探询", "您在病房最容易犹豫的是哪一类边界患者?"],
        ["呈值", "我们可以直接用三个病例看哪些患者值得进一步讨论."],
        ["推进", "下次住院组讨论时, 我们能否针对一例边界患者再做一次判断?"]
      ],
      evidence: [
        ["GUIDE", "指南患者筛选页", "医学部审核通过"],
        ["CASE", "3 类边界病例卡", "脱敏教学材料"],
        ["FAQ", "常见异议与证据索引", "2026-09 更新"]
      ]
    },
    {
      id: "d3",
      name: "王静",
      title: "科主任",
      hospital: "滨江中心医院",
      department: "内分泌科",
      influence: 91,
      support: "中立",
      stage: "认知建立",
      nextScore: 88,
      tags: ["科室负责人", "流程导向", "关注依从性"],
      focus: "患者长期管理与科室流程效率",
      trigger: "下周病例讨论会",
      gap: "尚未形成一致患者识别与随访路径",
      targetBehavior: "同意组织一次病例共识讨论",
      script: [
        ["开场", "王主任, 贵科患者量很大, 真正的机会可能不是增加覆盖, 而是把患者识别流程先统一起来."],
        ["探询", "目前门诊里哪一类患者最容易在识别和随访上出现差异?"],
        ["呈值", "我们整理了同级医院把识别标准嵌入病例讨论的做法."],
        ["推进", "下周病例会是否可以用 20 分钟做一次小范围共识?"]
      ],
      evidence: [
        ["CASE", "同级医院流程实践", "脱敏案例"],
        ["PATH", "患者旅程与流失点", "区域数据推演"],
        ["GUIDE", "指南标准摘要", "医学审核通过"]
      ]
    }
  ],
  visits: [
    {
      id: "v1",
      rep: "张蕾",
      doctor: "周敏",
      hospital: "华东大学附属第一医院",
      time: "今天 10:20",
      result: "部分推进",
      score: 72,
      issue: "探询不足",
      severity: "高",
      summary: "代表快速进入证据呈现, 没有先确认周主任本次对高风险患者最关注的决策标准.",
      quote: "代表: 我这里有一组新的真实世界数据...  医生: 数据我看过一些, 但我现在更关心这类患者到底怎么选.",
      dimensions: [["目标清晰", 88], ["探询质量", 54], ["价值呈现", 76], ["异议处理", 70], ["下一步推进", 69]],
      nextScript: "先用 2 个问题确认周主任的患者选择标准, 再调用与该标准直接对应的证据. 结束时明确请求在周三 MDT 中讨论一例匹配患者."
    },
    {
      id: "v2",
      rep: "刘晨",
      doctor: "陈浩",
      hospital: "华东大学附属第一医院",
      time: "昨天 16:40",
      result: "未形成承诺",
      score: 61,
      issue: "推进不够",
      severity: "高",
      summary: "沟通内容清楚, 但结尾没有形成可验证的下一步承诺.",
      quote: "医生: 这几个病例很有意思.  代表: 好的, 那您有空再看看, 我下次再来.",
      dimensions: [["目标清晰", 77], ["探询质量", 73], ["价值呈现", 79], ["异议处理", 66], ["下一步推进", 38]],
      nextScript: "保留原有病例沟通, 结尾改为请求在下次住院组讨论中共同判断 1 例边界患者, 并约定具体时间."
    },
    {
      id: "v3",
      rep: "赵倩",
      doctor: "王静",
      hospital: "滨江中心医院",
      time: "周五 14:00",
      result: "目标达成",
      score: 86,
      issue: "可复制经验",
      severity: "低",
      summary: "代表从科室流程问题切入, 先确认患者识别差异, 再引入同级医院案例, 成功获得病例讨论会邀请.",
      quote: "医生: 这个问题确实一直存在.  代表: 那我们不先谈产品, 先拿三个病例把识别标准跑一遍怎么样?",
      dimensions: [["目标清晰", 92], ["探询质量", 89], ["价值呈现", 84], ["异议处理", 77], ["下一步推进", 90]],
      nextScript: "复制该结构: 流程问题 → 真实探询 → 同级案例 → 小范围下一步承诺. 建议沉淀为同类医院 Rule."
    }
  ],
  actions: [
    { id: "a1", priority: 1, title: "确认周三 MDT 的病例切入", desc: "围绕周主任高风险患者决策场景, 用真实世界证据形成一次具体推进.", entity: "周敏 · 华东附一", owner: "张蕾", due: "今天 17:00", status: "todo", source: "Doctor Agent", success: "确认周三 MDT 中讨论一例匹配患者", why: "这是当前医院 Top 1 杠杆点的直接医生动作" },
    { id: "a2", priority: 1, title: "完成重点医院 4 周资源节奏表", desc: "把医学、市场、代表资源全部映射到 Top 3 医院杠杆点.", entity: "华东大学附一", owner: "李明", due: "明天 12:00", status: "doing", source: "Hospital Agent", success: "所有跨部门资源均有明确目标与成功信号", why: "当前存在资源分散和重复投入" },
    { id: "a3", priority: 2, title: "辅导张蕾重做探询开场", desc: "本次拜访探询质量 54 分, 需要在下一次拜访前完成脚本替换.", entity: "张蕾 · 周敏", owner: "李明", due: "今天", status: "todo", source: "Coaching Agent", success: "完成 1 次角色演练并形成新脚本", why: "探询不足是本次拜访的首要失效点" },
    { id: "a4", priority: 2, title: "确认滨江医院病例共识会", desc: "把医生兴趣转成下周可执行的小型病例共识会.", entity: "王静 · 滨江中心", owner: "赵倩", due: "本周四", status: "doing", source: "Doctor Agent", success: "确定日期、参与医生和 3 个病例", why: "患者识别标准是该院当前首要增长杠杆" },
    { id: "a5", priority: 3, title: "补齐海川医院关键影响者地图", desc: "识别准入、药学和科室影响角色, 暂缓低确定性活动投入.", entity: "海川人民医院", owner: "李明", due: "本周五", status: "todo", source: "Hospital Agent", success: "90% 关键角色有明确影响力和关系记录", why: "当前最大未知是医院决策链" },
    { id: "a6", priority: 3, title: "沉淀滨江流程切入打法", desc: "把赵倩成功拜访结构转成可测试 Decision Rule.", entity: "组织学习", owner: "销售卓越团队", due: "本周五", status: "todo", source: "Learning Engine", success: "形成 Rule 并在 2 家同类医院验证", why: "该打法具有明确 Context → Action → Outcome 链路" },
    { id: "a7", priority: 1, title: "辅导刘晨把“下次再来”改成具体承诺", desc: "最近一次拜访内容清楚, 但结束阶段没有形成病例、时间或行为承诺.", entity: "刘晨 · 陈浩", owner: "李明", due: "今天 16:30", status: "todo", source: "Coaching Agent", success: "完成角色演练, 并锁定下一次住院组病例讨论时间", why: "连续无承诺正在让高质量沟通停留在“觉得不错”而没有业务推进" }
  ],
  rules: [
    { id: "R-023", title: "流程问题优先于产品介绍", context: "增长型医院, 科室患者量充足但识别流程不一致", decision: "先诊断流程差异, 不直接进入产品价值", action: "用 3 个典型病例建立科室共识", outcome: "获得病例讨论会邀请", confidence: 91, status: "validated", uses: 12 },
    { id: "R-019", title: "高影响力医生的证据必须绑定具体决策场景", context: "医生认可疾病价值但对方案选择仍有疑虑", decision: "不增加泛化覆盖, 聚焦下一次具体决策场景", action: "用场景匹配证据推动一次可验证承诺", outcome: "目标行为推进率提升", confidence: 86, status: "validated", uses: 27 },
    { id: "R-031", title: "没有下一步承诺的拜访不算完成", context: "沟通满意但医生未形成明确下一步", decision: "必须在结束前形成时间或行为承诺", action: "把模糊跟进改成具体病例/会议/时间点", outcome: "连续跟进率改善", confidence: 74, status: "testing", uses: 8 },
    { id: "R-037", title: "决策链不清晰时优先购买信息", context: "培育型医院, 关键影响者与准入链路未知", decision: "暂停高成本活动资源", action: "优先完成生态图和影响关系验证", outcome: "减少低确定性资源消耗", confidence: 68, status: "testing", uses: 5 }
  ],
  risks: [
    { level: "高", object: "华东附一 · 周敏", issue: "关键医生行动停留在证据展示, 尚未形成 MDT 行为承诺", owner: "李明", action: "经理协访 + 脚本替换" },
    { level: "高", object: "刘晨", issue: "最近 3 次重点拜访均未形成明确下一步承诺", owner: "王芳", action: "进入辅导队列" },
    { level: "中", object: "海川人民医院", issue: "准入决策链完整度仅 58%, 资源投入存在提前风险", owner: "李明", action: "暂停活动, 补齐生态图" },
    { level: "中", object: "滨江中心医院", issue: "病例会已经获得口头意向, 但尚未锁定参与名单", owner: "赵倩", action: "48 小时内确认名单" }
  ]
};