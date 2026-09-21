-- ZG AI GPS PostgreSQL schema
-- Target: PostgreSQL 15+
-- IDs intentionally use TEXT during Pilot migration so existing h1/d1/R-019 style IDs can be imported without remapping.

BEGIN;

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS regions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

CREATE TABLE IF NOT EXISTS territories (
  id TEXT PRIMARY KEY,
  region_id TEXT NOT NULL REFERENCES regions(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (region_id, name)
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  region_id TEXT REFERENCES regions(id),
  territory_id TEXT REFERENCES territories(id),
  name TEXT NOT NULL,
  role_code TEXT NOT NULL,
  external_identity TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_region ON users(region_id);
CREATE INDEX IF NOT EXISTS idx_users_territory ON users(territory_id);

CREATE TABLE IF NOT EXISTS hospitals (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  region_id TEXT REFERENCES regions(id),
  owner_user_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  tier TEXT,
  stage TEXT,
  patient_value TEXT,
  opportunity_score NUMERIC(5,2) CHECK (opportunity_score BETWEEN 0 AND 100),
  changeability_score NUMERIC(5,2) CHECK (changeability_score BETWEEN 0 AND 100),
  progress NUMERIC(5,2) CHECK (progress BETWEEN 0 AND 100),
  current_target TEXT,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_system TEXT,
  source_id TEXT,
  source_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_hospital_source
  ON hospitals(source_system, source_id)
  WHERE source_system IS NOT NULL AND source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hospitals_region ON hospitals(region_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_owner ON hospitals(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_stage ON hospitals(stage);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  hospital_id TEXT NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, name)
);

CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  hospital_id TEXT NOT NULL REFERENCES hospitals(id),
  department_id TEXT REFERENCES departments(id),
  owner_user_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  title TEXT,
  influence_score NUMERIC(5,2) CHECK (influence_score BETWEEN 0 AND 100),
  support TEXT,
  stage TEXT,
  next_action_score NUMERIC(5,2) CHECK (next_action_score BETWEEN 0 AND 100),
  focus TEXT,
  trigger_signal TEXT,
  current_gap TEXT,
  target_behavior TEXT,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_system TEXT,
  source_id TEXT,
  source_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_doctor_source
  ON doctors(source_system, source_id)
  WHERE source_system IS NOT NULL AND source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_doctors_hospital ON doctors(hospital_id);
CREATE INDEX IF NOT EXISTS idx_doctors_owner ON doctors(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_stage ON doctors(stage);

CREATE TABLE IF NOT EXISTS hospital_relationships (
  id TEXT PRIMARY KEY,
  hospital_id TEXT NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  from_entity_type TEXT NOT NULL,
  from_entity_id TEXT NOT NULL,
  to_entity_type TEXT NOT NULL,
  to_entity_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  strength NUMERIC(5,2) CHECK (strength BETWEEN 0 AND 100),
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hospital_relationships_hospital ON hospital_relationships(hospital_id);

CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  hospital_id TEXT NOT NULL REFERENCES hospitals(id),
  doctor_id TEXT REFERENCES doctors(id),
  rep_user_id TEXT REFERENCES users(id),
  occurred_at TIMESTAMPTZ NOT NULL,
  visit_goal TEXT,
  result TEXT,
  score NUMERIC(5,2) CHECK (score BETWEEN 0 AND 100),
  primary_issue TEXT,
  severity TEXT,
  summary TEXT,
  commitment TEXT,
  next_step TEXT,
  compliance_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_system TEXT,
  source_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visits_hospital_time ON visits(hospital_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_doctor_time ON visits(doctor_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_rep_time ON visits(rep_user_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS visit_transcripts (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  storage_uri TEXT,
  language TEXT,
  duration_seconds INTEGER,
  transcript JSONB NOT NULL,
  model_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evidence_documents (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  evidence_type TEXT NOT NULL,
  title TEXT NOT NULL,
  version TEXT,
  status TEXT NOT NULL DEFAULT 'approved',
  source_uri TEXT,
  content_hash TEXT,
  approved_by TEXT REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence_documents(status, evidence_type);

CREATE TABLE IF NOT EXISTS decision_rules (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'testing'
    CHECK (status IN ('testing','validated','rejected','deprecated','superseded')),
  confidence NUMERIC(5,2) NOT NULL DEFAULT 60 CHECK (confidence BETWEEN 0 AND 100),
  current_version INTEGER NOT NULL DEFAULT 1,
  applies_to TEXT[] NOT NULL DEFAULT '{}',
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS decision_rule_versions (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL REFERENCES decision_rules(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  context_text TEXT NOT NULL,
  decision_text TEXT NOT NULL,
  action_text TEXT NOT NULL,
  expected_outcome_text TEXT NOT NULL,
  contraindications TEXT,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by TEXT REFERENCES users(id),
  reviewed_by TEXT REFERENCES users(id),
  review_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (review_status IN ('draft','review_required','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rule_id, version)
);

CREATE TABLE IF NOT EXISTS context_snapshots (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  actor_user_id TEXT REFERENCES users(id),
  role_code TEXT,
  facts JSONB NOT NULL DEFAULT '[]'::jsonb,
  signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  constraints JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  snapshot_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_context_target ON context_snapshots(target_type, target_id, created_at DESC);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  context_snapshot_id TEXT NOT NULL REFERENCES context_snapshots(id),
  decision_type TEXT NOT NULL,
  priority_score NUMERIC(5,2) NOT NULL CHECK (priority_score BETWEEN 0 AND 100),
  rationale TEXT NOT NULL,
  rule_ids TEXT[] NOT NULL DEFAULT '{}',
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high')),
  human_review_required BOOLEAN NOT NULL DEFAULT false,
  model_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decisions_type_time ON decisions(decision_type, created_at DESC);

CREATE TABLE IF NOT EXISTS nbas (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL REFERENCES decisions(id),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  who_text TEXT NOT NULL,
  when_text TEXT NOT NULL,
  what_text TEXT NOT NULL,
  why_text TEXT NOT NULL,
  success_signal TEXT NOT NULL,
  owner_user_id TEXT REFERENCES users(id),
  owner_text TEXT,
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('draft','proposed','review_required','approved','accepted','measured','expired','rejected')),
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nbas_target ON nbas(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nbas_status ON nbas(status);

CREATE TABLE IF NOT EXISTS actions (
  id TEXT PRIMARY KEY,
  nba_id TEXT NOT NULL REFERENCES nbas(id),
  hospital_id TEXT REFERENCES hospitals(id),
  doctor_id TEXT REFERENCES doctors(id),
  owner_user_id TEXT REFERENCES users(id),
  owner_text TEXT,
  priority SMALLINT NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  title TEXT NOT NULL,
  description TEXT,
  success_signal TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo','doing','risk','done','blocked','cancelled')),
  accepted_by TEXT REFERENCES users(id),
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (nba_id)
);

CREATE INDEX IF NOT EXISTS idx_actions_owner_status ON actions(owner_user_id, status);
CREATE INDEX IF NOT EXISTS idx_actions_hospital_status ON actions(hospital_id, status);

CREATE TABLE IF NOT EXISTS outcomes (
  id TEXT PRIMARY KEY,
  nba_id TEXT NOT NULL REFERENCES nbas(id),
  action_id TEXT REFERENCES actions(id),
  target_type TEXT,
  target_id TEXT,
  result TEXT NOT NULL,
  signal TEXT NOT NULL,
  evidence TEXT,
  effectiveness NUMERIC(5,2) NOT NULL CHECK (effectiveness BETWEEN 0 AND 100),
  recorded_by TEXT REFERENCES users(id),
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outcomes_nba ON outcomes(nba_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_action ON outcomes(action_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_target ON outcomes(target_type, target_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS rule_validations (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL REFERENCES decision_rules(id),
  decision_id TEXT NOT NULL REFERENCES decisions(id),
  nba_id TEXT NOT NULL REFERENCES nbas(id),
  outcome_id TEXT NOT NULL REFERENCES outcomes(id),
  previous_confidence NUMERIC(5,2) NOT NULL,
  proposed_confidence NUMERIC(5,2) NOT NULL,
  delta NUMERIC(5,2) NOT NULL,
  evidence_direction TEXT NOT NULL CHECK (evidence_direction IN ('support','contradict','neutral')),
  effectiveness NUMERIC(5,2) NOT NULL CHECK (effectiveness BETWEEN 0 AND 100),
  signal TEXT NOT NULL,
  human_review_required BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed','applied','review_required','approved','rejected','superseded')),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rule_validations_rule ON rule_validations(rule_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rule_validations_review ON rule_validations(status) WHERE status = 'review_required';

CREATE TABLE IF NOT EXISTS pilot_metrics (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  metric_date DATE NOT NULL,
  metric_key TEXT NOT NULL,
  metric_value NUMERIC,
  numerator NUMERIC,
  denominator NUMERIC,
  dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, metric_date, metric_key, dimensions)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_user_id TEXT REFERENCES users(id),
  actor_text TEXT,
  event_type TEXT NOT NULL,
  object_type TEXT,
  object_id TEXT,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  correlation_id TEXT,
  immutable_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_object ON audit_events(object_type, object_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_events(actor_user_id, occurred_at DESC);

COMMIT;
