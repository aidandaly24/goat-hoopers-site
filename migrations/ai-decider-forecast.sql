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
--
-- The supersedes chain is linear by construction, not by caller care: at
-- most one revision may supersede any given revision within a week, and at
-- most one revision may be the week's genesis (supersedes NULL). A racing
-- append that would fork the chain violates one of these indexes and is
-- skipped, which is what makes the store's optimistic chain-head CAS safe
-- under concurrent scheduler/manual refreshes.
CREATE UNIQUE INDEX ai_decider_forecasts_one_child
  ON ai_decider_forecasts (week_key, ((revision ->> 'supersedes')))
  WHERE (revision ->> 'supersedes') IS NOT NULL;
CREATE UNIQUE INDEX ai_decider_forecasts_one_genesis
  ON ai_decider_forecasts (week_key)
  WHERE (revision ->> 'supersedes') IS NULL;
--
-- Per-week current-selection pointer: the one mutable record in this lane.
-- Public reads present the revision this pointer names, so selection is a
-- recorded observation — refreshed on EVERY refresh outcome, including a
-- dedupe hit that appends nothing — and never an accident of insertion
-- order (after evidence recurs A → B → A, the pointer names A again even
-- though B was inserted later). The pointer names a stored revision via
-- the foreign key; it carries no facts of its own beyond when that
-- revision was most recently observed as current.
CREATE TABLE ai_decider_forecast_current (
  week_key text PRIMARY KEY,
  revision_id text NOT NULL CHECK (revision_id ~ '^[a-f0-9]{64}$'),
  evidence_hash text NOT NULL CHECK (evidence_hash ~ '^[a-f0-9]{64}$'),
  observed_at timestamptz NOT NULL,
  FOREIGN KEY (week_key, revision_id) REFERENCES ai_decider_forecasts (week_key, revision_id)
);
-- Monotonic observation rule (enforced by the store's pointer writes,
-- keyed on this table's observed_at — no extra column is needed, since
-- observed_at already records the evidence-observation time of the
-- refresh that set the pointer): a pointer move applies only when the
-- incoming refresh observed its evidence at or after the stored
-- observed_at, so a delayed writer carrying strictly older evidence can
-- never regress public selection to a superseded state; the stale
-- writer converges on the current revision instead of publishing over
-- it. Ties (equal observed_at) resolve by store serialization order —
-- the later-completing refresh wins — which cannot resurrect strictly
-- older evidence. A dedupe re-observation of an old revision carries a
-- FRESH observed_at: revision age is not observation age, so a genuine
-- A → B → A recurrence still moves the pointer back to A.
-- Enforcement is at the locked row, not at statement snapshots (whose
-- reads cannot see a concurrent writer's uncommitted-then-committed
-- move): pointer writers lock this table's row for the week
-- (SELECT … FOR UPDATE), which waits out a concurrent holder and then
-- re-reads the newest committed version, and the mutation's own guard
-- is re-checked against that latest version after any wait. The
-- publication's move is a guarded UPDATE plus a yielding creation
-- INSERT (never an upsert): where no row existed to lock, an UPDATE
-- cannot see a concurrently inserting writer's selection, and the
-- INSERT defers to any concurrent creator — so a fresher first
-- selection can never be overwritten by an older publication. The
-- dedupe classification is likewise proven from the locked row, so a
-- verdict describes the selection as of the statement's own commit.
