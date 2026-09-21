# PostgreSQL Migration Plan

## Goal

v0.5 仍使用：

```text
.runtime/runtime.json
```

用于零依赖客户演示和快速 Pilot 验证。

当进入真实客户数据阶段，目标是切换到：

```text
PostgreSQL
```

但保持以下边界不变：

```text
ContextSnapshot
Decision
NBA
Action
Outcome
DecisionRule
RuleValidation
AuditEvent
```

## 1. Migration Principle

不要让页面直接知道数据库。

保持：

```text
Web UI
  ↓
REST API
  ↓
Domain Service
  ↓
Repository Interface
  ├── JSON Runtime Repository
  └── PostgreSQL Repository
```

因此数据库迁移只替换 Repository，不改变：

- UI
- API Contract
- Decision Engine
- Learning Engine
- Domain Model

## 2. Target Schema

SQL:

```text
db/schema.sql
```

核心表：

### Organization

- organizations
- regions
- territories
- users

### Customer

- hospitals
- departments
- doctors
- hospital_relationships

### Interaction

- visits
- visit_transcripts

### Evidence

- evidence_documents

### Decision

- context_snapshots
- decisions
- nbas

### Execution

- actions
- outcomes

### Learning

- decision_rules
- decision_rule_versions
- rule_validations

### Operations

- pilot_metrics
- audit_events

## 3. Runtime JSON Mapping

### domain.hospitals

```text
→ hospitals
```

### domain.doctors

```text
→ doctors
```

### domain.visits

```text
→ visits
```

### domain.contextSnapshots

```text
→ context_snapshots
```

### domain.decisions

```text
→ decisions
```

### domain.nbas

```text
→ nbas
```

### domain.actions

```text
→ actions
```

### domain.outcomes

```text
→ outcomes
```

### domain.rules

拆分：

```text
decision_rules
decision_rule_versions
```

### domain.ruleValidations

```text
→ rule_validations
```

### audit

```text
→ audit_events
```

## 4. IDs

当前 Prototype 使用：

```text
h1
d1
v1
R-019
nba-...
dec-...
ctx-...
```

PostgreSQL schema 第一阶段继续使用 TEXT ID。

原因：

1. 可以直接迁移现有 Runtime 数据。
2. CRM / SFE 往往已有外部主键。
3. 不需要在 Pilot 切库时做全量 ID 重映射。
4. 后续可以新增内部 UUID，而不是强制替换现有业务 ID。

正式生产建议：

```text
internal_id UUID
external/business id TEXT
```

但不是 Pilot 前置条件。

## 5. Rule Versioning

JSON Runtime 当前每条 Rule 是一个对象。

PostgreSQL 版本拆为：

```text
decision_rules
  ↓
decision_rule_versions
```

Example:

```text
R-019
├── v1
├── v2
└── v3 current
```

Rule 主表负责：

- current state
- confidence
- current version
- applies_to

Rule Version 负责：

- context
- decision
- action
- expected outcome
- contraindications
- evidence refs
- review status

这样才能实现：

- 历史可追溯
- Rule rollback
- Human Review
- 不同版本效果比较

## 6. Audit Migration

当前：

```json
{
  "event": "nba.generate",
  "actor": "张蕾",
  "object": "nba-xxx",
  "detail": "..."
}
```

生产：

```text
audit_events
```

建议追加：

- organization_id
- actor_user_id
- object_type
- object_id
- correlation_id
- request_id
- model_id
- prompt_version
- rule_versions
- immutable_hash

Audit 必须 append-only。

业务代码不得 UPDATE / DELETE 历史审计记录。

## 7. CRM / SFE Mapping

建议每个主数据实体保留：

```text
source_system
source_id
source_updated_at
```

例如：

```text
hospital
source_system = "salesforce"
source_id     = "001xxxx"
```

禁止直接把 CRM 数据结构复制成 AI GPS 的领域结构。

正确方式：

```text
CRM Schema
    ↓
Connector
    ↓
Canonical Mapping
    ↓
AI GPS Domain Model
```

这样以后切换：

- Salesforce
- Veeva
- SAP
- 自研 CRM

不会重构 Agent。

## 8. Recommended Repository Interface

未来代码建议：

```js
class HospitalRepository {
  findById(id) {}
  listByRegion(regionId) {}
  save(hospital) {}
}

class DecisionRepository {
  saveContext(snapshot) {}
  saveDecision(decision) {}
  saveNBA(nba) {}
  listTrace(filters) {}
}

class ActionRepository {
  acceptNBA(nba, actor) {}
  updateStatus(actionId, status) {}
}

class OutcomeRepository {
  save(outcome) {}
  listByNBA(nbaId) {}
}

class RuleRepository {
  listApplicable(context) {}
  saveVersion(ruleVersion) {}
  saveValidation(validation) {}
}
```

第一阶段：

```text
JsonRuntimeRepository
```

第二阶段：

```text
PostgresRepository
```

通过同一接口切换。

## 9. Migration Sequence

建议顺序：

### Phase 1

创建 PostgreSQL：

```bash
psql -f db/schema.sql
```

### Phase 2

导入基础组织：

- organization
- region
- user

### Phase 3

导入主数据：

- hospitals
- doctors
- visits

### Phase 4

导入 Decision Trace：

- context_snapshots
- decisions
- nbas

### Phase 5

导入 Learning：

- actions
- outcomes
- rules
- rule versions
- rule validations

### Phase 6

切换 API Repository。

### Phase 7

双写观察：

```text
JSON + PostgreSQL
```

短期运行。

对比：

- entity count
- status
- decision trace
- outcome links
- rule confidence

一致以后：

```text
PostgreSQL primary
JSON disabled
```

## 10. Data Quality Gates

迁移前必须检查：

### Hospital

- duplicate hospitals
- missing region
- missing owner

### Doctor

- missing hospital
- duplicate source IDs
- invalid owner

### Visit

- missing doctor
- invalid occurred_at
- unknown rep

### Decision

- missing ContextSnapshot
- invalid Rule IDs

### NBA

- missing Decision
- WHO / WHEN / WHAT / WHY / SUCCESS empty

### Action

- duplicate nba_id
- missing success signal

### Outcome

- missing NBA
- signal empty
- effectiveness out of range

### RuleValidation

- missing Rule
- missing Decision
- missing Outcome

## 11. Cutover Gate

不建议因为“数据库已经建好”就切换。

切换条件：

- 100% Decision Trace 可查询
- Action / Outcome 关联完整
- RuleValidation 数量一致
- Audit 事件完整
- CRM ID 映射可追溯
- 权限范围验证通过
- Pilot dashboard 指标一致

## 12. Next Implementation

当前下一步最有价值的是：

1. Repository Interface
2. JsonRuntimeRepository
3. PostgresRepository
4. Runtime → PostgreSQL import command
5. dual-write verification
6. CRM connector canonical mapping
