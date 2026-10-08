-- Proposed migration only. Review/apply separately; no backfill or repair here.
-- Preflight: duplicate (player_id, date, source) groups must be zero.
CREATE TABLE price_history_import_state (
  id TEXT PRIMARY KEY CHECK (id = 'current'),
  dataset_id TEXT NOT NULL,
  manifest JSONB NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX price_history_point_unique
  ON price_history (player_id, date, source);
