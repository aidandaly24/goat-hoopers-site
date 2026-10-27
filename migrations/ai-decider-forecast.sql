-- PRODUCTION REVIEW ONLY: never applied by builds or runtime. Reuses existing Postgres.
-- Additive companion to migrations/ai-decider.sql for the in-season rolling
-- forecast (issue #149). Apply only through the normal reviewed release
-- process, after migrations/ai-decider.sql. No existing table is altered.
--
-- One row per immutable forecast revision in a week's own series. Revisions
-- are insert-only: the trigger rejects every UPDATE and DELETE, so a stored
-- revision can never be rewritten or backdated. The two unique keys make a
-- repeated append of the same revision — or of the same evidence state —
-- a no-op, so overlapping scheduler/manual refreshes converge instead of
-- duplicating. `seq` only orders the series; it carries no facts.
CREATE TABLE ai_decider_forecasts (
  seq bigint GENERATED ALWAYS AS IDENTITY,
  week_key text NOT NULL,
  revision_id text NOT NULL CHECK (revision_id ~ '^[a-f0-9]{64}$'),
  evidence_hash text NOT NULL CHECK (evidence_hash ~ '^[a-f0-9]{64}$'),
  revision jsonb NOT NULL,
  PRIMARY KEY (week_key, revision_id),
  UNIQUE (week_key, evidence_hash)
);
CREATE INDEX ai_decider_forecasts_week_seq ON ai_decider_forecasts (week_key, seq);
CREATE FUNCTION ai_decider_protect_forecast() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'AI forecast revision is append-only'; END;
$$;
CREATE TRIGGER ai_decider_forecast_immutable BEFORE UPDATE OR DELETE ON ai_decider_forecasts
  FOR EACH ROW EXECUTE FUNCTION ai_decider_protect_forecast();
-- Immutable forecast revisions are retained for season review, like the
-- weekly prediction/outcome records. They contain no prompts or credentials.
