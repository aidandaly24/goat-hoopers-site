import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
const worker = vi.hoisted(() => ({ factory: vi.fn(), finality: vi.fn() }));
vi.mock("../ranked-free-throw/runtime", () => ({ createRankedRuntime: worker.factory }));
vi.mock("./finality", () => ({ readFinality: worker.finality }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { ArcadeCompetitionStore } from "./store";
import { freeThrowRulesVersion } from "../ranked-free-throw/config";
import { parseFreeThrowPolicy, rankedReplayContext, type RankedAccount } from "@/domain/arcade/ranked-free-throw";
import { loadRankedResult, submitRankedScore } from "../ranked-free-throw/service";
import { compareRecord } from "@/domain/arcade/ranked-record-feedback";
import { scoreFormatVersion } from "./config";
import type { CompetitionPeriod, FinalityReceipt } from "@/domain/arcade/competition-period";
import { POST } from "@/app/api/arcade/competition/reconcile/route";

describe.skipIf(process.env.RUN_CLAIM_TEAM_LOCAL_TEST !== "1")("canonical competition against the existing disposable PostgreSQL fixture", () => {
  const schema = `arcade_period_${randomUUID().replaceAll("-", "")}`;
  const pool = new Pool({ host: "127.0.0.1", port: 55441, database: "claim_team_test", user: "postgres", ssl: false, max: 12,
    options: `-c search_path=${schema} -c application_name=${schema} -c statement_timeout=10000 -c lock_timeout=8000` });
  const db = drizzle(pool);
  const store = new ArcadeCompetitionStore({ execute: async q => db.execute(q), transaction: work => db.transaction(tx => work({ execute: async q => tx.execute(q) }), { isolationLevel: "read committed" }) });
  const policy = parseFreeThrowPolicy({ ruleSetId: "canonical-test-only", engine: "moving-court-makes-v2", shots: 2, durationMs: 30000,
    minShotIntervalMs: 1000, maxRunsPerWeek: null })!;
  const config = { status: "ready" as const, policy, rulesVersion: freeThrowRulesVersion(policy) };
  const a: RankedAccount = { subject: "canonical-alpha", sessionId: "canonical-alpha-session" };
  const b: RankedAccount = { subject: "canonical-beta", sessionId: "canonical-beta-session" };
  const shots = [{ atMs: 0, direction: 0, power: 50 }, { atMs: 7000, direction: 0, power: 79 }];
  let now = 0, p: CompetitionPeriod, next: CompetitionPeriod, owns = false;
  const receipt = (period: CompetitionPeriod, state: "live" | "final" | "postponed" | "missing" = "live"): FinalityReceipt => ({ checkedAtMs: Date.now(), source: "synthetic SQL test", states: Object.fromEntries(period.fixtures.map(f => [f.id, state])) });
  const runtime = () => ({ configuration: config, origin: () => "https://test.invalid", account: async () => a, admitRequest: async () => true, store: () => store });
  async function seed(actor = a, period = p, expiresIn = 15000, cfg = config) {
    const runId = randomUUID(), at = Number((await pool.query("SELECT floor(extract(epoch FROM clock_timestamp())*1000)::bigint AS now")).rows[0].now);
    await pool.query(`INSERT INTO ranked_free_throw_runs(id,account_id,period_id,rules_version,rules,replay_context,week,week_starts_at_ms,week_ends_at_ms,started_at_ms,expires_at_ms,state)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,NULL,$9,$10,'open')`, [runId, actor.subject, period.id, cfg.rulesVersion, JSON.stringify(cfg.policy), JSON.stringify(rankedReplayContext()), period.week, period.opensAtMs, at + expiresIn - cfg.policy.durationMs, at + expiresIn]);
    return runId;
  }
  async function waitForAcceptanceWaiters(count: number) {
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline) {
      const rows = await pool.query("SELECT pid FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock' AND query LIKE '%pg_advisory_xact_lock(7042030)%'", [schema]);
      if (rows.rows.length === count) return;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw new Error("acceptance did not reach the expected SQL lock queue");
  }
  beforeAll(async () => {
    expect((await pool.query("SELECT current_database() AS name,version() AS version")).rows[0]).toMatchObject({ name: "claim_team_test", version: expect.stringContaining("PostgreSQL 16.") });
    await pool.query(`CREATE SCHEMA ${schema}`); owns = true;
    await pool.query(`CREATE TABLE site_users(id uuid PRIMARY KEY,team_id text UNIQUE NOT NULL,display_name text NOT NULL,password_hash text NOT NULL,created_at timestamp DEFAULT now());
      CREATE TABLE invite_codes(code text PRIMARY KEY,team_id text,used_by uuid,used_at timestamp,created_at timestamp DEFAULT now());
      CREATE TABLE sessions(token_hash text PRIMARY KEY,user_id uuid REFERENCES site_users(id),expires_at timestamp,created_at timestamp DEFAULT now());`);
    await pool.query((await readFile("db/friends-auth/0000_friends_auth.sql", "utf8")).replaceAll('"public".', `"${schema}".`));
    await pool.query(await readFile("db/friends-auth/0001_account_usernames.sql", "utf8"));
    await pool.query(await readFile("migrations/ranked-free-throw.sql", "utf8"));
    for (const actor of [a, b]) {
      await pool.query("INSERT INTO auth_user(id,name,email,email_verified,created_at,updated_at) VALUES($1,$2,$3,true,now(),now())", [actor.subject, actor === a ? "alpha" : "beta", `${actor.subject}@example.test`]);
      await pool.query("INSERT INTO auth_session(id,user_id,token,expires_at,created_at,updated_at) VALUES($1,$2,$1,now()+interval '1 hour',now(),now())", [actor.sessionId, actor.subject]);
    }
  }, 30000);
  beforeEach(async () => {
    vi.clearAllMocks();
    await pool.query("TRUNCATE arcade_weekly_results,ranked_free_throw_scores,ranked_free_throw_runs,arcade_competition_periods CASCADE");
    await pool.query("DELETE FROM account_identities; DELETE FROM site_users");
    await pool.query("UPDATE auth_user SET name=CASE WHEN id=$1 THEN 'alpha' ELSE 'beta' END", [a.subject]);
    now = Date.now();
    p = { id: "test-week-1", gameId: "free-throw", week: "2026-W01", label: "Synthetic week one", order: 1, opensAtMs: now - 7200000,
      predecessorId: null, calendarSource: "https://example.test/calendar", calendarVersion: "synthetic-only", fixtures: [{ id: "123456789", date: "20261020", startsAtMs: now - 3600000 }] };
    next = { ...p, id: "test-week-2", week: "2026-W02", label: "Synthetic week two", order: 2, predecessorId: p.id, opensAtMs: now - 1800000,
      fixtures: [{ id: "123456790", date: "20261021", startsAtMs: now - 1000000 }] };
  });
  afterEach(() => vi.unstubAllEnvs());
  afterAll(async () => { if (owns) await pool.query(`DROP SCHEMA ${schema} CASCADE`); await pool.end(); });

  it("enforces before-open, missing/stale authority, verified ownership and unlimited admissions with one active run", async () => {
    await store.reconcile([{ ...p, opensAtMs: now + 60000 }], config, new Map([[p.id, receipt(p)]]));
    expect(await store.start(a, config)).toEqual({ status: "week_closing" });
    await pool.query("TRUNCATE arcade_competition_periods CASCADE");
    await store.reconcile([p], config, new Map([[p.id, receipt(p, "missing")]]));
    expect(await store.start(a, config)).toEqual({ status: "week_closing" });
    await store.reconcile([p], config, new Map([[p.id, receipt(p)]]));
    expect(await store.start({ ...a, sessionId: "wrong" }, config)).toEqual({ status: "unauthenticated" });
    const starts = await Promise.all(Array.from({ length: 4 }, () => store.start(a, config)));
    expect(starts.filter(r => r.status === "created")).toHaveLength(1); expect(starts.filter(r => r.status === "busy")).toHaveLength(3);
    for (let i = 0; i < 5; i++) { await pool.query("UPDATE ranked_free_throw_runs SET state='expired' WHERE account_id=$1 AND state='open'", [a.subject]); expect((await store.start(a, config)).status).toBe("created"); }
    await pool.query("UPDATE arcade_competition_periods SET receipt=jsonb_set(receipt,'{checkedAtMs}',to_jsonb($1::bigint))", [now - 600001]);
    expect(await store.start(b, config)).toEqual({ status: "week_closing" });
  });
  it("accepts exactly one concurrent replay-backed save and rejects late/foreign submissions", async () => {
    await store.reconcile([p], config, new Map([[p.id, receipt(p)]]));
    const runId = await seed();
    const replies = await Promise.all(Array.from({ length: 4 }, () => submitRankedScore(runtime(), a, { runId, shots })));
    expect(replies.filter(r => r.status === "saved")).toHaveLength(1);
    expect(replies.filter(r => "recordFeedback" in r && r.recordFeedback !== null)).toHaveLength(1);
    expect(Number((await pool.query("SELECT count(*) FROM ranked_free_throw_scores")).rows[0].count)).toBe(1);
    const late = await seed(b, p, -1);
    expect((await submitRankedScore(runtime(), b, { runId: late, shots })).status).toBe("invalid_run");
    expect(await store.result(b, runId)).toBeNull();
  });
  it("distinguishes first, beaten, tied and below including zero, personal ownership and period rollover", async () => {
    await store.reconcile([p, next], config, new Map([[p.id, receipt(p)], [next.id, receipt(next)]]));
    const zero = shots.map(shot => ({ ...shot, direction: 14 })), one = [shots[0], { ...shots[1], direction: 14 }];
    const save = async (actor: RankedAccount, evidence: typeof shots, period = p) => {
      const runId = await seed(actor, period);
      const reply = await submitRankedScore(runtime(), actor, { runId, shots: evidence });
      if (reply.status !== "saved") throw new Error(`unexpected ${reply.status}`);
      return { runId, reply };
    };
    const first = await save(a, zero);
    expect(first.reply).toMatchObject({ score: { score: 0 }, recordFeedback: { version: 1, scope: "everyone", periodId: p.id,
      scoreId: first.reply.score.id, acceptedAtMs: first.reply.score.achievedAtMs, scoreVersion: scoreFormatVersion(policy),
      personalBest: compareRecord(0, null), weeklyRecord: compareRecord(0, null), allTimeRecord: compareRecord(0, null) } });
    const beaten = await save(a, one);
    expect(beaten.reply.recordFeedback).toMatchObject({ personalBest: compareRecord(1, 0), weeklyRecord: compareRecord(1, 0), allTimeRecord: compareRecord(1, 0) });
    const tied = await save(b, one);
    expect(tied.reply.recordFeedback).toMatchObject({ personalBest: compareRecord(1, null), weeklyRecord: compareRecord(1, 1), allTimeRecord: compareRecord(1, 1) });
    expect((await store.board("weekly", null, config, null)).entries.map(row => row.username)).toEqual(["alpha", "beta"]);
    const below = await save(a, zero);
    expect(below.reply.recordFeedback).toMatchObject({ personalBest: compareRecord(0, 1), weeklyRecord: compareRecord(0, 1), allTimeRecord: compareRecord(0, 1) });
    expect(await loadRankedResult(runtime(), a, beaten.runId)).toEqual({ status: "saved", score: beaten.reply.score, recordFeedback: null });
    expect(await submitRankedScore(runtime(), a, { runId: beaten.runId, shots: one })).toEqual({ status: "invalid_run" });
    expect(await loadRankedResult(runtime(), b, beaten.runId)).toEqual({ status: "not_found" });
    await store.reconcile([p, next], config, new Map([[p.id, receipt(p, "final")], [next.id, receipt(next)]]));
    const rolled = await save(a, zero, next);
    expect(rolled.reply.recordFeedback).toMatchObject({ periodId: next.id, personalBest: compareRecord(0, 1), weeklyRecord: compareRecord(0, null), allTimeRecord: compareRecord(0, 1) });
  });
  it("compares only compatible canonical formats, excluding legacy and other-format records", async () => {
    await store.reconcile([p], config, new Map([[p.id, receipt(p)]]));
    await submitRankedScore(runtime(), a, { runId: await seed(), shots });
    await store.reconcile([p], config, new Map([[p.id, receipt(p, "final")]]));
    const changed = { ...config, policy: { ...policy, durationMs: 31000 }, rulesVersion: freeThrowRulesVersion({ ...policy, durationMs: 31000 }) };
    await store.reconcile([p, next], changed, new Map([[next.id, receipt(next)]]));
    // A legacy run without canonical period identity is absent from canonical boards.
    const legacy = randomUUID(), at = Date.now();
    await pool.query(`INSERT INTO ranked_free_throw_runs(id,account_id,period_id,rules_version,rules,replay_context,week,week_starts_at_ms,week_ends_at_ms,started_at_ms,expires_at_ms,state,consumed_at_ms)
      VALUES($1,$2,NULL,$3,$4,$5,$6,$7,$8,$9,$10,'consumed',$11)`, [legacy,b.subject,changed.rulesVersion,JSON.stringify(changed.policy),JSON.stringify(rankedReplayContext()),next.week,next.opensAtMs,at+3600000,at-15000,at+16000,at]);
    await pool.query("INSERT INTO ranked_free_throw_scores(run_id,score,outcomes,shot_inputs,achieved_at_ms) SELECT id,2,'11',$2::jsonb,started_at_ms+14000 FROM ranked_free_throw_runs WHERE id=$1", [legacy, JSON.stringify(shots)]);
    const reply = await submitRankedScore({ ...runtime(), configuration: changed }, a, { runId: await seed(a, next, 15000, changed), shots });
    expect(reply).toMatchObject({ status: "saved", recordFeedback: { scoreVersion: scoreFormatVersion(changed.policy),
      personalBest: compareRecord(2, null), weeklyRecord: compareRecord(2, null), allTimeRecord: compareRecord(2, null) } });
  });
  it.each([[0, 1], [1, 0], [1, 1]] as const)("serializes competing accounts with queued scores %s then %s", async (firstScore, secondScore) => {
    await store.reconcile([p], config, new Map([[p.id, receipt(p)]]));
    const evidence = (score: number) => shots.map((shot, i) => ({ ...shot, direction: i < score ? 0 : 14 }));
    const firstRun = await seed(a), secondRun = await seed(b), blocker = await pool.connect();
    try {
      await blocker.query("BEGIN"); await blocker.query("SELECT pg_advisory_xact_lock(7042030)");
      const firstSave = submitRankedScore(runtime(), a, { runId: firstRun, shots: evidence(firstScore) });
      await waitForAcceptanceWaiters(1);
      const secondSave = submitRankedScore(runtime(), b, { runId: secondRun, shots: evidence(secondScore) });
      await waitForAcceptanceWaiters(2);
      await blocker.query("COMMIT");
      const [firstReply, secondReply] = await Promise.all([firstSave, secondSave]);
      expect(firstReply).toMatchObject({ status: "saved", recordFeedback: { weeklyRecord: compareRecord(firstScore, null), allTimeRecord: compareRecord(firstScore, null) } });
      expect(secondReply).toMatchObject({ status: "saved", recordFeedback: { personalBest: compareRecord(secondScore, null), weeklyRecord: compareRecord(secondScore, firstScore), allTimeRecord: compareRecord(secondScore, firstScore) } });
      expect(Number((await pool.query("SELECT count(*) FROM ranked_free_throw_scores")).rows[0].count)).toBe(2);
    } finally { await blocker.query("ROLLBACK"); blocker.release(); }
  });
  it("rechecks expiry after waiting for record serialization and emits no acceptance feedback", async () => {
    await store.reconcile([p], config, new Map([[p.id, receipt(p)]]));
    const runId = await seed(a, p, 1100), blocker = await pool.connect();
    try {
      await blocker.query("BEGIN"); await blocker.query("SELECT pg_advisory_xact_lock(7042030)");
      const saving = submitRankedScore(runtime(), a, { runId, shots });
      await waitForAcceptanceWaiters(1);
      await new Promise(resolve => setTimeout(resolve, 1200));
      await blocker.query("COMMIT");
      expect(await saving).toEqual({ status: "invalid_run" });
      expect(Number((await pool.query("SELECT count(*) FROM ranked_free_throw_scores")).rows[0].count)).toBe(0);
    } finally { await blocker.query("ROLLBACK"); blocker.release(); }
  });
  it("rolls back a failed insert without advancing a record or consuming its retry", async () => {
    await store.reconcile([p], config, new Map([[p.id, receipt(p)]]));
    const runId = await seed();
    await pool.query("CREATE FUNCTION fail_record_save() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic save failure'; END; $$; CREATE TRIGGER fail_record_save BEFORE INSERT ON ranked_free_throw_scores FOR EACH ROW EXECUTE FUNCTION fail_record_save()");
    try { await expect(submitRankedScore(runtime(), a, { runId, shots })).rejects.toThrow(); }
    finally { await pool.query("DROP TRIGGER fail_record_save ON ranked_free_throw_scores; DROP FUNCTION fail_record_save()"); }
    expect((await pool.query("SELECT state FROM ranked_free_throw_runs WHERE id=$1", [runId])).rows[0].state).toBe("open");
    expect(await submitRankedScore(runtime(), a, { runId, shots })).toMatchObject({ status: "saved", recordFeedback: {
      personalBest: compareRecord(2, null), weeklyRecord: compareRecord(2, null), allTimeRecord: compareRecord(2, null) } });
  });
  it("finalizes once, preserves archived rank/score across renames/team changes, and opens the next due period", async () => {
    await store.reconcile([p, next], config, new Map([[p.id, receipt(p)], [next.id, receipt(next)]]));
    const runId = await seed(); expect((await submitRankedScore(runtime(), a, { runId, shots })).status).toBe("saved");
    expect((await store.board("weekly", null, config, a.subject)).periodId).toBe(p.id);
    expect(await store.reconcile([p, next], config, new Map([[p.id, receipt(p, "final")], [next.id, receipt(next)]]))).toEqual([p.id]);
    const before = await store.board("archive", p.id, config, a.subject);
    await pool.query("UPDATE auth_user SET name='alpha_new' WHERE id=$1", [a.subject]);
    const team = randomUUID(); await pool.query("INSERT INTO site_users(id,team_id,display_name,password_hash) VALUES($1,'1','Team','unused')", [team]);
    await pool.query("INSERT INTO account_identities(subject,user_id,active) VALUES($1,$2,true)", [a.subject, team]);
    const after = await store.board("archive", p.id, config, a.subject);
    expect(after.entries[0]).toMatchObject({ ...before.entries[0], username: "alpha_new" });
    expect(after.entries[0].teamId).toBeNull();
    expect((await store.board("archive", p.id, config, null, "league")).entries).toHaveLength(0);
    expect((await store.board("weekly", null, config, a.subject))).toMatchObject({ periodId: next.id, phase: "open" });
    expect(await store.reconcile([p, next], config, new Map([[p.id, receipt(p, "final")], [next.id, receipt(next)]]))).toEqual([]);
    expect(await store.archives()).toHaveLength(1);
    await expect(pool.query("UPDATE arcade_weekly_results SET score=99")).rejects.toMatchObject({ code: "P0001" });
    await expect(pool.query("UPDATE arcade_competition_periods SET finalized_at_ms=0 WHERE id=$1", [p.id])).rejects.toMatchObject({ code: "P0001" });
  });
  it("blocks late saves after finalization and never advances a postponed/missing game by clock time", async () => {
    await store.reconcile([p, next], config, new Map([[p.id, receipt(p, "postponed")]]));
    expect((await store.board("weekly", null, config, null))).toMatchObject({ periodId: p.id, phase: "blocked" });
    expect(await store.archives()).toHaveLength(0);
    await store.reconcile([p, next], config, new Map([[p.id, receipt(p)]]));
    const runId = await seed();
    await store.reconcile([p, next], config, new Map([[p.id, receipt(p, "final")], [next.id, receipt(next)]]));
    expect((await pool.query("SELECT state FROM ranked_free_throw_runs WHERE id=$1", [runId])).rows[0].state).toBe("expired");
    expect((await submitRankedScore(runtime(), a, { runId, shots })).status).toBe("invalid_run");
    expect(Number((await pool.query("SELECT count(*) FROM ranked_free_throw_scores")).rows[0].count)).toBe(0);
    expect((await store.start(a, config)).status).toBe("created");
  });
  it("rolls back a late finalization failure and retries without a duplicate archive", async () => {
    await store.reconcile([p], config, new Map([[p.id, receipt(p)]]));
    const runId = await seed(); await submitRankedScore(runtime(), a, { runId, shots });
    await pool.query("CREATE FUNCTION fail_final() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic failure'; END; $$; CREATE TRIGGER fail_final BEFORE INSERT ON arcade_weekly_results FOR EACH ROW EXECUTE FUNCTION fail_final()");
    await expect(store.reconcile([p], config, new Map([[p.id, receipt(p, "final")]]))).rejects.toThrow();
    expect(await store.archives()).toHaveLength(0);
    await pool.query("DROP TRIGGER fail_final ON arcade_weekly_results; DROP FUNCTION fail_final()");
    expect(await store.reconcile([p], config, new Map([[p.id, receipt(p, "final")]]))).toEqual([p.id]);
    expect((await store.board("archive", p.id, config, null)).entries).toHaveLength(1);
  });
  it("keeps all-time scores across compatible weeks and excludes incompatible scoring versions without changing old finals", async () => {
    await store.reconcile([p], config, new Map([[p.id, receipt(p)]]));
    const runId = await seed(); await submitRankedScore(runtime(), a, { runId, shots });
    await store.reconcile([p], config, new Map([[p.id, receipt(p, "final")]]));
    expect((await store.board("all-time", null, config, null)).entries).toHaveLength(1);
    const changed = { ...config, policy: { ...policy, shots: 3 }, rulesVersion: freeThrowRulesVersion({ ...policy, shots: 3 }) };
    await store.reconcile([p, next], changed, new Map([[next.id, receipt(next)]]));
    expect((await store.board("all-time", null, changed, null)).entries).toHaveLength(0);
    expect((await store.board("archive", p.id, changed, null)).entries).toHaveLength(1);
  });
  it("waits for an in-flight score save before taking a final snapshot", async () => {
    await store.reconcile([p], config, new Map([[p.id, receipt(p)]]));
    const runId = await seed(), blocker = await pool.connect();
    try {
      await blocker.query("BEGIN"); await blocker.query("SELECT id FROM ranked_free_throw_runs WHERE id=$1 FOR UPDATE", [runId]);
      const saving = submitRankedScore(runtime(), a, { runId, shots });
      const deadline = Date.now() + 3000;
      let waited = false;
      while (Date.now() < deadline) {
        const rows = await pool.query("SELECT pid FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock' AND query LIKE '%SELECT id FROM ranked_free_throw_runs%FOR UPDATE%'", [schema]);
        if (rows.rows.length) { waited = true; break; }
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      expect(waited).toBe(true);
      const finalizing = store.reconcile([p], config, new Map([[p.id, receipt(p, "final")]]));
      await blocker.query("COMMIT");
      expect((await saving).status).toBe("saved"); expect(await finalizing).toEqual([p.id]);
      expect((await store.board("archive", p.id, config, null)).entries).toHaveLength(1);
    } finally { await blocker.query("ROLLBACK"); blocker.release(); }
  });
  it("rechecks authority freshness after an admission waits on its verified account lock", async () => {
    await store.reconcile([p], config, new Map([[p.id, { ...receipt(p), checkedAtMs: Date.now() - 599000 }]]));
    const blocker = await pool.connect();
    try {
      await blocker.query("BEGIN"); await blocker.query("SELECT id FROM auth_user WHERE id=$1 FOR UPDATE", [a.subject]);
      const starting = store.start(a, config), deadline = Date.now() + 3000;
      let waited = false;
      while (Date.now() < deadline) {
        const rows = await pool.query("SELECT pid FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock' AND query LIKE '%FOR UPDATE OF u,s%'", [schema]);
        if (rows.rows.length) { waited = true; break; }
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      expect(waited).toBe(true);
      await new Promise(resolve => setTimeout(resolve, 1100));
      await blocker.query("ROLLBACK");
      expect((await starting).status).toBe("week_closing");
    } finally { await blocker.query("ROLLBACK"); blocker.release(); }
  });
  it("chooses one best round per account, using acceptance time then stable score ID for exact ties", async () => {
    await store.reconcile([p], config, new Map([[p.id, receipt(p)]]));
    const accepted = Date.now() - 1000;
    for (const [actor, id, at] of [[a, "00000000-0000-4000-8000-000000000002", accepted],
      [b, "00000000-0000-4000-8000-000000000001", accepted], [a, "00000000-0000-4000-8000-000000000003", accepted + 1]] as const) {
      const runId = await seed(actor);
      await pool.query("UPDATE ranked_free_throw_runs SET state='consumed',consumed_at_ms=$2 WHERE id=$1", [runId, at]);
      await pool.query("INSERT INTO ranked_free_throw_scores(id,run_id,score,outcomes,shot_inputs,achieved_at_ms) VALUES($1,$2,2,'11',$3,$4)", [id, runId, JSON.stringify(shots), at]);
    }
    expect((await store.board("weekly", null, config, null)).entries.map(e => e.username)).toEqual(["beta", "alpha"]);
    expect((await store.board("all-time", null, config, null)).entries).toHaveLength(2);
    await store.reconcile([p], config, new Map([[p.id, receipt(p, "final")]]));
    expect((await store.board("archive", p.id, config, null)).entries.map(e => e.username)).toEqual(["beta", "alpha"]);
    expect((await pool.query("SELECT score_id FROM arcade_weekly_results WHERE account_id=$1", [a.subject])).rows[0].score_id).toBe("00000000-0000-4000-8000-000000000002");
  });
  it.each(["live", "final"] as const)("ignores queued older %s authority after a newer missing observation commits", async olderState => {
    const at = Date.now();
    await store.reconcile([p], config, new Map([[p.id, { ...receipt(p), checkedAtMs: at - 4000 }]]));
    const runId = await seed(), blocker = await pool.connect(), pending: Promise<string[]>[] = [];
    const waitForWorkers = async (count: number) => {
      const deadline = Date.now() + 3000;
      while (Date.now() < deadline) {
        const rows = await pool.query("SELECT pid FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock' AND query LIKE '%pg_advisory_xact_lock%'", [schema]);
        if (rows.rowCount === count) return;
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      throw new Error("worker did not queue on advisory lock");
    };
    try {
      await blocker.query("BEGIN"); await blocker.query("SELECT pg_advisory_xact_lock(7042026)");
      pending.push(store.reconcile([p], config, new Map([[p.id, { ...receipt(p, "missing"), checkedAtMs: at - 1000 }]])));
      await waitForWorkers(1);
      pending.push(store.reconcile([p], config, new Map([[p.id, { ...receipt(p, olderState), checkedAtMs: at - 2000 }]])));
      await waitForWorkers(2); await blocker.query("COMMIT");
      expect(await Promise.all(pending)).toEqual([[], []]);
      expect((await store.board("weekly", null, config, null)).phase).toBe("blocked");
      expect((await store.start(b, config)).status).toBe("week_closing");
      expect((await submitRankedScore(runtime(), a, { runId, shots })).status).toBe("invalid_run");
      expect(await store.archives()).toHaveLength(0);
      expect((await pool.query("SELECT receipt->>'checkedAtMs' AS observed FROM arcade_competition_periods WHERE id=$1", [p.id])).rows[0].observed).toBe(String(at - 1000));
    } finally { await blocker.query("ROLLBACK"); blocker.release(); await Promise.allSettled(pending); }
  });
  it("uses sealed eligibility and scoring format when the weekly fallback selects the last final", async () => {
    await store.reconcile([p], config, new Map([[p.id, receipt(p)]]));
    const runId = await seed(); await submitRankedScore(runtime(), a, { runId, shots });
    await store.reconcile([p], config, new Map([[p.id, receipt(p, "final")]]));
    const original = await store.board("weekly", null, config, a.subject);
    const team = randomUUID(); await pool.query("INSERT INTO site_users(id,team_id,display_name,password_hash) VALUES($1,'1','Team','unused')", [team]);
    await pool.query("INSERT INTO account_identities(subject,user_id,active) VALUES($1,$2,true)", [a.subject, team]);
    expect((await store.board("weekly", null, config, null, "league")).entries).toEqual((await store.board("archive", p.id, config, null, "league")).entries);
    expect((await store.board("weekly", null, config, null, "league")).entries).toHaveLength(0);
    expect((await store.board("all-time", null, config, null, "league")).entries).toHaveLength(1);
    const changedPolicy = { ...policy, shots: 3 }, changed = { ...config, policy: changedPolicy, rulesVersion: freeThrowRulesVersion(changedPolicy) };
    const final = await store.board("weekly", null, changed, a.subject);
    expect(final).toMatchObject({ kind: "weekly", phase: "final", scoreVersion: original.scoreVersion, entries: original.entries });
  });
  it.each([["live", "missing"], ["missing", "live"], ["live", "postponed"], ["postponed", "live"]] as const)(
    "blocks equal-time %s then %s conflicts regardless of worker order", async (first, second) => {
      const at = Date.now() - 1000;
      await store.reconcile([p], config, new Map([[p.id, { ...receipt(p), checkedAtMs: at - 1000 }]]));
      const runId = await seed(), blocker = await pool.connect(), pending: Promise<string[]>[] = [];
      const waitForWorkers = async (count: number) => {
        const deadline = Date.now() + 3000;
        while (Date.now() < deadline) {
          const rows = await pool.query("SELECT pid FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock' AND query LIKE '%pg_advisory_xact_lock%'", [schema]);
          if (rows.rowCount === count) return;
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        throw new Error("equal-time worker did not queue");
      };
      try {
        await blocker.query("BEGIN"); await blocker.query("SELECT pg_advisory_xact_lock(7042026)");
        pending.push(store.reconcile([p], config, new Map([[p.id, { ...receipt(p, first), checkedAtMs: at }]])));
        await waitForWorkers(1);
        pending.push(store.reconcile([p], config, new Map([[p.id, { ...receipt(p, second), checkedAtMs: at }]])));
        await waitForWorkers(2); await blocker.query("COMMIT");
        expect(await Promise.all(pending)).toEqual([[], []]);
        expect((await store.board("weekly", null, config, null)).phase).toBe("blocked");
        expect((await store.start(b, config)).status).toBe("week_closing");
        expect((await submitRankedScore(runtime(), a, { runId, shots })).status).toBe("invalid_run");
        expect(await store.archives()).toHaveLength(0);
        // Another equal-time live replay cannot clear the stored conflict.
        await store.reconcile([p], config, new Map([[p.id, { ...receipt(p), checkedAtMs: at }]]));
        expect((await store.board("weekly", null, config, null)).phase).toBe("blocked");
        // A genuinely later fresh observation can recover without a manual override.
        await store.reconcile([p], config, new Map([[p.id, receipt(p)]]));
        expect((await store.board("weekly", null, config, null)).phase).toBe("open");
      } finally { await blocker.query("ROLLBACK"); blocker.release(); await Promise.allSettled(pending); }
    });
  it("treats an exact equal-time repeat as an idempotent no-op", async () => {
    const observation = { ...receipt(p), checkedAtMs: Date.now() - 1000 };
    await store.reconcile([p], config, new Map([[p.id, observation]]));
    const before = (await pool.query("SELECT xmin::text AS version,receipt FROM arcade_competition_periods WHERE id=$1", [p.id])).rows[0];
    expect(await store.reconcile([p], config, new Map([[p.id, { ...observation, states: { ...observation.states } }]]))).toEqual([]);
    const after = (await pool.query("SELECT xmin::text AS version,receipt FROM arcade_competition_periods WHERE id=$1", [p.id])).rows[0];
    expect(after).toEqual(before);
    expect((await store.board("weekly", null, config, null)).phase).toBe("open");
    expect((await store.start(a, config)).status).toBe("created");
  });
  it("retains a lookahead conflict while its predecessor is unfinished", async () => {
    const at = Date.now() - 1000;
    await store.reconcile([p, next], config, new Map([[p.id, receipt(p)], [next.id, { ...receipt(next), checkedAtMs: at }]]));
    await store.reconcile([p, next], config, new Map([[next.id, { ...receipt(next, "missing"), checkedAtMs: at }]]));
    await store.reconcile([p, next], config, new Map([[p.id, receipt(p, "final")], [next.id, { ...receipt(next), checkedAtMs: at }]]));
    expect((await store.board("weekly", null, config, null))).toMatchObject({ periodId: next.id, phase: "blocked" });
    expect((await store.start(a, config)).status).toBe("week_closing");
  });
  it("passes a dedicated-token mounted POST through the actual period transaction", async () => {
    const token = "a".repeat(64), at = Date.now();
    const utc = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
    vi.stubEnv("GOAT_ARCADE_RECONCILE_ENABLED", "1"); vi.stubEnv("GOAT_ARCADE_RECONCILE_TOKEN", token);
    vi.stubEnv("GOAT_ARCADE_RECONCILE_NOT_BEFORE", utc(at - 2000)); vi.stubEnv("GOAT_ARCADE_RECONCILE_EXPIRES_AT", utc(at + 60000));
    vi.stubEnv("GOAT_ARCADE_CALENDAR", JSON.stringify([p]));
    worker.factory.mockReturnValue({ configuration: config, store: () => store });
    worker.finality.mockImplementation(async (period: CompetitionPeriod) => receipt(period));
    const response = await POST(new Request("https://test.invalid/api/arcade/competition/reconcile", { method: "POST", headers: { authorization: `Bearer ${token}` } }));
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ status: "ready", finalized: [] });
    expect((await store.board("weekly", null, config, null)).phase).toBe("open");
    expect(Number((await pool.query("SELECT count(*) FROM ranked_free_throw_scores")).rows[0].count)).toBe(0);
  });
  it("rejects expiry after a queued advisory lock before publishing any period", async () => {
    const blocker = await pool.connect();
    const window = { notBeforeMs: Date.now() - 1000, expiresAtMs: Date.now() + 1000 };
    let pending: Promise<string[]> | undefined;
    try {
      await blocker.query("BEGIN"); await blocker.query("SELECT pg_advisory_xact_lock(7042026)");
      pending = store.reconcile([p], config, new Map([[p.id, receipt(p)]]), window);
      const rejection = expect(pending).rejects.toThrow("reconcile_window_closed");
      const deadline = Date.now() + 3000; let waited = false;
      while (Date.now() < deadline) {
        const rows = await pool.query("SELECT pid FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock' AND query LIKE '%pg_advisory_xact_lock(7042026)%'", [schema]);
        if (rows.rows.length) { waited = true; break; } await new Promise(resolve => setTimeout(resolve, 20));
      }
      expect(waited).toBe(true);
      await new Promise(resolve => setTimeout(resolve, Math.max(0, window.expiresAtMs - Date.now() + 20)));
      await blocker.query("COMMIT"); await rejection;
      expect(Number((await pool.query("SELECT count(*) FROM arcade_competition_periods")).rows[0].count)).toBe(0);
    } finally { await blocker.query("ROLLBACK"); blocker.release(); if (pending) await Promise.allSettled([pending]); }
  });
  it("rolls publication/finalization back when expiry precedes final SQL authorization", async () => {
    const blocker = await pool.connect();
    await pool.query("CREATE FUNCTION wait_for_window() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_advisory_xact_lock(7042027); RETURN NEW; END; $$; CREATE TRIGGER wait_for_window BEFORE INSERT ON arcade_competition_periods FOR EACH ROW EXECUTE FUNCTION wait_for_window()");
    const window = { notBeforeMs: Date.now() - 1000, expiresAtMs: Date.now() + 1000 };
    let pending: Promise<string[]> | undefined;
    try {
      await blocker.query("BEGIN"); await blocker.query("SELECT pg_advisory_xact_lock(7042027)");
      pending = store.reconcile([p], config, new Map([[p.id, receipt(p, "final")]]), window);
      const rejection = expect(pending).rejects.toThrow("reconcile_window_closed");
      const deadline = Date.now() + 3000; let waited = false;
      while (Date.now() < deadline) {
        const rows = await pool.query("SELECT pid FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock' AND query LIKE '%INSERT INTO arcade_competition_periods%'", [schema]);
        if (rows.rows.length) { waited = true; break; } await new Promise(resolve => setTimeout(resolve, 20));
      }
      expect(waited).toBe(true);
      await new Promise(resolve => setTimeout(resolve, Math.max(0, window.expiresAtMs - Date.now() + 20)));
      await blocker.query("COMMIT"); await rejection;
      expect(Number((await pool.query("SELECT count(*) FROM arcade_competition_periods")).rows[0].count)).toBe(0);
      expect(await store.archives()).toHaveLength(0);
    } finally {
      await blocker.query("ROLLBACK"); blocker.release(); if (pending) await Promise.allSettled([pending]);
      await pool.query("DROP TRIGGER wait_for_window ON arcade_competition_periods; DROP FUNCTION wait_for_window()");
    }
  });
  it("permits COMMIT after expiry once final SQL authorization passed", async () => {
    // Test-only deferred constraint: the production migration has no such trigger.
    await pool.query(`CREATE TABLE commit_cutoff_probe(observed_ms bigint NOT NULL);
      CREATE FUNCTION wait_for_commit_cutoff() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
        PERFORM pg_advisory_xact_lock(7042028);
        INSERT INTO commit_cutoff_probe VALUES(floor(extract(epoch FROM clock_timestamp())*1000)::bigint);
        RETURN NEW;
      END; $$;
      CREATE CONSTRAINT TRIGGER wait_for_commit_cutoff AFTER INSERT ON arcade_competition_periods
        DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION wait_for_commit_cutoff()`);
    const blocker = await pool.connect(), token = "a".repeat(64);
    const expiresAtMs = Math.ceil((Date.now() + 3000) / 1000) * 1000;
    const utc = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
    vi.stubEnv("GOAT_ARCADE_RECONCILE_ENABLED", "1"); vi.stubEnv("GOAT_ARCADE_RECONCILE_TOKEN", token);
    vi.stubEnv("GOAT_ARCADE_RECONCILE_NOT_BEFORE", utc(Date.now() - 5000)); vi.stubEnv("GOAT_ARCADE_RECONCILE_EXPIRES_AT", utc(expiresAtMs));
    vi.stubEnv("GOAT_ARCADE_CALENDAR", JSON.stringify([p]));
    worker.factory.mockReturnValue({ configuration: config, store: () => store });
    worker.finality.mockImplementation(async (period: CompetitionPeriod) => receipt(period, "final"));
    const request = () => new Request("https://test.invalid/api/arcade/competition/reconcile", { method: "POST", headers: { authorization: `Bearer ${token}` } });
    let pending: Promise<Response> | undefined;
    try {
      await blocker.query("BEGIN"); await blocker.query("SELECT pg_advisory_xact_lock(7042028)");
      pending = POST(request());
      const deadline = Date.now() + 2000; let waited = false;
      while (Date.now() < deadline) {
        const rows = await pool.query("SELECT pid FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock' AND query ILIKE 'commit%'", [schema]);
        if (rows.rows.length) { waited = true; break; } await new Promise(resolve => setTimeout(resolve, 20));
      }
      // A blocked COMMIT proves the callback and its final SQL check already passed.
      expect(waited).toBe(true); expect(Date.now()).toBeLessThan(expiresAtMs);
      await new Promise(resolve => setTimeout(resolve, Math.max(0, expiresAtMs - Date.now() + 50)));
      await blocker.query("COMMIT");
      const response = await pending;
      expect(Date.now()).toBeGreaterThanOrEqual(expiresAtMs);
      expect(response.status).toBe(200); expect(await response.json()).toEqual({ status: "ready", finalized: [p.id] });
      const saved = (await pool.query("SELECT receipt,closed_at_ms,finalized_at_ms FROM arcade_competition_periods WHERE id=$1", [p.id])).rows[0];
      expect(saved.receipt.states).toEqual({ [p.fixtures[0].id]: "final" });
      expect(Number(saved.closed_at_ms)).toBeLessThan(expiresAtMs); expect(saved.finalized_at_ms).toEqual(saved.closed_at_ms);
      expect(Number((await pool.query("SELECT observed_ms FROM commit_cutoff_probe")).rows[0].observed_ms)).toBeGreaterThanOrEqual(expiresAtMs);
      expect(await store.archives()).toHaveLength(1);
      // Expiry denies a new request before runtime/source work; committed state stays.
      const retry = await POST(request());
      expect(retry.status).toBe(401); expect(await retry.json()).toEqual({ status: "unauthorized" });
      expect(worker.factory).toHaveBeenCalledTimes(1); expect(worker.finality).toHaveBeenCalledTimes(1);
      expect((await pool.query("SELECT receipt,closed_at_ms,finalized_at_ms FROM arcade_competition_periods WHERE id=$1", [p.id])).rows[0]).toEqual(saved);
    } finally {
      await blocker.query("ROLLBACK"); blocker.release(); if (pending) await Promise.allSettled([pending]);
      await pool.query("DROP TRIGGER wait_for_commit_cutoff ON arcade_competition_periods; DROP FUNCTION wait_for_commit_cutoff(); DROP TABLE commit_cutoff_probe");
    }
  }, 10000);
});
