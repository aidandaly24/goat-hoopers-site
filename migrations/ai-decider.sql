-- PRODUCTION REVIEW ONLY: never applied by builds or runtime. Reuses existing Postgres.
-- Explicit disposable CI executes this file inside its generated test schema only.
-- Initial kill switch is OFF. Enable only after independent schema/config review.
CREATE TABLE ai_decider_control (
  id text PRIMARY KEY CHECK (id = 'goat-hoopers'),
  enabled boolean NOT NULL DEFAULT false,
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  state jsonb NOT NULL
);
INSERT INTO ai_decider_control (id, state) VALUES ('goat-hoopers',
  jsonb_build_object('version', 1, 'day', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
    'requests', 0, 'tokens', 0, 'users', '{}'::jsonb, 'leases', '[]'::jsonb, 'duplicates', '[]'::jsonb));

CREATE TABLE ai_decider_weeks (
  week_key text PRIMARY KEY,
  input_hash text NOT NULL CHECK (input_hash ~ '^[a-f0-9]{64}$'),
  generation_manifest jsonb NOT NULL,
  input jsonb NOT NULL,
  prepared_slate jsonb NOT NULL,
  result jsonb
);
CREATE FUNCTION ai_decider_protect_week() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'AI week is immutable'; END IF;
  IF NEW.week_key IS DISTINCT FROM OLD.week_key OR NEW.input_hash IS DISTINCT FROM OLD.input_hash
     OR NEW.generation_manifest IS DISTINCT FROM OLD.generation_manifest
     OR NEW.input IS DISTINCT FROM OLD.input OR NEW.prepared_slate IS DISTINCT FROM OLD.prepared_slate
     OR OLD.result IS NOT NULL THEN
    RAISE EXCEPTION 'AI week is immutable';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER ai_decider_week_immutable BEFORE UPDATE OR DELETE ON ai_decider_weeks
  FOR EACH ROW EXECUTE FUNCTION ai_decider_protect_week();

CREATE TABLE ai_decider_outcomes (
  week_key text NOT NULL REFERENCES ai_decider_weeks (week_key),
  matchup_id text NOT NULL,
  outcome jsonb NOT NULL,
  PRIMARY KEY (week_key, matchup_id)
);
CREATE FUNCTION ai_decider_protect_outcome() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'AI outcome is append-only'; END;
$$;
CREATE TRIGGER ai_decider_outcome_immutable BEFORE UPDATE OR DELETE ON ai_decider_outcomes
  FOR EACH ROW EXECUTE FUNCTION ai_decider_protect_outcome();
-- Budget state retains user counters for 7 days and fingerprints for 10 minutes;
-- expired state is compacted on each reservation. No prompts/IPs in budget state.
-- Immutable prediction/outcome records are retained for the season review.
