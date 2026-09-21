# ZG AI GPS Frontend Prototype

基于《ZG AI_GPS_客户拜访版》实现的纯前端高保真交互原型。

当前阶段的目标不是建设真实后端，而是用于：

- 客户拜访演示
- 产品需求确认
- 用户流程验证
- UI / UX 评审
- Agent 产品形态验证
- Pilot 方案沟通

## 当前原则

### 纯前端

当前原型：

- 不连接真实数据库
- 不连接真实 CRM / SFE
- 不调用真实大模型
- 不上传真实拜访录音
- 不需要 Node / Java / Python 后端
- 不需要安装依赖

所有状态和“AI 行为”均在浏览器中模拟。

### 浏览器内模拟完整业务闭环

虽然没有后端，但原型仍完整展示：

```text
Context
  ↓
Decision
  ↓
NBA
  ↓
Action
  ↓
Outcome
  ↓
Rule Validation
  ↓
Learning
```

这些对象只用于演示产品逻辑，不代表当前已经实现真实业务服务。

## 产品结构

```text
ZG Pharma Sales AI GPS
├── 今日行动
├── Hospital Agent
├── Doctor Agent
├── Visit Coaching Agent
├── Director Decision Cockpit
├── Pilot Operations
├── Learning Engine
├── Enterprise Guardrails
└── Organization & Access
```

## 当前页面

### 1. 今日行动

展示不同 Agent 生成的下一步行动：

- P1 / P2 / P3 优先级
- 待执行
- 进行中
- 已完成
- Owner
- 截止时间
- Success Signal
- 为什么现在做

支持点击行动并模拟完成状态。

### 2. Hospital Agent

围绕“这家医院下一步最值得打哪里”展示：

- 医院机会指数
- 可改变程度
- 当前作战阶段
- 作战进度
- 机会价值矩阵
- Top 1–3 业务杠杆点
- 医院生态关系图
- WHO / WHEN / WHAT / WHY / SUCCESS
- AI 生成本周行动计划

### 3. Doctor Agent

围绕“这个医生，这一次，下一步做什么”展示：

- 医生优先级
- 医生画像
- 临床关注
- 当前 GAP
- 关键触发场景
- 目标行为
- 医生决策旅程
- 历史互动时间线
- 下一次拜访脚本
- 核心证据包
- 证据来源追溯
- 医学审核状态
- FACT / INFERENCE 边界
- AI 生成医生 NBA

### 4. Visit Coaching Agent

围绕一次真实拜访复盘展示：

- 拜访评分
- 目标清晰度
- 探询质量
- 价值呈现
- 异议处理
- 下一步推进
- 关键拜访片段
- 首要问题诊断
- 下一次拜访脚本
- “原话 → 建议替换”关键句对比
- 经理检查证据

同时提供“上传拜访录音”交互入口。

当前不会真实上传文件，只在浏览器内模拟：

```text
录音
→ 转写
→ 关键片段识别
→ 问题诊断
→ 下一次辅导 NBA
```

### 5. Director Decision Cockpit

围绕管理层的五个问题：

1. 哪 3 家医院本周最值得关注？
2. 哪 5 个医生下一步最值得推进？
3. 哪些代表行动正在偏离策略？
4. 哪些拜访需要经理立即辅导？
5. 下一步应该加资源、纠偏、升级还是停止什么？

展示：

- 重点医院
- 关键医生
- 策略偏离
- 经理辅导
- 管理层介入事项
- 资源配置建议
- Action → Outcome

### 6. Pilot Operations

模拟 8 周付费 Pilot：

```text
W1 启动
W2 诊断
W3-W6 GPS 运行
W7 复盘
W8 价值评估
```

展示：

- 周活跃率
- NBA 采纳率
- 行动完成率
- Review 覆盖率
- Rule 复用
- NBA → Action → Outcome 漏斗
- Market Proof
- Product Proof
- Scale Readiness

### 7. Learning Engine

用于演示：

```text
Context
→ Decision
→ NBA
→ Action
→ Outcome
→ Decision Rule
```

支持：

- Decision Trace
- Decision Rules
- Outcome 回流
- Rule Validation Queue
- Human Review
- 新建 Rule
- 批准 / 驳回 RuleValidation

全部为前端模拟。

### 8. Enterprise Guardrails

展示企业级要求：

- 内容防火墙
- 行为防火墙
- 医学证据来源
- FACT / INFERENCE / UNKNOWN
- Human Review
- 数据权限
- 敏感信息脱敏
- 审计
- SaaS / 私有化 / 混合部署概念

### 9. Organization & Access

展示：

- Organization
- Region
- User
- 医药代表
- 地区经理
- 销售总监
- RBAC 权限
- 数据范围
- 原型审计记录

## AI 行为如何模拟

`mock-api.js` 是浏览器内的“原型状态引擎”。

它模拟：

```text
generateNBA()
acceptNBA()
recordOutcome()
reviewRuleValidation()
transcribeVisit()
saveRule()
syncCRM()
createSession()
updateActionStatus()
```

不会发送网络请求。

## 原型状态保存

使用浏览器：

```text
localStorage
```

模拟保存：

- 当前角色
- Action 状态
- Decision Trace
- NBA
- Outcome
- RuleValidation
- 自定义 Rule
- 审计事件
- CRM 同步演示状态

如果希望恢复初始演示状态，可以清除浏览器站点数据或 localStorage。

## 运行

最简单的方式：

```text
直接打开 index.html
```

也可以使用任何普通静态文件服务器。

不需要：

```text
npm install
npm start
数据库
后端服务
```

## 内置客户演示场景

当前首页提供 3 套可以直接点击切换的脱敏业务故事：

### 重点医院攻坚

```text
华东附一
→ 找出方案选择节点的证据缺口
→ 落到周主任 MDT 场景
→ 生成医生 NBA
→ 复盘拜访
→ 管理层资源决策
```

### 关键医生突破

```text
滨江中心
→ 患者识别标准不一致
→ 王静主任
→ 从医生兴趣推进到病例共识会
→ 沉淀可复制打法
```

### 拜访失效修复

```text
刘晨 → 陈浩
→ 内容讲清楚但没有承诺
→ 找到“推进不够”
→ 关键句替换
→ 角色演练
→ 下一次检查证据
```

切换场景后，系统会自动联动：

- 当前角色
- 当前医院
- 当前医生
- 当前拜访
- 首页行动优先级
- AI 今日洞察

## 7 步客户演示导览

页面右下角提供“客户演示”入口。

导览顺序：

```text
01 今日行动
02 Hospital Agent
03 Doctor Agent
04 Visit Coaching
05 Director Cockpit
06 Learning Engine
07 Pilot Operations
```

导览过程中会自动切换到对应岗位：

```text
地区经理
→ 医药代表
→ 地区经理
→ 销售总监
```

因此可以直接用同一套故事向客户解释“同一个业务目标如何在不同岗位之间持续推进”。

首页同时增加：

```text
Hospital Agent
→ Doctor Agent
→ Coaching Agent
→ Decision Cockpit
```

的 Agent Team 行动交接视图。

## 演示重置

首页“客户演示场景”区域提供“一键重置演示”。

它会清除浏览器中的：

- Action 状态
- Decision Trace
- NBA
- Outcome
- RuleValidation
- 自定义 Rule
- 原型审计事件
- 当前场景

然后重新进入初始演示环境。

## 推荐客户演示路线

### 地区经理路线

```text
登录
→ 今日行动
→ Hospital Agent
→ 查看重点医院机会
→ 查看医院生态关系
→ AI 生成医院 NBA
→ 采纳 Action
→ Doctor Agent
→ 医生决策旅程
→ AI 生成拜访 NBA
→ Visit Coaching
→ 模拟录音转写
→ 下一次辅导建议
→ Outcome 回流
→ Learning Engine
```

### 销售总监路线

```text
登录
→ Director Decision Cockpit
→ 查看需要管理层介入的事项
→ 加资源 / 纠偏 / 停止
→ Pilot Operations
→ 查看 NBA → Action → Outcome
→ Learning Engine
→ Rule Validation
→ Human Review
```

## 当前代码结构

```text
index.html
styles.css
data.js
mock-api.js
app.js
README.md
```

说明：

- `index.html`: 页面骨架
- `styles.css`: UI Design System
- `data.js`: 脱敏演示数据
- `mock-api.js`: 浏览器内状态和 AI 行为模拟
- `app.js`: 页面、路由和交互逻辑

## 当前阶段不做

暂时不建设：

- PostgreSQL
- Java / Node 后端
- REST API
- CRM Connector
- 真实 ASR
- 真实大模型
- RAG
- SSO
- 正式权限服务
- 服务端审计
- 部署架构

这些内容等客户确认产品流程和原型后，再进入正式工程阶段。

## 当前目标

当前唯一目标是：

> 让客户看见系统以后，能够完整理解 AI GPS 怎么改变地区经理、医药代表和销售总监每天的工作方式。

因此优先级是：

```text
产品体验
> 页面完整度
> 交互可信度
> 演示故事完整性
> 技术实现复杂度
```
