# ZG AI GPS Prototype

基于《ZG AI_GPS_客户拜访版》实现的可交互产品原型。

## 产品定位

ZG AI GPS 是面向医药销售团队的 **System of Action**。它不是 CRM、BI、知识库或通用 Chatbot，而是把医院洞察、医生洞察、真实拜访、组织经验和企业规则，持续转成可执行的“下一步行动”。

核心闭环：

```text
Context → Decision → NBA → Action → Outcome → Rule Update
```

产品结构：

- 1 个母系统：ZG Pharma Sales AI GPS
- 3 个核心 Agent：
  - Hospital Agent：医院作战计划
  - Doctor Agent：医生行动导航
  - Visit Coaching Agent：拜访辅导
- 1 个管理驾驶舱：Director Decision Cockpit
- 1 个 Learning Engine：Decision Rules / Outcome Learning
- 1 个 Pilot Operations：8 周验证与扩展运营


## 推荐运行方式

当前版本推荐直接启动 Pilot Runtime：

```bash
npm start
```

然后访问：

```text
http://localhost:8080
```

这种方式会启用：

- REST API
- 服务端 Action 状态持久化
- Session 记录
- Decision Rule 持久化
- CRM / SFE 同步状态
- 组织与权限数据
- 审计日志
- 前端自动识别 Pilot Server 模式

运行时数据写入：

```text
.runtime/runtime.json
```

直接打开 `index.html` 仍然可用，此时系统自动进入 Browser Mock 模式。

## 架构与接口文档

- `docs/C4-ARCHITECTURE.md`：C1 / C2 / C3 架构与目标生产架构
- `docs/API.md`：Pilot REST API 契约、前端回退策略与后续真实服务边界

## 当前 MVP 功能

### 1. 登录与角色工作台

支持以以下角色进入系统：

- 地区经理
- 医药代表
- 销售总监

系统根据角色自动进入对应工作视角。

### 2. 今日行动

- 汇总各 Agent 输出的 Next Best Action
- P1 / P2 / P3 优先级
- 待执行 / 进行中 / 已完成状态
- 点击查看为什么现在做、Owner、截止时间、成功信号
- 标记行动完成
- Action → Outcome 回流提示
- localStorage 保存演示状态

### 3. Hospital Agent

- 医院机会指数
- 可改变程度
- 医院作战进度
- 机会价值矩阵
- Top 1–3 业务杠杆点
- WHO / WHEN / WHAT / WHY / SUCCESS
- 医院作战闭环
- 医院生态关系图
- 决策链、关键影响者和资源协同节点
- AI 流式生成医院下一步行动

### 4. Doctor Agent

- 重点医生优先级
- 医生画像
- 关键触发场景
- 当前 GAP
- 目标行为
- 下一次拜访脚本
- 核心证据包
- 医生决策旅程
- 历史触点
- AI 流式生成医生 NBA

### 5. Visit Coaching Agent

- 拜访质量评分
- 目标清晰度
- 探询质量
- 价值呈现
- 异议处理
- 下一步推进
- 关键拜访片段
- 问题类型诊断
- 下一次拜访脚本
- 经理检查证据
- 拜访录音上传入口
- Mock 语音转写
- AI 关键片段识别
- AI 辅导诊断
- AI 流式生成辅导 NBA

### 6. Director Decision Cockpit

围绕管理层 5 个问题组织：

1. 哪 3 家医院本周最值得关注？
2. 哪 5 个医生下一步最值得推进？
3. 哪些代表行动正在偏离策略？
4. 哪些拜访需要经理立即辅导？
5. 下一步应该加资源、纠偏、升级还是停止什么？

并展示：

- 策略偏离
- 重点医院动作
- 关键医生推进
- 管理层介入事项
- 资源调整建议
- Action → Outcome 指标

### 7. Learning Engine

- Decision Rules 列表
- Context
- Decision
- Action
- Outcome
- 置信度
- 验证中 / 已验证
- Rule 调用次数
- Human Review
- 新建 Rule 编辑器
- 自定义 Rule 持久化到 Pilot Runtime
- 真实 Decision Trace
- Outcome 回写
- ContextSnapshot → Decision → NBA → Outcome

### 8. Pilot Operations

独立的 8 周 Pilot 运营页：

- W1–W8 阶段进度
- Market Proof
- Product Proof
- 用户活跃率
- NBA 采纳率
- 行动完成率
- Review 覆盖率
- Rule 有效复用
- NBA → Action → Outcome 价值漏斗
- Pilot Gate
- Scale Readiness
- AI Pilot 决策简报

### 9. Organization & Access

- Organization / Region / Territory 基础模型
- 用户与角色
- RBAC 权限展示
- 数据范围
- 服务端运行模式识别
- 登录 / NBA / Action / Rule / CRM 同步审计

### 10. Enterprise Guardrails

- 内容防火墙
- 行为防火墙
- 医学证据来源
- FACT / INFERENCE / UNKNOWN
- Human Review
- 数据权限
- 敏感信息脱敏
- 审计
- SaaS / 私有化 / 混合部署

## Runtime 与 Decision Engine

当前版本同时支持两种运行模式。

### Pilot Server

推荐：

```bash
npm start
```

访问：

```text
http://localhost:8080
```

启用：

- REST API
- 服务端状态持久化
- 正式领域模型
- ContextSnapshot
- Decision
- Structured NBA
- Outcome
- Decision Rules
- Organization / RBAC
- Audit Log
- CRM Sync 状态
- Decision Trace

### Browser Mock

直接打开：

```text
index.html
```

系统自动回退到 Browser Mock。

因此客户拜访现场即使没有 Node 环境，也不会影响基础演示。

### Decision Engine v0.1

当前已经不是固定文本 NBA。

```text
Context Builder
    ↓
Decision Rule Retrieval
    ↓
Rule Scoring
    ↓
Priority Calculation
    ↓
Decision
    ↓
WHO / WHEN / WHAT / WHY / SUCCESS
    ↓
NBA
    ↓
Outcome
    ↓
Learning Engine
```

目前使用 deterministic local engine，目的是优先验证业务判断逻辑和闭环。

后续可在不改变领域对象和 API Schema 的情况下接入：

- OpenAI
- DeepSeek
- Qwen
- Kimi
- 企业私有模型
- 医学 RAG
- CRM / SFE

## 测试

```bash
npm run check
npm test
```

当前测试覆盖：

- Domain Model
- Hospital Decision
- Doctor Decision
- Coaching Decision
- Director Human Review
- Outcome Entity
- Decision Rule Validation
- Static App
- Session
- Action Persistence
- Structured NBA
- Decision Trace
- Outcome Feedback
- Hospital 360
- Rule Persistence
- Organization
- Audit
- Bootstrap

GitHub Actions 在 push / pull request 时执行同样的检查。

## 文档

- `docs/C4-ARCHITECTURE.md`
- `docs/API.md`
- `docs/DOMAIN-MODEL.md`
- `docs/STATE-MACHINE.md`
- `docs/POSTGRESQL-MIGRATION.md`
- `db/schema.sql`：PostgreSQL 15+ 正式数据模型

## 推荐演示路径

### 地区经理

```text
登录
→ 今日行动
→ 华东附一 Hospital Agent
→ 查看 Top 1 杠杆点
→ 医院生态关系
→ AI 生成本周行动
→ 进入医生导航
→ 周敏医生决策旅程
→ AI 生成拜访 NBA
→ 拜访辅导
→ 上传演示录音
→ 自动诊断探询不足
→ 生成下一次辅导 NBA
```

### 销售总监

```text
登录
→ Director Decision Cockpit
→ 查看需要介入的 4 个事项
→ 决定加资源 / 纠偏 / 停止
→ Pilot 运营
→ 查看 NBA → Action → Outcome 转化
→ 组织学习
→ 查看和新增 Decision Rules
```

## 技术结构

```text
index.html
styles.css
data.js
mock-api.js
api-client.js
app.js

server.js
lib/
├── seed-data.js
├── domain-model.js
└── decision-engine.js

test/
├── domain.js
└── smoke.js

docs/
├── C4-ARCHITECTURE.md
├── API.md
├── DOMAIN-MODEL.md
├── STATE-MACHINE.md
└── POSTGRESQL-MIGRATION.md

db/
└── schema.sql
```

运行时：

```text
.runtime/runtime.json
```

该文件不会提交 Git，用于本地 Pilot 的服务端持久化。

## 下一阶段

v0.5 已经完成 Node API、领域模型、Decision Engine、NBA → Action → Outcome → RuleValidation 状态机、组织权限、审计和 Human Review 闭环。

下一阶段重点不再是继续扩充假页面，而是进入真实客户 Pilot 数据能力：

1. PostgreSQL 替换 runtime.json
2. Hospital / Doctor / Visit Repository
3. PostgreSQL Repository + Migration
4. Decision Rule 版本管理
5. RuleValidation 统计模型与样本量门槛
6. CRM / SFE Connector
7. 医学知识库 / Evidence Service
8. 真实 ASR
9. Model Gateway
10. Structured LLM Decision Pipeline
11. Pilot Metric 自动采集
12. Enterprise SSO / OIDC
13. Region / Territory 数据隔离
14. 不可篡改 Audit Trail
15. 前端工程化为 Vue 3 / TypeScript

当前仓库已经从“客户演示页面”进入“可接真实数据并验证 Action–Outcome–Learning 的 Pilot MVP 骨架”阶段。
