# ZG AI GPS API Contract

当前仓库提供一个零依赖 Node.js Pilot Runtime。前端通过 `api-client.js` 调用 REST API；如果 API 不可用，自动回退到 `mock-api.js`。

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

统一 NBA 生成入口。

Request:

```json
{
  "type": "hospital",
  "actor": "李明",
  "context": {
    "role": "地区经理",
    "route": "hospital"
  }
}
```

`type` 当前支持：

- hospital
- doctor
- coaching
- cockpit

后续真实模型接入时保持该接口稳定，将内部 Mock Decision Engine 替换为：

```text
Context Builder
  ↓
Policy / Guardrail
  ↓
Decision Rule Retrieval
  ↓
LLM / Decision Engine
  ↓
Evidence Validator
  ↓
NBA Structured Output
```

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
