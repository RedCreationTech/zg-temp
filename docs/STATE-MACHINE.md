# ZG AI GPS Action & Learning State Machine

## 1. Why

AI GPS 的核心不只是“生成建议”，而是把一个判断推进到真实业务结果：

```text
NBA
 ↓ accept
Action
 ↓ execute
Outcome
 ↓ validate
RuleValidation
 ↓ review
DecisionRule
```

## 2. NBA Lifecycle

```text
proposed
   │
   ├── reject / ignore
   │
   └── accept
         ↓
      accepted
         ↓
       Action
```

当前 API：

```text
POST /api/nba/generate
POST /api/nbas/:id/accept
```

## 3. Action Lifecycle

当前 Pilot 状态：

```text
todo
 ↓
doing
 ├── risk
 └── done
```

Action 来自已采纳 NBA，而不是人工孤立创建。

Action 记录：

- nbaId
- sourceType
- sourceEntityId
- hospitalId
- doctorId
- owner
- priority
- title
- description
- successSignal
- dueAt
- acceptedBy
- acceptedAt
- completedAt

API：

```text
GET   /api/domain/actions
PATCH /api/actions/:id
```

## 4. Outcome Lifecycle

Outcome 只描述真实业务变化。

```text
Action done
   ↓
Outcome
   ├── result
   ├── signal
   ├── evidence
   └── effectiveness
```

Example:

```text
result:
已达成

signal:
周主任同意在周三 MDT 讨论一例匹配患者

effectiveness:
90
```

系统写入 Outcome 后：

1. NBA 标记为 measured。
2. 关联 Action 自动标记 done。
3. 查找原 Decision 使用过的 Rules。
4. 为每条 Rule 生成 RuleValidation。
5. 低风险验证可以应用 confidence delta。
6. 高风险验证进入 Human Review Queue。

## 5. RuleValidation

结构：

```text
RuleValidation
├── ruleId
├── decisionId
├── nbaId
├── outcomeId
├── previousConfidence
├── proposedConfidence
├── delta
├── evidenceDirection
├── effectiveness
├── signal
├── humanReviewRequired
└── status
```

status:

```text
proposed
applied
review_required
approved
rejected
```

## 6. Confidence Proposal

当前 v0.5 的简单 deterministic 策略：

| Effectiveness | Confidence Delta |
| --- | ---: |
| >= 85 | +4 |
| >= 70 | +2 |
| >= 55 | +1 |
| >= 40 | -1 |
| >= 20 | -3 |
| < 20 | -5 |

这不是最终统计模型，只用于 Pilot 验证 Learning Loop。

真实生产环境建议改成：

```text
Rule Match
  ↓
Outcome Set
  ↓
Context Similarity
  ↓
Sample Size
  ↓
Effect Distribution
  ↓
Bayesian / Statistical Confidence
  ↓
Validation Proposal
```

## 7. Human Review Gate

以下情况默认要求人工审核：

- 原 Decision 本身要求 Human Review。
- Rule 涉及医学、证据、适应症、合规等高风险语义。
- Confidence 提议达到较高阈值。
- 后续生产环境可增加业务影响和风险级别策略。

API：

```text
GET  /api/domain/rule-validations
POST /api/domain/rule-validations/:id/review
```

Review body：

```json
{
  "action": "approve",
  "actor": "销售卓越负责人"
}
```

or:

```json
{
  "action": "reject",
  "actor": "销售卓越负责人"
}
```

## 8. Learning Principle

系统不会：

```text
LLM 生成一次好答案
→ 自动修改正式组织规则
```

系统采用：

```text
Context
→ Decision
→ NBA
→ Action
→ Outcome
→ RuleValidation
→ Human Review
→ New Rule State
```

这是 AI GPS 与普通 Chatbot / Copilot 的关键架构差异之一。

## 9. Future Production State Machine

正式版本建议扩展：

### NBA

```text
draft
proposed
review_required
approved
accepted
expired
rejected
```

### Action

```text
planned
accepted
doing
blocked
done
cancelled
expired
```

### Outcome

```text
pending
observed
verified
disputed
invalid
```

### RuleValidation

```text
collecting
proposed
review_required
approved
rejected
superseded
```

## 10. Audit

当前以下事件全部写审计：

- nba.generate
- nba.accept
- action.status
- outcome.record
- rule.create
- rule.validation.review
- visit.transcribe
- crm.sync
- session.login

生产环境需要升级为 append-only / immutable audit storage。
