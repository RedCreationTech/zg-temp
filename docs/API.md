# ZG AI GPS API Contract

当前仓库提供一个零依赖 Node.js Pilot Runtime。前端通过 `api-client.js` 调用 REST API；如果 API 不可用，自动回退到 `mock-api.js`。

v0.4 开始，服务端已经引入正式领域模型和结构化 Decision Engine。一次 NBA 生成不再只返回自然语言文本，而会产生并持久化 `ContextSnapshot → Decision → NBA`。

## Runtime

启动：

```bash
npm start
```

默认：

```text
http://localhost:8080
```

运行时状态写入：

```text
.runtime/runtime.json
```

该目录已加入 `.gitignore`。

## API

### GET /api/health

用于前端判断当前是 Pilot Server 还是 Browser Mock 模式。

Response:

```json
{
  "ok": true,
  "service": "ZG AI GPS Pilot Runtime",
  "version": "0.3.0",
  "now": "2026-09-21T10:00:00.000Z"
}
```

### GET /api/bootstrap

加载浏览器工作台运行时状态。

Response:

```json
{
  "ok": true,
  "actionStatus": {
    "a1": "done"
  },
  "customRules": [],
  "crmSync": {},
  "session": {}
}
```

### POST /api/session

记录用户进入工作台。

Request:

```json
{
  "name": "李明",
  "role": "地区经理"
}
```

### PATCH /api/actions/:id

更新 NBA / Action 状态。

Request:

```json
{
  "status": "done",
  "actor": "李明"
}
```

支持状态：

- todo
- doing
- done
- risk

### POST /api/nba/generate

统一结构化 Decision Engine 入口。

Request:

```json
{
  "type": "doctor",
  "actor": "张蕾",
  "role": "医药代表",
  "targetId": "d1",
  "context": {
    "doctorId": "d1",
    "hospitalId": "h1"
  }
}
```

`type` 支持：

- hospital
- doctor
- coaching
- cockpit

Response 核心结构：

```json
{
  "ok": true,
  "type": "doctor",
  "text": "WHO: ... WHEN: ... WHAT: ...",
  "context": {
    "id": "ctx-...",
    "targetType": "doctor",
    "targetId": "d1",
    "facts": [],
    "signals": [],
    "constraints": [],
    "evidenceRefs": []
  },
  "decision": {
    "id": "dec-...",
    "decisionType": "doctor",
    "priorityScore": 93,
    "rationale": "...",
    "ruleIds": ["R-019", "R-031"],
    "riskLevel": "low",
    "humanReviewRequired": false
  },
  "nba": {
    "id": "nba-...",
    "who": "周敏",
    "when": "...",
    "what": "...",
    "why": "...",
    "success": "..."
  },
  "rules": []
}
```

服务端同时持久化：

```text
ContextSnapshot
Decision
NBA
Rule usage
AuditEvent
```

Decision Pipeline：

```text
Context Builder
  ↓
Decision Rule Retrieval
  ↓
Rule Scoring
  ↓
Priority Calculation
  ↓
Structured Decision
  ↓
Structured NBA
  ↓
Audit + Persistence
```

后续接入 LLM 时应保持响应 Schema 稳定，而不是让页面直接依赖模型自由文本。

### POST /api/visits/transcribe

拜访语音转写与结构化诊断入口。

当前 Pilot Runtime 只接收文件名并返回模拟结果。

Request:

```json
{
  "fileName": "visit-20260921.m4a",
  "actor": "张蕾"
}
```

未来可以替换为：

- multipart 文件上传
- 对象存储 URL
- 企业录音平台 ID
- ASR Job ID

输出保持：

- transcript
- diagnosis.topIssue
- diagnosis.score
- diagnosis.evidence
- diagnosis.nextAction

### POST /api/rules

创建候选 Decision Rule。

Request:

```json
{
  "title": "先确认决策标准再呈现证据",
  "context": "高影响力医生进入方案选择阶段",
  "decision": "先确认医生当前患者选择标准",
  "action": "只调用与决策标准直接相关的证据",
  "outcome": "医生形成具体病例讨论承诺",
  "confidence": 60,
  "status": "testing"
}
```

正式生产环境应增加：

- created_by
- reviewed_by
- approved_by
- rule_version
- evidence_ids
- applicable_scope
- contraindications
- effective_from
- effective_to

### POST /api/crm/sync

模拟 CRM / SFE 数据同步。

Request:

```json
{
  "actor": "李明",
  "records": 1286
}
```

未来应拆分为：

- connector configuration
- sync job
- mapping
- validation
- reconciliation
- sync audit

### GET /api/org

返回组织、区域、用户与角色权限。

当前模型：

```text
Organization
└── Region
    ├── Regional Manager
    └── Representative
        └── Territory / Customer Scope
```

### GET /api/audit

返回最近的运行时审计事件。

当前记录：

- session.login
- nba.generate
- action.status
- visit.transcribe
- rule.create
- crm.sync


## Domain API

### GET /api/domain/hospitals

返回医院主数据和当前作战状态。

### GET /api/domain/hospitals/:id

返回 Hospital 360：

- hospital
- doctors
- visits

### GET /api/domain/doctors

支持：

```text
?hospitalId=h1
```

### GET /api/domain/doctors/:id

返回 Doctor 360：

- doctor
- hospital
- visits

### GET /api/domain/visits

支持：

- hospitalId
- doctorId
- repUserId

### GET /api/domain/visits/:id

返回拜访、医生和医院关联信息。

### GET /api/domain/decisions

返回最近持久化的：

- decisions
- nbas

用于 Decision Trace、审计和 Learning Engine。

### POST /api/domain/outcomes

执行 NBA 后回写真实业务结果。

Request：

```json
{
  "nbaId": "nba-...",
  "result": "已达成",
  "signal": "周主任同意在周三 MDT 讨论一例匹配患者",
  "evidence": "会议确认记录",
  "effectiveness": 90,
  "actor": "张蕾"
}
```

Outcome 的关键不是“任务完成”，而是可验证的客户行为或业务状态变化。

### GET /api/domain/outcomes

返回 Outcome 历史，用于：

- Rule Validation
- Learning Engine
- Pilot Value Measurement


## 前端容错

`api-client.js` 使用 API-first / Mock-fallback 策略：

```text
UI
 ↓
api-client.js
 ├── REST API 可用 → server.js
 └── REST API 不可用 → mock-api.js
```

因此：

- 直接打开 `index.html` 可以演示。
- 通过 `npm start` 运行时自动获得服务端持久化和审计。
- 后续替换真实后端时不需要重写页面交互。
