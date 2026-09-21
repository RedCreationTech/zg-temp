# ZG AI GPS C4 Architecture

## C1 - System Context

```text
┌─────────────────────┐
│ 医药代表            │
│ Doctor NBA / Visit  │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│                     │
│   ZG Pharma Sales   │
│       AI GPS        │
│  System of Action   │
│                     │
└──────┬─────┬────────┘
       │     │
       │     └─────────────► 医学知识 / 企业知识
       │
       ├───────────────────► CRM / SFE
       │
       ├───────────────────► 拜访录音 / ASR
       │
       └───────────────────► 企业 IAM / 审计
           ▲
           │
┌──────────┴──────────┐
│ 地区经理 / 销售总监 │
│ Coaching / Cockpit  │
└─────────────────────┘
```

系统定位：

- CRM 是 System of Record。
- BI / SFE 是 System of Insight。
- ZG AI GPS 是 System of Action。
- Learning Engine 负责 Action → Outcome → Rule Update。

## C2 - Containers

```text
Browser
┌─────────────────────────────────────────┐
│ Web Prototype                           │
│ index.html / styles.css / app.js        │
│                                         │
│ - Role Workspace                        │
│ - Hospital Agent                        │
│ - Doctor Agent                          │
│ - Visit Coaching                        │
│ - Director Cockpit                      │
│ - Learning Engine UI                    │
│ - Pilot Operations                      │
│ - Organization & Access                 │
└──────────────────┬──────────────────────┘
                   │ REST
                   ▼
┌─────────────────────────────────────────┐
│ Pilot Runtime                           │
│ server.js                               │
│                                         │
│ - Session API                           │
│ - Action API                            │
│ - NBA API                               │
│ - Visit Review API                      │
│ - Rule API                              │
│ - CRM Sync API                          │
│ - Organization API                      │
│ - Audit API                             │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ Local Runtime Store                     │
│ .runtime/runtime.json                   │
│                                         │
│ - actionStatus                          │
│ - sessions                              │
│ - customRules                           │
│ - crmSync                               │
│ - audit                                 │
└─────────────────────────────────────────┘

Offline fallback:
Web Prototype → api-client.js → mock-api.js
```

## C3 - Major Components

### Frontend

```text
App Router
├── Today Action
├── Hospital Agent
├── Doctor Agent
├── Visit Coaching Agent
├── Director Decision Cockpit
├── Pilot Operations
├── Learning Engine
├── Enterprise Guardrails
└── Organization & Access
```

### API Client

```text
api-client.js
├── health()
├── bootstrap()
├── createSession()
├── updateActionStatus()
├── generateNBA()
├── transcribeVisit()
├── saveRule()
├── syncCRM()
├── getOrg()
└── getAudit()
```

### Pilot Runtime

```text
server.js
├── Static Web Server
├── Session Service
├── Action Service
├── Decision / NBA Service
├── Visit Review Service
├── Rule Service
├── Connector Service
├── Organization Service
├── Audit Service
└── JSON Runtime Repository
```

## Target Production Architecture

Pilot 版本不应该直接被当作生产架构。正式版本建议逐步拆分：

```text
Web / Mobile
    │
API Gateway / BFF
    │
    ├── Identity & Organization
    ├── Customer Context Service
    │   ├── Hospital 360
    │   └── Doctor 360
    ├── Interaction Service
    ├── Action Service
    ├── Coaching Service
    ├── Decision Engine
    │   ├── Context Builder
    │   ├── Rule Retrieval
    │   ├── Model Gateway
    │   ├── Evidence Grounding
    │   └── Guardrails
    ├── Rule / Learning Engine
    ├── Knowledge & Evidence Service
    ├── Connector Service
    └── Audit / Compliance Service

Data:
PostgreSQL + Object Storage + Vector Store + Search Index
```

## Core Domain Objects

```text
Organization
Region
Territory
User
Role

Hospital
Department
Doctor
Relationship

Visit
Interaction
Transcript
Evidence

ContextSnapshot
Decision
NBA
Action
Outcome

DecisionRule
RuleEvidence
RuleValidation

Pilot
PilotMetric
Review
AuditEvent
```

## Main Domain Loop

```text
ContextSnapshot
      ↓
Decision
      ↓
NBA
      ↓
Action
      ↓
Outcome
      ↓
RuleValidation
      ↓
DecisionRule Update
      └─────────────► next Decision
```

任何只输出画像、分析或文本建议，却没有形成 NBA / Action / Outcome 的功能，都不属于完整的 AI GPS 业务闭环。

## Security Boundary

生产环境至少需要：

- Enterprise SSO / OIDC
- RBAC + Data Scope
- Region / Territory 数据隔离
- 医学内容版本与审批
- Evidence Traceability
- Human Review Gate
- Sensitive Data Masking
- Encryption in transit / at rest
- Immutable Audit
- Model input/output audit
- Prompt / Rule versioning
