-- PROPOSED ONLY. Do not apply without PR review and a disposable PostgreSQL test.
-- Prerequisite: reviewed db/friends-auth/0000_friends_auth.sql auth_user/auth_session.
-- Additive, separate from legacy game_scores/rewards. No enable row or prize policy.
BEGIN;

CREATE TABLE arcade_competition_periods (
  id text PRIMARY KEY, ordinal integer NOT NULL UNIQUE, game_id text NOT NULL, definition jsonb NOT NULL,
  rules_version text NOT NULL, score_version text NOT NULL, receipt jsonb, closed_at_ms bigint, finalized_at_ms bigint,
  CHECK ((closed_at_ms IS NULL) = (finalized_at_ms IS NULL))
);

CREATE TABLE ranked_free_throw_runs (
  id uuid PRIMARY KEY,
  account_id text NOT NULL REFERENCES auth_user(id) ON DELETE RESTRICT,
  period_id text REFERENCES arcade_competition_periods(id) ON DELETE RESTRICT,
  rules_version text NOT NULL CHECK (rules_version ~ '^[a-f0-9]{64}$'),
  rules jsonb NOT NULL CHECK (jsonb_typeof(rules) = 'object'),
  replay_context jsonb NOT NULL CHECK (jsonb_typeof(replay_context) = 'object'),
  week text NOT NULL CHECK (week ~ '^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$'),
  week_starts_at_ms bigint NOT NULL,
  week_ends_at_ms bigint,
  started_at_ms bigint NOT NULL,
  expires_at_ms bigint NOT NULL,
  state text NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'consumed', 'expired')),
  consumed_at_ms bigint,
  CHECK (week_starts_at_ms >= 0 AND (week_ends_at_ms IS NULL OR week_ends_at_ms > week_starts_at_ms)),
  CHECK (started_at_ms >= week_starts_at_ms AND (week_ends_at_ms IS NULL OR expires_at_ms <= week_ends_at_ms)),
  CHECK (expires_at_ms > started_at_ms AND expires_at_ms - started_at_ms <= 300000),
  CHECK (period_id IS NOT NULL OR week_ends_at_ms IS NOT NULL),
  CHECK ((state = 'consumed') = (consumed_at_ms IS NOT NULL)),
  CHECK (consumed_at_ms IS NULL OR (consumed_at_ms >= started_at_ms AND consumed_at_ms < expires_at_ms))
);
CREATE UNIQUE INDEX ranked_free_throw_one_open_run ON ranked_free_throw_runs(account_id) WHERE state = 'open';
CREATE INDEX ranked_free_throw_admission ON ranked_free_throw_runs(account_id, started_at_ms);
CREATE INDEX ranked_free_throw_week ON ranked_free_throw_runs(rules_version, week_starts_at_ms, week_ends_at_ms);

CREATE TABLE ranked_free_throw_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL UNIQUE REFERENCES ranked_free_throw_runs(id) ON DELETE RESTRICT,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  outcomes text NOT NULL CHECK (outcomes ~ '^[01]{1,100}$'),
  shot_inputs jsonb NOT NULL CHECK (jsonb_typeof(shot_inputs) = 'array'),
  achieved_at_ms bigint NOT NULL CHECK (achieved_at_ms >= 0),
  CHECK (score = length(replace(outcomes, '0', ''))),
  CHECK (jsonb_array_length(shot_inputs) = length(outcomes))
);

CREATE TABLE arcade_weekly_results (
  period_id text NOT NULL REFERENCES arcade_competition_periods(id) ON DELETE RESTRICT,
  account_id text NOT NULL REFERENCES auth_user(id) ON DELETE RESTRICT,
  rank bigint NOT NULL, score_id uuid NOT NULL REFERENCES ranked_free_throw_scores(id) ON DELETE RESTRICT,
  score integer NOT NULL, outcomes text NOT NULL, achieved_at_ms bigint NOT NULL,
  username_at_final text NOT NULL, team_id text,
  PRIMARY KEY(period_id,account_id), UNIQUE(period_id,rank)
);
CREATE FUNCTION forbid_weekly_result_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  RAISE EXCEPTION 'weekly results are immutable'; END; $$;
CREATE TRIGGER arcade_weekly_results_immutable BEFORE UPDATE OR DELETE ON arcade_weekly_results
  FOR EACH ROW EXECUTE FUNCTION forbid_weekly_result_mutation();

CREATE FUNCTION guard_arcade_period() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'periods are retained'; END IF;
  IF OLD.finalized_at_ms IS NOT NULL OR
    (NEW.id,NEW.ordinal,NEW.game_id,NEW.definition,NEW.rules_version,NEW.score_version) IS DISTINCT FROM
    (OLD.id,OLD.ordinal,OLD.game_id,OLD.definition,OLD.rules_version,OLD.score_version) THEN
    RAISE EXCEPTION 'published periods/finals are immutable'; END IF;
  RETURN NEW; END; $$;
CREATE TRIGGER arcade_period_immutable BEFORE UPDATE OR DELETE ON arcade_competition_periods
  FOR EACH ROW EXECUTE FUNCTION guard_arcade_period();
CREATE TRIGGER ranked_scores_immutable BEFORE UPDATE OR DELETE ON ranked_free_throw_scores
  FOR EACH ROW EXECUTE FUNCTION forbid_weekly_result_mutation();

-- A run's owner/rules/times are immutable. Only open -> consumed/expired is allowed.
CREATE FUNCTION guard_ranked_free_throw_run() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.id, NEW.account_id, NEW.period_id, NEW.rules_version, NEW.rules, NEW.replay_context, NEW.week, NEW.week_starts_at_ms,
      NEW.week_ends_at_ms, NEW.started_at_ms, NEW.expires_at_ms)
     IS DISTINCT FROM
     (OLD.id, OLD.account_id, OLD.period_id, OLD.rules_version, OLD.rules, OLD.replay_context, OLD.week, OLD.week_starts_at_ms,
      OLD.week_ends_at_ms, OLD.started_at_ms, OLD.expires_at_ms)
     OR OLD.state <> 'open' OR NEW.state NOT IN ('consumed', 'expired') THEN
    RAISE EXCEPTION 'ranked run metadata/state is immutable';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER ranked_free_throw_run_immutable BEFORE UPDATE ON ranked_free_throw_runs
  FOR EACH ROW EXECUTE FUNCTION guard_ranked_free_throw_run();

COMMIT;
