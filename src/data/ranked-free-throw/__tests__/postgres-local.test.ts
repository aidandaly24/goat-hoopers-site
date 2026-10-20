/** Opt-in real PostgreSQL + pinned Better Auth. Fixed existing local fixture only. */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import type { FriendsDb } from "../../friends-auth/db";

// Only the composition-root DB accessor is injected: it returns a real Drizzle
// PostgreSQL adapter. Provider verification, SQL, locks and transactions are real.
const dependencies = vi.hoisted(() => ({ db: undefined as FriendsDb | undefined }));
vi.mock("../../friends-auth/db", async importOriginal => ({
  ...await importOriginal<typeof import("../../friends-auth/db")>(),
  getFriendsDb: () => { if (!dependencies.db) throw new Error("local database not initialized"); return dependencies.db; },
}));
import { friendsSchema } from "../../friends-auth/db";
import { createFriendsAuth, type AccountMail } from "../../friends-auth/provider";
import { providerSchema } from "../../friends-auth/schema";
import { getVerifiedAccount } from "../../friends-auth/runtime";
import { PostgresRankedFreeThrowStore } from "../store";
import { handleRankedRequest } from "../http";
import { freeThrowRulesVersion } from "../config";
import { submitRankedScore } from "../service";
import { parseFreeThrowPolicy, rankedPeriod, rankedReplayContext, replayRankedRound, type RankedAccount, type RankedRun } from "@/domain/arcade/ranked-free-throw";

describe.skipIf(process.env.RUN_CLAIM_TEAM_LOCAL_TEST !== "1")("ranked Free Throw against disposable PostgreSQL and real provider sessions", () => {
  const schema = `ranked_local_${randomUUID().replaceAll("-", "")}`;
  const pool = new Pool({ host: "127.0.0.1", port: 55441, database: "claim_team_test", user: "postgres", ssl: false,
    max: 8, connectionTimeoutMillis: 1500, query_timeout: 10000, statement_timeout: 8000,
    options: `-c search_path=${schema} -c application_name=${schema} -c lock_timeout=6000 -c idle_in_transaction_session_timeout=10000` });
  const db = drizzle(pool, { schema: friendsSchema });
  const config = { origin: "https://goat.test", secret: randomBytes(48).toString("hex"), secureCookies: true };
  const policy = parseFreeThrowPolicy({ ruleSetId: "isolated-postgres-only", engine: "moving-court-makes-v2", shots: 2,
    durationMs: 30000, minShotIntervalMs: 1000, maxRunsPerWeek: 3 })!;
  const configuration = { status: "ready" as const, policy, rulesVersion: freeThrowRulesVersion(policy) };
  const mail: AccountMail[] = [];
  const auth = () => createFriendsAuth({ config, database: drizzleAdapter(db, { provider: "pg", schema: providerSchema, transaction: true }),
    allowSignup: true, sendMail: async message => { mail.push(message); } });
  let ownsSchema = false;
  let first: { headers: Headers; account: RankedAccount }, second: typeof first;
  const evidence = [{ atMs: 0, direction: 0, power: 50 }, { atMs: 7000, direction: 14, power: 50 }];
  const runtime = () => ({ configuration, origin: () => config.origin,
    account: async (h: Headers) => { const a = await getVerifiedAccount(h); return a ? { subject: a.subject, sessionId: a.sessionId } : null; },
    admitRequest: async () => true,
    store: () => new PostgresRankedFreeThrowStore({ execute: async q => db.execute(q),
      transaction: work => db.transaction(tx => work({ execute: async q => tx.execute(q) }), { isolationLevel: "read committed" }) }) });
  const startRoute = (r: Request) => handleRankedRequest(r, "start", runtime());
  const scoreRoute = (r: Request) => handleRankedRequest(r, "submit", runtime());
  const resultRoute = (r: Request) => handleRankedRequest(r, "result", runtime());
  const boardRoute = (r: Request) => handleRankedRequest(r, "leaderboard", runtime());
  const post = (path: string, headers: Headers, value: unknown) => new Request(`${config.origin}/api/arcade/free-throw/${path}`, {
    method: "POST", headers: new Headers([...headers, ["content-type", "application/json"]]), body: JSON.stringify(value) });
  const get = (path: string, headers: Headers) => new Request(`${config.origin}/api/arcade/free-throw/${path}`, { headers });

  async function actor(username: string, verified = true) {
    const email = `${username}@example.test`, password = "synthetic-local-password-only";
    await auth().api.signUpEmail({ body: { email, password, name: username } });
    if (verified) {
      const verification = mail.findLast(message => message.to === email && message.kind === "verify")!;
      expect((await auth().handler(new Request(verification.url))).status).toBe(302);
    }
    const signed = await auth().api.signInEmail({ body: { email, password }, asResponse: true });
    if (!verified) { expect(signed.ok).toBe(false); return null; }
    expect(signed.ok).toBe(true);
    const headers = new Headers({ origin: config.origin, cookie: signed.headers.getSetCookie().map(value => value.split(";")[0]).join("; ") });
    const account = await getVerifiedAccount(headers);
    expect(account).not.toBeNull();
    return { headers, account: account! };
  }
  async function seededRun(account = first.account, expiresInMs = 15000): Promise<RankedRun> {
    const now = Number((await pool.query("SELECT floor(extract(epoch FROM clock_timestamp())*1000)::bigint AS now")).rows[0].now);
    const period = rankedPeriod(now, policy.calendar), run: RankedRun = { id: randomUUID(), userId: account.subject,
      gameId: "free-throw", rulesVersion: configuration.rulesVersion, week: period.week,
      startedAtMs: now + expiresInMs - policy.durationMs, expiresAtMs: now + expiresInMs, state: "open", period };
    await pool.query(`INSERT INTO ranked_free_throw_runs(id,account_id,rules_version,rules,replay_context,week,
      week_starts_at_ms,week_ends_at_ms,started_at_ms,expires_at_ms,state) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'open')`,
    [run.id, account.subject, run.rulesVersion, JSON.stringify(policy), JSON.stringify(rankedReplayContext()), run.week,
      period.startsAtMs, period.endsAtMs, run.startedAtMs, run.expiresAtMs]);
    return run;
  }
  async function cleanupRuns() { await pool.query("TRUNCATE arcade_weekly_results, ranked_free_throw_scores, ranked_free_throw_runs"); }
  async function waitForLocks(minimum: number, pattern = "%FOR UPDATE OF a, s%") {
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline) {
      const rows = (await pool.query(`SELECT pid FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock'
        AND query LIKE $2`, [schema, pattern])).rows;
      if (rows.length >= minimum) return rows;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw new Error("independent PostgreSQL connections did not overlap at the auth lock");
  }

  beforeAll(async () => {
    const target = (await pool.query("SELECT current_database() AS db, version() AS version")).rows[0];
    expect(target.db).toBe("claim_team_test"); expect(target.version).toContain("PostgreSQL 16.");
    await pool.query(`CREATE SCHEMA ${schema}`); ownsSchema = true;
    await pool.query(`CREATE TABLE site_users(id uuid PRIMARY KEY,team_id text UNIQUE NOT NULL,display_name text NOT NULL,
      password_hash text NOT NULL,created_at timestamp NOT NULL DEFAULT now());
      CREATE TABLE invite_codes(code text PRIMARY KEY,team_id text NOT NULL,used_by uuid,used_at timestamp,created_at timestamp NOT NULL DEFAULT now());
      CREATE TABLE sessions(token_hash text PRIMARY KEY,user_id uuid REFERENCES site_users(id),expires_at timestamp NOT NULL,created_at timestamp NOT NULL DEFAULT now());`);
    const authMigration = await readFile("db/friends-auth/0000_friends_auth.sql", "utf8");
    await pool.query(authMigration.replaceAll('"public".', `"${schema}".`));
    await pool.query(await readFile("db/friends-auth/0001_account_usernames.sql", "utf8"));
    await pool.query(await readFile("migrations/ranked-free-throw.sql", "utf8"));
    dependencies.db = db;
    vi.stubEnv("FRIENDS_AUTH_ENROLLMENT", "1"); vi.stubEnv("FRIENDS_AUTH_ENABLED", "");
    vi.stubEnv("BETTER_AUTH_URL", config.origin); vi.stubEnv("BETTER_AUTH_SECRET", config.secret);
    vi.stubEnv("GOAT_RANKED_FREE_THROW_ENABLED", "1"); vi.stubEnv("GOAT_RANKED_FREE_THROW_RULES", JSON.stringify(policy));
    first = (await actor("first_hooper"))!; second = (await actor("second_hooper"))!;
  }, 30000);
  afterAll(async () => {
    dependencies.db = undefined; vi.unstubAllEnvs();
    if (ownsSchema) await pool.query(`DROP SCHEMA ${schema} CASCADE`);
    await pool.end();
  });

  it("executes actual exported route → verified provider → PostgreSQL store boundaries", async () => {
    await cleanupRuns();
    expect((await startRoute(post("runs", new Headers({ origin: config.origin }), {}))).status).toBe(401);
    const started = await startRoute(post("runs", first.headers, {}));
    expect(started.status).toBe(201);
    const body = await started.json();
    expect(body.run).not.toHaveProperty("userId"); expect(body.run.rulesVersion).toBe(configuration.rulesVersion);
    expect((await pool.query("SELECT account_id FROM ranked_free_throw_runs WHERE id=$1", [body.run.id])).rows).toEqual([{ account_id: first.account.subject }]);
    expect((await startRoute(post("runs", first.headers, {}))).status).toBe(409);
    await cleanupRuns();
    const run = await seededRun(), saved = await scoreRoute(post("scores", first.headers, { runId: run.id, shots: evidence }));
    expect(saved.status).toBe(201);
    expect(await saved.json()).toMatchObject({ status: "saved", score: { score: 1, makes: 1, attempts: 2, accuracy: .5, longestStreak: 1, endingStreak: 0, outcomes: [1, 0] } });
    expect((await pool.query("SELECT outcomes,shot_inputs FROM ranked_free_throw_scores WHERE run_id=$1", [run.id])).rows).toEqual([{ outcomes: "10", shot_inputs: evidence }]);
    expect((await resultRoute(get(`results?runId=${run.id}`, first.headers))).status).toBe(200);
    expect((await resultRoute(get(`results?runId=${run.id}`, second.headers))).status).toBe(404);
    expect((await scoreRoute(post("scores", second.headers, { runId: run.id, shots: evidence }))).status).toBe(409);
    const board = await boardRoute(get("leaderboard?scope=everyone", first.headers));
    expect(await board.json()).toMatchObject({ entries: [{ score: 1, username: "first_hooper", teamId: null, longestStreak: 1, endingStreak: 0 }] });
    expect(await (await boardRoute(get("leaderboard?scope=league", first.headers))).json()).toMatchObject({ entries: [] });
  });

  it("commits exactly one of four duplicate submissions overlapping at real PostgreSQL locks", async () => {
    await cleanupRuns(); const run = await seededRun(), blocker = await pool.connect();
    await blocker.query("BEGIN"); await blocker.query("SELECT id FROM auth_user WHERE id=$1 FOR UPDATE", [first.account.subject]);
    const pending = Promise.all(Array.from({ length: 4 }, () => submitRankedScore(runtime(), first.account, { runId: run.id, shots: evidence })));
    try { expect(new Set((await waitForLocks(4)).map(row => row.pid)).size).toBe(4); }
    finally { await blocker.query("ROLLBACK"); blocker.release(); }
    const results = await pending;
    expect(results.filter(result => result.status === "saved")).toHaveLength(1);
    expect(results.filter(result => result.status === "invalid_run")).toHaveLength(3);
    expect((await pool.query("SELECT state FROM ranked_free_throw_runs WHERE id=$1", [run.id])).rows).toEqual([{ state: "consumed" }]);
    expect((await pool.query("SELECT score,outcomes FROM ranked_free_throw_scores WHERE run_id=$1", [run.id])).rows).toEqual([{ score: 1, outcomes: "10" }]);
  }, 15000);

  it("rolls back run consumption after a real insert failure, then accepts the same evidence", async () => {
    await cleanupRuns(); const run = await seededRun();
    await pool.query("ALTER TABLE ranked_free_throw_scores ADD CONSTRAINT synthetic_insert_failure CHECK(score<>1)");
    try {
      expect((await scoreRoute(post("scores", first.headers, { runId: run.id, shots: evidence }))).status).toBe(503);
      expect((await pool.query("SELECT state,consumed_at_ms FROM ranked_free_throw_runs WHERE id=$1", [run.id])).rows).toEqual([{ state: "open", consumed_at_ms: null }]);
      expect((await pool.query("SELECT id FROM ranked_free_throw_scores WHERE run_id=$1", [run.id])).rowCount).toBe(0);
    } finally { await pool.query("ALTER TABLE ranked_free_throw_scores DROP CONSTRAINT synthetic_insert_failure"); }
    expect((await scoreRoute(post("scores", first.headers, { runId: run.id, shots: evidence }))).status).toBe(201);
  });

  it("serializes real admissions, preserves metadata and enforces caps across abandoned runs", async () => {
    await cleanupRuns();
    const results = await Promise.all(Array.from({ length: 4 }, () => runtime().store().start(first.account, configuration)));
    expect(results.filter(result => result.status === "created")).toHaveLength(1);
    expect(results.filter(result => result.status === "busy")).toHaveLength(3);
    const id = (await pool.query("SELECT id FROM ranked_free_throw_runs")).rows[0].id;
    await expect(pool.query("UPDATE ranked_free_throw_runs SET account_id=$1 WHERE id=$2", [second.account.subject, id])).rejects.toMatchObject({ code: "P0001" });
    await pool.query("UPDATE ranked_free_throw_runs SET state='expired' WHERE id=$1", [id]);
    for (let i = 1; i < policy.maxRunsPerWeek!; i++) {
      const started = await runtime().store().start(first.account, configuration); expect(started.status).toBe("created");
      if (started.status === "created") await pool.query("UPDATE ranked_free_throw_runs SET state='expired' WHERE id=$1", [started.run.id]);
    }
    expect(await runtime().store().start(first.account, configuration)).toEqual({ status: "quota" });
  });

  it("denies revoked provider sessions at both route and final database acceptance", async () => {
    await cleanupRuns(); const run = await seededRun(second.account);
    const store = runtime().store(), stored = await store.readRun(second.account, run.id); expect(stored).not.toBeNull();
    const round = replayRankedRound(evidence, Date.now() - run.startedAtMs, policy);
    await pool.query("DELETE FROM auth_session WHERE id=$1", [second.account.sessionId]);
    expect(await store.consume(second.account, run, round)).toBeNull();
    expect((await scoreRoute(post("scores", second.headers, { runId: run.id, shots: evidence }))).status).toBe(401);
    expect(await submitRankedScore(runtime(), second.account, { runId: run.id, shots: evidence })).toEqual({ status: "invalid_run" });
    expect((await pool.query("SELECT id FROM ranked_free_throw_scores WHERE run_id=$1", [run.id])).rowCount).toBe(0);
  });

  it("checks expiry after a real run-lock wait rather than accepting a pre-lock clock", async () => {
    await cleanupRuns(); const run = await seededRun(first.account, 500), store = runtime().store();
    const round = replayRankedRound(evidence, Date.now() - run.startedAtMs, policy), blocker = await pool.connect();
    await blocker.query("BEGIN"); await blocker.query("SELECT id FROM ranked_free_throw_runs WHERE id=$1 FOR UPDATE", [run.id]);
    const pending = store.consume(first.account, run, round);
    try {
      expect(await waitForLocks(1, "%FROM ranked_free_throw_runs%FOR UPDATE%")).toHaveLength(1);
      await new Promise(resolve => setTimeout(resolve, Math.max(0, run.expiresAtMs - Date.now() + 30)));
    } finally { await blocker.query("ROLLBACK"); blocker.release(); }
    expect(await pending).toBeNull();
    expect((await pool.query("SELECT state,consumed_at_ms FROM ranked_free_throw_runs WHERE id=$1", [run.id])).rows).toEqual([{ state: "open", consumed_at_ms: null }]);
    expect((await pool.query("SELECT id FROM ranked_free_throw_scores WHERE run_id=$1", [run.id])).rowCount).toBe(0);
  });
});
