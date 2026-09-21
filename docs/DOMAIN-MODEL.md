# ZG AI GPS Domain Model

## 1. 核心业务链

ZG AI GPS 的业务核心不是聊天，也不是报表，而是：

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
DecisionRule Validation / Update
      └──────────────────────► 下一轮 Decision
```

其中：

- ContextSnapshot 保存当时做判断所依据的事实、信号、限制和证据。
- Decision 保存“为什么选这个下一步”的结构化判断。
- NBA 保存可执行的 WHO / WHEN / WHAT / WHY / SUCCESS。
- Action 是一线真实执行动作。
- Outcome 是真实客户反馈、业务行为或里程碑变化。
- DecisionRule 只有在 Outcome 证据支持后才进入验证或升级。

## 2. Aggregate Overview

```text
Organization
└── Region
    └── Territory
        └── User

Hospital
├── Department
├── Doctor
├── Visit
└── ContextSnapshot

Doctor
├── Visit
├── ContextSnapshot
└── NBA

Visit
├── Transcript
├── Coaching Diagnosis
└── ContextSnapshot

ContextSnapshot
└── Decision
    └── NBA
        ├── Action
        └── Outcome

DecisionRule
├── Rule Evidence
├── Usage
└── Validation Outcome
```

## 3. Hospital

当前 Pilot 字段：

| 字段 | 含义 |
| --- | --- |
| id | 医院 ID |
| name | 医院名称 |
| tier | 战略重点 / 增长型 / 培育型 |
| department | 当前作战科室 |
| product | 当前产品 |
| regionId | 所属区域 |
| ownerUserId | 地区经理 |
| opportunityScore | 机会指数 |
| changeabilityScore | 可改变程度 |
| patientValue | 患者价值 |
| stage | 当前业务阶段 |
| target | 当前医院目标 |
| progress | 作战进度 |

未来建议拆出：

- Hospital Master
- Hospital Department
- Hospital Account Plan
- Hospital Ecology Relationship
- Hospital Opportunity
- Hospital Resource Plan

## 4. Doctor

当前字段：

| 字段 | 含义 |
| --- | --- |
| hospitalId | 所属医院 |
| name | 医生姓名 |
| title | 职称 |
| department | 科室 |
| influenceScore | 影响力 |
| support | 当前态度 |
| stage | 当前旅程阶段 |
| nextActionScore | 下一步行动优先级 |
| focus | 临床关注 |
| trigger | 当前触发场景 |
| gap | 当前 GAP |
| targetBehavior | 希望改变的行为 |
| ownerUserId | 负责代表 |

Doctor Agent 不能只生成画像。必须最终形成具体行为目标和 NBA。

## 5. Visit

Visit 是 Coaching Agent 的事实入口。

当前字段：

- hospitalId
- doctorId
- repUserId
- occurredAt
- result
- score
- primaryIssue
- severity
- summary
- nextScript

后续正式版本建议增加：

- visit_goal
- actual_topics
- transcript_id
- evidence_used
- objection_events
- commitment
- next_step
- compliance_flags
- manager_review
- outcome_id

## 6. ContextSnapshot

ContextSnapshot 是 Decision Engine 最关键的可追溯对象。

```json
{
  "id": "ctx-...",
  "targetType": "doctor",
  "targetId": "d1",
  "actor": "张蕾",
  "role": "医药代表",
  "facts": [],
  "signals": [],
  "constraints": [],
  "evidenceRefs": [],
  "createdAt": "..."
}
```

任何 NBA 都必须能回答：

> 当时系统是基于什么事实、信号、规则和证据做出这个判断？

因此不允许只保留最终模型文本。

## 7. Decision

Decision 保存 Agent 的结构化判断，而不是最终话术。

字段：

- contextSnapshotId
- decisionType
- priorityScore
- rationale
- ruleIds
- riskLevel
- humanReviewRequired
- createdAt

Decision 与 NBA 分离有几个重要原因：

1. 同一个 Decision 可以生成不同渠道的执行方案。
2. 可以独立审计“判断是否正确”和“表达是否正确”。
3. Rule Engine 可以评价 Decision，而不必解析自然语言。
4. 后续替换模型时仍能保持稳定业务语义。

## 8. NBA

NBA 是真正的 System of Action 对象。

必须包含：

```text
WHO
WHEN
WHAT
WHY
SUCCESS
```

当前字段：

- decisionId
- targetType
- targetId
- who
- when
- what
- why
- success
- owner
- dueAt
- status
- evidenceRefs

禁止把只有“建议关注”“建议加强”“可以考虑”这类模糊文本称为 NBA。

## 9. Action

Action 是 NBA 被组织接受后形成的可执行任务。

正式版本建议：

```text
NBA
 ↓ accept
Action
├── owner
├── due_at
├── status
├── execution_evidence
└── completed_at
```

Action 状态建议：

- proposed
- accepted
- doing
- done
- blocked
- cancelled

当前原型为了兼容已有界面仍使用：

- todo
- doing
- done
- risk

后续应统一。

## 10. Outcome

Outcome 不是“任务完成”。

它描述的是：

> 执行动作以后，客户行为或业务状态发生了什么变化？

当前字段：

- nbaId
- actionId
- targetType
- targetId
- result
- signal
- evidence
- effectiveness
- recordedBy
- occurredAt

示例：

错误：

```text
已完成拜访
```

正确：

```text
周主任同意在周三 MDT 中讨论 1 例符合条件患者。
```

只有后一种信息可以用于 Rule Learning。

## 11. DecisionRule

DecisionRule 不是 Prompt。

结构：

```text
Context
  ↓
Decision
  ↓
Action
  ↓
Expected Outcome
```

字段：

- title
- context
- decision
- action
- outcome
- confidence
- status
- uses
- appliesTo

状态：

- testing
- validated

正式版本建议进一步增加：

- rejected
- deprecated
- superseded

## 12. Rule Learning

当前 v0.4 的原则：

```text
生成 NBA
≠
模型学会
```

真正学习需要：

```text
Decision
  ↓
Action
  ↓
Outcome
  ↓
Evidence Review
  ↓
Rule confidence update
```

未来建议实现 Rule Validator：

```text
For each Rule:
    matched decisions
        ↓
    associated outcomes
        ↓
    effectiveness distribution
        ↓
    context consistency
        ↓
    confidence update proposal
        ↓
    Human Review
        ↓
    publish new rule version
```

高风险或医学相关规则禁止自动发布。

## 13. Decision Engine v0.1

当前 `lib/decision-engine.js` 已实现：

```text
1. Build Context
2. Select applicable Decision Rules
3. Score rules
4. Calculate priority
5. Produce structured Decision
6. Produce structured NBA
7. Persist ContextSnapshot
8. Persist Decision
9. Persist NBA
10. Increment Rule usage
```

当前是 deterministic local engine，方便 Pilot 先验证产品逻辑。

后续接入 LLM 时建议：

```text
Deterministic Context Builder
        ↓
Rule Retrieval
        ↓
LLM Reasoning / Candidate Generation
        ↓
Schema Validator
        ↓
Evidence Grounding
        ↓
Compliance Guardrail
        ↓
Decision Scorer
        ↓
Human Review Gate
        ↓
NBA
```

LLM 负责增强判断与生成，不应取代领域实体、审计链和规则边界。

## 14. Current API

领域查询：

```text
GET /api/domain/hospitals
GET /api/domain/hospitals/:id
GET /api/domain/doctors
GET /api/domain/doctors/:id
GET /api/domain/visits
GET /api/domain/visits/:id
GET /api/domain/decisions
GET /api/domain/outcomes
```

写入：

```text
POST /api/nba/generate
POST /api/domain/outcomes
POST /api/rules
PATCH /api/actions/:id
```

## 15. 下一阶段数据层

v0.4 仍使用：

```text
.runtime/runtime.json
```

目的是无依赖、可演示、便于验证业务闭环。

当进入真实客户 Pilot，建议迁移到 PostgreSQL：

核心表：

```text
organizations
regions
territories
users
roles
user_scopes

hospitals
departments
doctors
hospital_relationships

visits
visit_transcripts
visit_segments

context_snapshots
decisions
nbas
actions
outcomes

decision_rules
decision_rule_versions
rule_evidence
rule_validations

evidence_documents
audit_events
pilot_metrics
```

重点不是把 JSON 换成数据库，而是保持当前领域边界和 Decision Trace 不变。
