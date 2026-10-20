-- Proposed migration only (#217, lane a). Review/apply separately; no
-- backfill or data changes here. Additive only: four new empty tables
-- for the team-value-history store (transaction archive, daily roster
-- snapshots, derived boundary moves, daily value points). Nothing
-- existing is altered.
-- Must stay in lockstep with src/data/db.ts, the schema source of truth;
-- src/data/__tests__/team-value-history-schema.test.ts guards the drift
-- (column types, nullability, defaults and index composition included).

CREATE TABLE sleeper_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT NOT NULL,
  league_id TEXT NOT NULL,
  season TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  effective_at TIMESTAMPTZ NOT NULL,
  source_created_at TIMESTAMPTZ NOT NULL,
  week INTEGER,
  roster_ids JSONB NOT NULL,
  adds JSONB,
  drops JSONB,
  waiver_bid INTEGER,
  settings JSONB,
  metadata JSONB,
  raw_payload JSONB NOT NULL,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX sleeper_transactions_league_txn_unique
  ON sleeper_transactions (league_id, transaction_id);
CREATE INDEX sleeper_transactions_replay_idx
  ON sleeper_transactions (league_id, status, effective_at);

CREATE TABLE roster_snapshots_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id TEXT NOT NULL,
  season TEXT NOT NULL,
  roster_id INTEGER NOT NULL,
  date DATE NOT NULL,
  player_ids JSONB NOT NULL,
  roster_count INTEGER,
  roster_status TEXT NOT NULL,
  roster_evidence JSONB,
  generation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX roster_snapshots_daily_unique
  ON roster_snapshots_daily (league_id, roster_id, date, generation);
CREATE INDEX roster_snapshots_daily_range_idx
  ON roster_snapshots_daily (league_id, roster_id, date);

CREATE TABLE roster_boundary_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id TEXT NOT NULL,
  season TEXT NOT NULL,
  roster_id INTEGER NOT NULL,
  origin TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  precision TEXT NOT NULL,
  effective_at TIMESTAMPTZ,
  day DATE,
  adds JSONB,
  drops JSONB,
  note TEXT,
  generation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX roster_boundary_moves_roster_idx
  ON roster_boundary_moves (league_id, roster_id);

CREATE TABLE team_value_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id TEXT NOT NULL,
  season TEXT NOT NULL,
  roster_id INTEGER NOT NULL,
  date DATE NOT NULL,
  valuation_at TIMESTAMPTZ,
  subtotal_cents INTEGER,
  priced_count INTEGER NOT NULL,
  roster_count INTEGER,
  status TEXT NOT NULL,
  provenance_class TEXT NOT NULL,
  continuity_id TEXT,
  priced_set_id TEXT,
  standalone BOOLEAN NOT NULL DEFAULT false,
  source_refs JSONB,
  generation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX team_value_points_unique
  ON team_value_points (league_id, roster_id, date, generation);
CREATE INDEX team_value_points_range_idx
  ON team_value_points (league_id, roster_id, date);
