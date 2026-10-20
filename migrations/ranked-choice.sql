-- PROPOSED ONLY. Requires reviewed ranked-free-throw.sql + friends account schema.
-- Adds choice-game storage only. No production application or enablement.
BEGIN;
CREATE TABLE arcade_choice_runs (
  id uuid PRIMARY KEY, account_id text NOT NULL REFERENCES auth_user(id) ON DELETE RESTRICT,
  period_id text NOT NULL REFERENCES arcade_competition_periods(id) ON DELETE RESTRICT,
  game_id text NOT NULL CHECK (game_id IN ('week-2-preview','priced-in')),
  rules_version text NOT NULL CHECK (rules_version ~ '^[a-f0-9]{64}$'),
  format_version text NOT NULL CHECK (format_version ~ '^[a-f0-9]{64}$'),
  policy jsonb NOT NULL, manifest jsonb NOT NULL, manifest_hash text NOT NULL CHECK (manifest_hash ~ '^[a-f0-9]{64}$'),
  choices jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(choices)='array' AND jsonb_array_length(choices)<=5),
  started_at_ms bigint NOT NULL, expires_at_ms bigint NOT NULL,
  state text NOT NULL DEFAULT 'open' CHECK (state IN ('open','completed','expired')),
  CHECK (started_at_ms>=0 AND expires_at_ms>started_at_ms AND expires_at_ms-started_at_ms<=1800000),
  CHECK (state<>'completed' OR jsonb_array_length(choices)=5)
);
CREATE UNIQUE INDEX arcade_choice_one_open ON arcade_choice_runs(account_id,game_id) WHERE state='open';
CREATE INDEX arcade_choice_admission ON arcade_choice_runs(account_id,period_id);
CREATE INDEX arcade_choice_format ON arcade_choice_runs(game_id,format_version,period_id);
CREATE TABLE arcade_choice_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), run_id uuid NOT NULL UNIQUE REFERENCES arcade_choice_runs(id) ON DELETE RESTRICT,
  score integer CHECK (score BETWEEN 0 AND 750), assessment jsonb NOT NULL, achieved_at_ms bigint NOT NULL CHECK (achieved_at_ms>=0),
  CHECK ((assessment->>'status'='scored' AND score IS NOT NULL) OR (assessment->>'status'='unscored' AND score IS NULL))
);
CREATE TABLE arcade_choice_weekly_results (
  period_id text NOT NULL REFERENCES arcade_competition_periods(id) ON DELETE RESTRICT,
  account_id text NOT NULL REFERENCES auth_user(id) ON DELETE RESTRICT,
  rank bigint NOT NULL CHECK (rank>0), result_id uuid NOT NULL REFERENCES arcade_choice_results(id) ON DELETE RESTRICT,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 750), assessment jsonb NOT NULL, achieved_at_ms bigint NOT NULL,
  username_at_final text NOT NULL, team_id text,
  PRIMARY KEY(period_id,account_id), UNIQUE(period_id,rank)
);
CREATE TRIGGER arcade_choice_result_immutable BEFORE UPDATE OR DELETE ON arcade_choice_results
  FOR EACH ROW EXECUTE FUNCTION forbid_weekly_result_mutation();
CREATE TRIGGER arcade_choice_final_immutable BEFORE UPDATE OR DELETE ON arcade_choice_weekly_results
  FOR EACH ROW EXECUTE FUNCTION forbid_weekly_result_mutation();
CREATE FUNCTION guard_arcade_choice_run() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'choice runs are retained'; END IF;
  IF OLD.state<>'open' OR
    (NEW.id,NEW.account_id,NEW.period_id,NEW.game_id,NEW.rules_version,NEW.format_version,NEW.policy,NEW.manifest,NEW.manifest_hash,NEW.started_at_ms,NEW.expires_at_ms)
    IS DISTINCT FROM
    (OLD.id,OLD.account_id,OLD.period_id,OLD.game_id,OLD.rules_version,OLD.format_version,OLD.policy,OLD.manifest,OLD.manifest_hash,OLD.started_at_ms,OLD.expires_at_ms)
    THEN RAISE EXCEPTION 'choice run metadata/terminal state is immutable'; END IF;
  IF NEW.state='expired' AND NEW.choices=OLD.choices THEN RETURN NEW; END IF;
  IF NEW.state NOT IN ('open','completed') OR jsonb_array_length(NEW.choices)<>jsonb_array_length(OLD.choices)+1
    OR NEW.choices - (jsonb_array_length(NEW.choices)-1) <> OLD.choices
    OR (jsonb_array_length(NEW.choices)=5) <> (NEW.state='completed') THEN
    RAISE EXCEPTION 'choices append exactly once in order'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER arcade_choice_run_immutable BEFORE UPDATE OR DELETE ON arcade_choice_runs
  FOR EACH ROW EXECUTE FUNCTION guard_arcade_choice_run();
COMMIT;
