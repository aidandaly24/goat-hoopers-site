/** CI-only: actual PostgreSQL SQL/locks/triggers, fixed synthetic endpoint, no Neon/provider I/O. */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { Pool, type PoolClient } from "pg";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import type { Db } from "../../db";
import { AiDeciderStore, PostgresAiPersistence, emptyBudgetState, AI_BUDGET, type AiIdentity, type AiLegacyIdentity, type AiBudgetState, type AiStoredWeek, type AiWeeklyJobIdentity } from "../store";
import type { AiForecastRevision } from "@/domain/ai-decider";
import { generateWeeklyPicks, resolveAiIdentity, runAiDecision } from "../service";
import { buildForecastRevision, computeForecastTeamLine, type AiForecastTeamInput } from "../forecast";
import { loadAiForecastState } from "../forecast-service";
import { loadAiDecidesData } from "../runtime";
import { decodeDecision } from "../provider";
import { AI_WEEKLY_MANIFEST, cachedWeek, manifestForInput, prepareWeeklySlate, recordWeeklyOutcome, weekHash, weekKey, weeklyDecision } from "../weekly";
import { refreshStorageKey, WEEK1_REFRESH_KEY } from "../refresh-policy";
import { refreshWeek1 } from "../week1-refresh";
import { fingerprint, harness, identity, NOW, providerAnswer, weeklyInput } from "./fixtures";

if (process.env.GITHUB_ACTIONS !== "true" || process.env.CI !== "true" || process.env.RUN_AI_POSTGRES_TEST !== "1") throw new Error("Disposable CI database opt-in required");
const schema = `ai_decides_ci_${randomUUID().replaceAll("-", "")}`;
const pool = new Pool({ host: "127.0.0.1", port: 55447, database: "goat_ai_decides_ci", user: "goat_ai_ci", password: "synthetic-ci-only", ssl: false,
  max: 6, connectionTimeoutMillis: 1500, query_timeout: 1500, statement_timeout: 1000,
  options: `-c search_path=${schema} -c lock_timeout=250 -c idle_in_transaction_session_timeout=5000` });
const migration = readFileSync("migrations/ai-decider.sql", "utf8");
const forecastMigration = readFileSync("migrations/ai-decider-forecast.sql", "utf8");
const migrationHash = createHash("sha256").update(migration).digest("hex");
const dialect = new PgDialect();
// Only the driver transport changes: production PostgresAiPersistence emits the
// actual parameterized Drizzle SQL, executed on PostgreSQL by pg. Not a Neon test.
const db = { execute: async (statement: SQL) => {
  const query = dialect.sqlToQuery(statement);
  return pool.query(query.sql, query.params);
} } as unknown as Db;
const persistence = () => new PostgresAiPersistence(db);
// Held-lock concurrency regressions need sessions that may WAIT on a row
// lock: the shared pool's lock_timeout (250ms) and statement_timeout
// (1000ms) would kill a legitimately blocked statement, so those tests
// run on their own pool with patient timeouts — same database, same
// schema, same store code; only the transport's session settings differ.
const racePool = new Pool({ host: "127.0.0.1", port: 55447, database: "goat_ai_decides_ci", user: "goat_ai_ci", password: "synthetic-ci-only", ssl: false,
  max: 4, connectionTimeoutMillis: 2000, query_timeout: 30000, statement_timeout: 30000,
  options: `-c search_path=${schema} -c idle_in_transaction_session_timeout=60000` });
const raceDbFor = (client: PoolClient) => ({ execute: async (statement: SQL) => {
  const query = dialect.sqlToQuery(statement);
  return client.query(query.sql, query.params);
} } as unknown as Db);
const racePersistence = (client: PoolClient) => new PostgresAiPersistence(raceDbFor(client));
const pidOf = async (client: PoolClient): Promise<number> => (await client.query<{ pid: number }>("SELECT pg_backend_pid() AS pid")).rows[0].pid;
/**
 * Deterministic overlap: poll the lock catalog until the victim backend
 * is OBSERVED waiting on a lock (an observable state, not a timing
 * guess). Fails loudly if the victim settles first — a statement that
 * completes without ever blocking did not exercise the race. With
 * `anyBlocker`, any observed blocker satisfies the wait: in a lock
 * convoy (two racers queued on one row lock) the second waiter is
 * attributed to the waiter ahead of it rather than to the original
 * holder, and either attribution proves it is queued in the convoy.
 */
const waitForBlocked = async (victimPid: number, blockerPid: number, isSettled: () => boolean, anyBlocker = false): Promise<void> => {
  let last: number[] = [];
  for (let i = 0; i < 100; i++) {
    const blockers = (await pool.query<{ b: number[] }>("SELECT pg_blocking_pids($1) AS b", [victimPid])).rows[0].b;
    last = blockers;
    if (anyBlocker ? blockers.length > 0 : blockers.includes(blockerPid)) return;
    if (isSettled()) throw new Error(`backend ${victimPid} settled without ever blocking on ${blockerPid}`);
    await new Promise(r => setTimeout(r, 5));
  }
  throw new Error(`backend ${victimPid} never blocked on ${blockerPid} (last blockers: ${last.join(",") || "none"})`);
};
const store = () => new AiDeciderStore(persistence());
const token = (n = 1) => n.toString(16).padStart(64, "0");
const principal = (n = 1): AiLegacyIdentity => ({ kind: "legacy", userId: identity(n).userId, tokenHash: createHash("sha256").update(token(n)).digest("hex") });
const providerPrincipal = (n = 1): Extract<AiIdentity, { kind: "friends" }> => ({ kind: "friends", userId: identity(n).userId,
  sessionId: `provider-session-${n}`, subject: `provider-subject-${n}` });
const control = async () => (await persistence().readControl())!;
const updateState = async (state: AiBudgetState) => pool.query("UPDATE ai_decider_control SET state=$1::jsonb", [JSON.stringify(state)]);
const draft = { kind: "custom", prompt: "Synthetic option?", choices: ["One", "Two"] };
let ownsSchema = false;

function realHarness() {
  const h = harness(); h.runtime.store = store();
  h.runtime.sessions = { getSessionUser: async hash => {
    const result = await pool.query<{ id: string; team_id: string; display_name: string; created_at: Date; expires_at: Date }>(
      "SELECT u.id,u.team_id,u.display_name,u.created_at,s.expires_at FROM sessions s JOIN site_users u ON u.id=s.user_id WHERE s.token_hash=$1", [hash]);
    const row = result.rows[0];
    return row ? { user: { id: row.id, teamId: row.team_id, displayName: row.display_name, createdAt: row.created_at }, expiresAt: row.expires_at } : null;
  } };
  return h;
}
function candidate(input = weeklyInput()): AiStoredWeek {
  return { key: weekKey(input), hash: weekHash(input), manifest: structuredClone(AI_WEEKLY_MANIFEST), input, slate: prepareWeeklySlate(input, NOW), result: null };
}
function completed(record: AiStoredWeek) {
  const decision = weeklyDecision(record.input, record.slate, "f".repeat(64));
  const results = decodeDecision(providerAnswer(decision.payload), decision.specs).results;
  return { ...record.slate, status: "ready" as const, generatedAt: new Date(NOW).toISOString(),
    matchups: record.slate.matchups.map((m, i) => ({ ...m, status: "ready" as const, result: results[i] })) };
}

async function refreshFixture() {
  const base = weeklyInput();
  const input = { ...base, phase: "pre" as const, scoringMode: "unknown" as const, cutoffAt: base.capturedAt, statsAvailableAt: base.capturedAt, startsAt: "2026-10-20T00:00:00.000Z", endsAt: null,
    preview: { kind: "lineup_strength" as const, sourceLeg: 0, seasonStartDate: "2026-10-20", gameModeCode: 1 } };
  const original: AiStoredWeek = { key: WEEK1_REFRESH_KEY, input, hash: weekHash(input), manifest: { ...manifestForInput(input) }, slate: prepareWeeklySlate(input, NOW), result: null };
  const p = persistence(); await p.sealWeek(original); await p.completeWeek(original.key, original.hash, completed(original));
  const capturedAt = new Date(NOW + 1000).toISOString(), fresh = { ...input, capturedAt, cutoffAt: capturedAt, statsAvailableAt: capturedAt };
  const replacement: AiStoredWeek = { key: WEEK1_REFRESH_KEY, input: fresh, hash: weekHash(fresh), manifest: { ...manifestForInput(fresh) }, slate: prepareWeeklySlate(fresh, NOW + 1000), result: null };
  const policy = { originalHash: original.hash };
  const enabled = () => new PostgresAiPersistence(db, undefined, policy);
  const result = completed(replacement); result.generatedAt = capturedAt;
  return { original: (await p.getOriginalWeek(original.key))!, replacement, result, enabled };
}

beforeAll(async () => {
  const proof = (await pool.query("SELECT current_database() AS db,current_user AS usr,current_setting('server_version_num') AS version")).rows[0];
  expect(proof.db).toBe("goat_ai_decides_ci"); expect(proof.usr).toBe("goat_ai_ci");
  expect(Number(proof.version)).toBeGreaterThanOrEqual(160000); expect(Number(proof.version)).toBeLessThan(170000);
  expect((await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public'")).rows).toHaveLength(0);
  await pool.query(`CREATE SCHEMA "${schema}"`); ownsSchema = true;
  console.info(`Disposable PostgreSQL ${proof.version}; migration SHA256 ${migrationHash}`);
});
beforeEach(async () => {
  if (!ownsSchema) throw new Error("Synthetic schema not owned");
  await pool.query(`DROP SCHEMA "${schema}" CASCADE; CREATE SCHEMA "${schema}"`);
  await pool.query(`CREATE TABLE site_users (id uuid PRIMARY KEY,team_id text NOT NULL,display_name text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE sessions (token_hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES site_users(id),expires_at timestamptz NOT NULL);
    CREATE TABLE auth_user (id text PRIMARY KEY,email_verified boolean NOT NULL DEFAULT false);
    CREATE TABLE auth_session (id text PRIMARY KEY,token text UNIQUE NOT NULL,user_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,expires_at timestamptz NOT NULL);
    CREATE TABLE account_identities (subject text PRIMARY KEY REFERENCES auth_user(id) ON DELETE RESTRICT,
      user_id uuid UNIQUE NOT NULL REFERENCES site_users(id) ON DELETE RESTRICT,active boolean NOT NULL DEFAULT true)`);
  for (let n = 1; n <= 10; n++) {
    const user = principal(n);
    await pool.query("INSERT INTO site_users(id,team_id,display_name) VALUES($1,$2,'Synthetic CI user')", [user.userId, String(n)]);
    await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,'2126-01-01T00:00:00Z')", [user.tokenHash, user.userId]);
    const provider = providerPrincipal(n);
    await pool.query("INSERT INTO auth_user(id,email_verified) VALUES($1,true)", [provider.subject]);
    await pool.query("INSERT INTO auth_session(id,token,user_id,expires_at) VALUES($1,$2,$3,'2126-01-01T00:00:00Z')", [provider.sessionId, `synthetic-ci-token-${n}`, provider.subject]);
    await pool.query("INSERT INTO account_identities(subject,user_id) VALUES($1,$2)", [provider.subject, provider.userId]);
  }
  // These exact additive files are applied only in the generated disposable schema.
  await pool.query(migration);
  await pool.query(forecastMigration);
  expect((await control()).enabled).toBe(false);
  await pool.query("UPDATE ai_decider_control SET enabled=true,state=$1::jsonb", [JSON.stringify(emptyBudgetState(NOW))]);
});
afterAll(async () => {
  try {
    if (ownsSchema) {
      await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
      expect((await pool.query("SELECT nspname FROM pg_namespace WHERE nspname=$1", [schema])).rows).toHaveLength(0);
      console.info("Owned AI schema removed; no persistent test data retained");
    }
  } finally { await racePool.end(); await pool.end(); }
});

describe("actual PostgreSQL provider-session admission", () => {
  it("retains prior counters and admits all ten current verified league principals without expanding the global spend cap", async () => {
    const state = emptyBudgetState(NOW); state.requests = 123; state.tokens = AI_BUDGET.globalTokensDay - 1000;
    for (let n = 11; n <= 20; n++) state.users[identity(n).userId] = {
      day: "2026-10-19", hour: "2026-10-19T07", requests: n, hourly: n,
      denied: 2, signals: 1, lastSeen: NOW - 60000, recent: [NOW - 60000],
    };
    await updateState(state);
    for (let n = 1; n <= 10; n++) {
      const s = store(), r = await s.reserve(providerPrincipal(n), fingerprint(n), 100, NOW);
      if (r.status !== "reserved") throw new Error("Expected current verified principal admission");
      await s.finish(r.leaseId, 30, false, false, NOW);
    }
    const result = (await control()).state;
    expect(Object.keys(result.users)).toHaveLength(AI_BUDGET.retainedUserCapacity);
    for (const [id, counter] of Object.entries(state.users)) expect(result.users[id]).toEqual(counter);
    expect(result.requests).toBe(133); expect(result.tokens).toBe(AI_BUDGET.globalTokensDay);
    expect((await store().reserve(providerPrincipal(), fingerprint(100), 100, NOW)).status).toBe("rate_limited");
    expect((await control()).state.tokens).toBe(AI_BUDGET.globalTokensDay);
    const before = await control();
    await expect(store().reserve(providerPrincipal(11), fingerprint(101), 100, NOW)).rejects.toThrow("state_unavailable");
    expect(await control()).toEqual(before);
  });

  it("preserves one UUID budget across legacy and provider reservations", async () => {
    const s = store(), legacy = await s.reserve(principal(), fingerprint(1), 100, NOW);
    if (legacy.status !== "reserved") throw new Error("Expected reservation");
    await s.finish(legacy.leaseId, 100, false, false, NOW);
    expect((await s.reserve(providerPrincipal(), fingerprint(2), 100, NOW)).status).toBe("reserved");
    const state = (await control()).state;
    expect(state.requests).toBe(2); expect(state.tokens).toBe(200);
    expect(Object.keys(state.users)).toEqual([principal().userId]);
    expect(state.users[principal().userId].hourly).toBe(2);
    expect(JSON.stringify(state)).not.toMatch(/provider-session|provider-subject|synthetic-ci-token/);
  });

  it("serializes mixed-auth same-user overlap against the existing shared lease", async () => {
    const results = await Promise.all([store().reserve(principal(), fingerprint(1), 100, NOW),
      store().reserve(providerPrincipal(), fingerprint(2), 100, NOW)]);
    expect(results.map(r => r.status).sort()).toEqual(["busy", "reserved"]);
    expect((await control()).state.requests).toBe(1);
  });

  it("serializes the last global token allowance across provider and legacy instances", async () => {
    const state = emptyBudgetState(NOW); state.requests = 1000; state.tokens = AI_BUDGET.globalTokensDay - 100; await updateState(state);
    const results = await Promise.all([store().reserve(providerPrincipal(1), fingerprint(1), 100, NOW),
      store().reserve(principal(2), fingerprint(2), 100, NOW)]);
    expect(results.map(r => r.status).sort()).toEqual(["rate_limited", "reserved"]);
    expect((await control()).state.requests).toBe(1001);
    expect((await control()).state.tokens).toBe(AI_BUDGET.globalTokensDay);
  });

  it.each(["revoked", "expired", "inactive", "unverified", "wrong_session", "wrong_subject", "wrong_user", "invalid_team"])("rejects %s after initial provider verification without charging or calling the model", async change => {
    const h = realHarness(), provider = providerPrincipal();
    h.runtime.providerSession = async () => ({ user: { id: provider.userId, teamId: "1", displayName: "Synthetic", createdAt: new Date(NOW) },
      sessionId: provider.sessionId, subject: provider.subject, expiresAt: new Date(NOW + 86400000) });
    expect(await resolveAiIdentity(undefined, h.runtime)).toEqual(provider);
    if (change === "revoked") await pool.query("DELETE FROM auth_session WHERE id=$1", [provider.sessionId]);
    if (change === "expired") await pool.query("UPDATE auth_session SET expires_at=now()-interval '1 second' WHERE id=$1", [provider.sessionId]);
    if (change === "inactive") await pool.query("UPDATE account_identities SET active=false WHERE subject=$1", [provider.subject]);
    if (change === "unverified") await pool.query("UPDATE auth_user SET email_verified=false WHERE id=$1", [provider.subject]);
    if (change === "wrong_session") await pool.query("UPDATE auth_session SET id='changed-session' WHERE id=$1", [provider.sessionId]);
    if (change === "wrong_subject") await pool.query("UPDATE auth_session SET user_id=$1 WHERE id=$2", [providerPrincipal(2).subject, provider.sessionId]);
    if (change === "wrong_user") {
      await pool.query("DELETE FROM account_identities WHERE subject=$1", [providerPrincipal(2).subject]);
      await pool.query("UPDATE account_identities SET user_id=$1 WHERE subject=$2", [principal(2).userId, provider.subject]);
    }
    if (change === "invalid_team") await pool.query("UPDATE site_users SET team_id='11' WHERE id=$1", [provider.userId]);
    const before = await control();
    expect(await runAiDecision(draft, token(), h.runtime)).toMatchObject({ status: "unavailable", code: "state_unavailable" });
    expect(h.create).not.toHaveBeenCalled(); expect(await control()).toEqual(before);
  });

  it("fails closed when the provider session table is unavailable", async () => {
    await pool.query("DROP TABLE auth_session");
    const before = await control();
    await expect(store().reserve(providerPrincipal(), fingerprint(), 100, NOW)).rejects.toThrow();
    expect(await control()).toEqual(before);
  });
});

describe("actual stable weekly job admission", () => {
  const operator = (auth: "legacy" | "friends" = "legacy"): AiWeeklyJobIdentity => ({ kind: "weekly_job", userId: principal().userId, auth });
  const jobStore = (auth: "legacy" | "friends" = "legacy") => new AiDeciderStore(new PostgresAiPersistence(db, operator(auth)));
  it("keeps a configured retired weekly principal unauthorized despite its preserved counter record", async () => {
    const retired: AiWeeklyJobIdentity = { kind: "weekly_job", userId: identity(11).userId, auth: "friends" };
    const state = emptyBudgetState(NOW); state.requests = 3; state.tokens = 1000;
    state.users[retired.userId] = { day: "2026-10-19", hour: "2026-10-19T07", requests: 3, hourly: 3, denied: 0, signals: 0, lastSeen: NOW };
    await updateState(state);
    const s = new AiDeciderStore(new PostgresAiPersistence(db, retired)), before = await control();
    expect(await s.persistence.authorizeWeeklyOperator(retired)).toBe(false);
    await expect(s.reserve(retired, fingerprint(), 100, NOW, true)).rejects.toThrow("state_unavailable");
    expect(await control()).toEqual(before);
  });
  it.each(["legacy", "friends"] as const)("uses the configured stable app UUID independently of personal sessions (%s)", async auth => {
    await pool.query("DELETE FROM sessions"); await pool.query("DELETE FROM auth_session");
    const s = jobStore(auth), job = operator(auth);
    expect(await s.persistence.authorizeWeeklyOperator(job)).toBe(true);
    const lease = await s.reserve(job, fingerprint(), 100, NOW, true);
    if (lease.status !== "reserved") throw new Error("Expected reservation");
    await s.finish(lease.leaseId, 100, false, false, NOW);
    expect((await control()).state.users[job.userId].requests).toBe(1);
    expect(JSON.stringify((await control()).state)).not.toMatch(/weekly_job|provider-subject|tokenHash/);
  });
  it.each(["unconfigured", "wrong_uuid", "wrong_auth", "invalid_team", "inactive", "unverified"])("rejects %s job authority at both initial and atomic checks", async change => {
    const job = operator("friends"), s = change === "unconfigured" ? store() : jobStore("friends");
    if (change === "wrong_uuid") job.userId = principal(2).userId;
    if (change === "wrong_auth") job.auth = "legacy";
    if (change === "invalid_team") await pool.query("UPDATE site_users SET team_id='11' WHERE id=$1", [job.userId]);
    if (change === "inactive") await pool.query("UPDATE account_identities SET active=false WHERE user_id=$1", [job.userId]);
    if (change === "unverified") await pool.query("UPDATE auth_user SET email_verified=false WHERE id=$1", [providerPrincipal().subject]);
    expect(await s.persistence.authorizeWeeklyOperator(job)).toBe(false);
    await expect(s.reserve(job, fingerprint(), 100, NOW, true)).rejects.toThrow("state_unavailable");
    expect((await control()).state.requests).toBe(0);
  });
  it("rechecks membership revocation during the same atomic budget mutation", async () => {
    const job = operator("friends"), s = jobStore("friends");
    expect(await s.persistence.authorizeWeeklyOperator(job)).toBe(true);
    await pool.query("UPDATE account_identities SET active=false WHERE user_id=$1", [job.userId]);
    await expect(s.reserve(job, fingerprint(), 100, NOW, true)).rejects.toThrow("state_unavailable");
    expect((await control()).state.requests).toBe(0);
  });
});

describe("actual PostgreSQL admission and completion", () => {
  it("admits only two overlapping users and one lease per user across independent stores", async () => {
    const results = await Promise.allSettled(Array.from({ length: 10 }, (_, n) => store().reserve(principal(n + 1), fingerprint(n), 100, NOW)));
    expect(results.filter(r => r.status === "fulfilled" && r.value.status === "reserved")).toHaveLength(2);
    expect(results.filter(r => r.status === "rejected").every(r => r.status === "rejected" && r.reason.message === "state_unavailable")).toBe(true);
    const state = (await control()).state;
    expect(state.requests).toBe(2); expect(state.tokens).toBe(200); expect(state.leases).toHaveLength(2);
    expect(new Set(state.leases.map(l => l.userId)).size).toBe(2);
  });
  it("serializes same-user overlap without exceeding the per-user in-flight limit", async () => {
    const results = await Promise.all([store().reserve(principal(), fingerprint(1), 100, NOW), store().reserve(principal(), fingerprint(2), 100, NOW)]);
    expect(results.map(r => r.status).sort()).toEqual(["busy", "reserved"]);
    expect((await control()).state.requests).toBe(1);
  });
  it("serializes the last global token reservation", async () => {
    const state = emptyBudgetState(NOW); state.requests = 1000;
    state.tokens = AI_BUDGET.globalTokensDay - 100;
    await updateState(state);
    const results = await Promise.all([store().reserve(principal(1), fingerprint(1), 100, NOW), store().reserve(principal(2), fingerprint(2), 100, NOW)]);
    expect(results.map(r => r.status).sort()).toEqual(["rate_limited", "reserved"]);
    expect((await control()).state.requests).toBe(1001);
    expect((await control()).state.tokens).toBe(AI_BUDGET.globalTokensDay);
  });
  it("allows completed repeats beyond former account quotas without resetting existing counters or fingerprints", async () => {
    const state = emptyBudgetState(NOW); state.requests = 1000; state.tokens = 22997;
    state.users[principal().userId] = { day: "2026-10-19", hour: "2026-10-19T07", requests: 20, hourly: 5, denied: 100, signals: 3, lastSeen: NOW };
    const legacy = { userId: principal().userId, fingerprint: fingerprint(), expires: NOW + 600000, shared: true };
    state.duplicates.push(legacy); await updateState(state);
    for (let n = 0; n < 26; n++) {
      const time = NOW + n * 4000;
      const s = store(), reservation = await s.reserve(n % 2 ? providerPrincipal() : principal(), fingerprint(), 100, time);
      if (reservation.status !== "reserved") throw new Error("Expected reservation");
      await s.finish(reservation.leaseId, 20, false, false, time);
    }
    const result = (await control()).state;
    expect(result.tokens).toBe(25597); expect(result.requests).toBe(1026);
    expect(result.users[principal().userId]).toMatchObject({ requests: 46, hourly: 31, denied: 100, signals: 3 });
    expect(result.duplicates).toEqual([legacy]);
  });
  it("atomically shares the final rolling burst slot across legacy/provider identities and preserves it through completion", async () => {
    const state = emptyBudgetState(NOW); state.requests = 19; state.tokens = 1900;
    state.users[principal().userId] = { day: "2026-10-19", hour: "2026-10-19T07", requests: 19, hourly: 19, denied: 0, signals: 0, lastSeen: NOW, recent: Array(19).fill(NOW) };
    await updateState(state);
    const responses = await Promise.all([store().reserve(principal(), fingerprint(1), 100, NOW), store().reserve(providerPrincipal(), fingerprint(2), 100, NOW)]);
    expect(responses.map(r => r.status).sort()).toEqual(["busy", "reserved"]);
    const reservation = responses.find(r => r.status === "reserved")!;
    if (reservation.status !== "reserved") throw new Error("Expected reservation");
    await store().finish(reservation.leaseId, 20, false, false, NOW);
    expect(await store().reserve(providerPrincipal(), fingerprint(), 100, NOW + 59999)).toEqual({ status: "burst_limited", retryAfterSeconds: 1 });
    let result = (await control()).state;
    expect(result.requests).toBe(20); expect(result.tokens).toBe(2000); expect(result.users[principal().userId].recent).toHaveLength(20);
    expect((await store().reserve(principal(2), fingerprint(), 100, NOW + 59999)).status).toBe("reserved");
    expect((await store().reserve(providerPrincipal(), fingerprint(), 100, NOW + 60000)).status).toBe("reserved");
    result = (await control()).state;
    expect(result.users[principal().userId].recent).toEqual([NOW + 60000]);
    expect(result.requests).toBe(22); expect(result.tokens).toBe(2200);
  });
  it("deduplicates shared fingerprints atomically across distinct managers", async () => {
    const responses = await Promise.all([store().reserve(principal(1), fingerprint(), 100, NOW, true), store().reserve(principal(2), fingerprint(), 100, NOW, true)]);
    expect(responses.map(r => r.status).sort()).toEqual(["duplicate", "reserved"]);
    const reservation = responses.find(r => r.status === "reserved")!;
    if (reservation.status !== "reserved") throw new Error("Expected reservation");
    await store().finish(reservation.leaseId, 50, false, false, NOW);
    expect((await store().reserve(principal(2), fingerprint(), 100, NOW, true)).status).toBe("reserved");
    expect((await control()).state.requests).toBe(2);
  });
  it("retains unknown-spend leases, deduplicates completion and expires only the appropriate windows", async () => {
    const r = await store().reserve(principal(), fingerprint(), 100, NOW);
    if (r.status !== "reserved") throw new Error("Expected reservation");
    await Promise.all([store().finish(r.leaseId, null, true, true, NOW), store().finish(r.leaseId, null, true, true, NOW)]);
    const settled = await control();
    expect(settled.state.tokens).toBe(100); expect(settled.state.users[principal().userId].signals).toBe(1);
    expect(settled.state.leases[0].completed).toBe(true);
    await store().finish(r.leaseId, null, true, true, NOW); expect(await control()).toEqual(settled);
    expect((await store().reserve(principal(), fingerprint(2), 100, NOW)).status).toBe("busy");
    expect(await store().reserve(principal(), fingerprint(), 100, NOW + 1001)).toEqual({ status: "duplicate", retryAfterSeconds: 59 });
    expect((await store().reserve(principal(), fingerprint(), 100, NOW + 61000)).status).toBe("reserved");
  });
  it("charges one oversized completion and disables admission under actual CAS overlap", async () => {
    const r = await store().reserve(principal(), fingerprint(), 100, NOW);
    if (r.status !== "reserved") throw new Error("Expected reservation");
    await Promise.all([store().finish(r.leaseId, 150, true, false, NOW), store().finish(r.leaseId, 150, true, false, NOW)]);
    await store().finish(r.leaseId, 150, true, false, NOW);
    const result = await control();
    expect(result.state.tokens).toBe(150); expect(result.state.users[principal().userId].signals).toBe(1); expect(result.enabled).toBe(false);
    expect((await store().reserve(principal(2), fingerprint(2), 100, NOW)).status).toBe("disabled");
  });
  it("rejects stale SQL revisions and retries genuine competing revision mutations", async () => {
    const p = persistence(), initial = await control();
    expect(await p.compareControl(initial.revision, initial.state)).toBe(true);
    expect(await p.compareControl(initial.revision, initial.state)).toBe(false);
    let interference = 2;
    class ContendedPersistence extends PostgresAiPersistence {
      override async compareControl(...args: Parameters<PostgresAiPersistence["compareControl"]>) {
        if (interference-- > 0) await pool.query("UPDATE ai_decider_control SET revision=revision+1");
        return super.compareControl(...args);
      }
    }
    const s = new AiDeciderStore(new ContendedPersistence(db));
    expect((await s.reserve(principal(), fingerprint(), 100, NOW)).status).toBe("reserved");
    interference = 8;
    const before = (await control()).state;
    await expect(s.reserve(principal(2), fingerprint(2), 100, NOW)).rejects.toThrow("state_unavailable");
    expect((await control()).state).toEqual(before);
  });
  it.each(["expired", "revoked"])("rejects %s sessions in the atomic admission mutation", async kind => {
    if (kind === "expired") await pool.query("UPDATE sessions SET expires_at=now()-interval '1 second' WHERE token_hash=$1", [principal().tokenHash]);
    else await pool.query("DELETE FROM sessions WHERE token_hash=$1", [principal().tokenHash]);
    await expect(store().reserve(principal(), fingerprint(), 100, NOW)).rejects.toThrow("state_unavailable");
    expect((await control()).state.requests).toBe(0);
  });
  it("retries completion conflicts and fails closed on exhausted real SQL revisions", async () => {
    let interference = 0;
    class ContendedCompletion extends PostgresAiPersistence {
      override async compareControl(...args: Parameters<PostgresAiPersistence["compareControl"]>) {
        if (interference-- > 0) await pool.query("UPDATE ai_decider_control SET revision=revision+1");
        return super.compareControl(...args);
      }
    }
    const s = new AiDeciderStore(new ContendedCompletion(db));
    const first = await s.reserve(principal(), fingerprint(), 100, NOW);
    if (first.status !== "reserved") throw new Error("Expected reservation");
    interference = 2;
    await s.finish(first.leaseId, 50, true, false, NOW);
    expect((await control()).state.users[principal().userId].signals).toBe(1);
    const second = await s.reserve(principal(), fingerprint(2), 100, NOW);
    if (second.status !== "reserved") throw new Error("Expected reservation");
    const before = (await control()).state;
    interference = 8;
    await expect(s.finish(second.leaseId, 150, true, false, NOW)).rejects.toThrow("state_unavailable");
    expect((await control()).state).toEqual(before);
    expect((await s.reserve(principal(), fingerprint(3), 100, NOW)).status).toBe("busy");
  });
  it("revalidates revocation between the actual session lookup and paid admission", async () => {
    const h = realHarness(), lookup = h.runtime.sessions!.getSessionUser;
    expect(await resolveAiIdentity(token(), h.runtime)).toEqual(principal());
    h.runtime.sessions = { getSessionUser: async hash => {
      const found = await lookup(hash);
      await pool.query("DELETE FROM sessions WHERE token_hash=$1", [hash]);
      return found;
    } };
    expect(await runAiDecision(draft, token(), h.runtime)).toMatchObject({ status: "unavailable", code: "state_unavailable" });
    expect(h.create).not.toHaveBeenCalled(); expect((await control()).state.requests).toBe(0);
  });
  it.each(["missing", "corrupt", "disabled"])("fails closed on %s durable state without a provider call", async kind => {
    if (kind === "missing") await pool.query("DELETE FROM ai_decider_control");
    if (kind === "corrupt") await pool.query("UPDATE ai_decider_control SET state='{}'");
    if (kind === "disabled") await pool.query("UPDATE ai_decider_control SET enabled=false");
    const h = realHarness();
    expect((await runAiDecision(draft, token(), h.runtime)).status).toBe("unavailable"); expect(h.create).not.toHaveBeenCalled();
  });
  it("withholds results when a real lock timeout prevents durable completion", async () => {
    const h = realHarness(), held = await pool.connect();
    h.create.mockImplementationOnce(async payload => {
      await held.query("BEGIN"); await held.query("SELECT * FROM ai_decider_control FOR UPDATE");
      return providerAnswer(payload);
    });
    try {
      expect(await runAiDecision(draft, token(), h.runtime)).toMatchObject({ status: "unavailable", code: "state_unavailable" });
    } finally { await held.query("ROLLBACK"); held.release(); }
    expect(h.create).toHaveBeenCalledTimes(1); expect((await control()).state.requests).toBe(1);
    expect((await control()).state.leases).toHaveLength(1);
  });
  it.each(["probability", "extra_field"])("accounts oversized usage despite malformed %s output", async kind => {
    const h = realHarness();
    h.create.mockImplementationOnce(async payload => {
      const answer = providerAnswer(payload, 40000);
      if (kind === "probability") answer.answers[0].probabilities.pop();
      else Object.assign(answer.answers[0], { explanation: "invalid" });
      return answer;
    });
    expect(await runAiDecision(draft, token(), h.runtime)).toMatchObject({ code: "usage_overrun" });
    expect((await control()).state.tokens).toBe(40000); expect((await control()).enabled).toBe(false);
  });
  it.each(["missing", "invalid", "timeout"])("persists full reservations and settled leases for %s usage", async kind => {
    const h = realHarness(); h.runtime.timeoutMs = 10;
    h.create.mockImplementationOnce(async payload => kind === "timeout" ? new Promise(() => {}) : ({ ...providerAnswer(payload), usage: kind === "missing" ? undefined : { input_tokens: -1 } }));
    expect((await runAiDecision(draft, token(), h.runtime)).status).toBe(kind === "timeout" ? "timeout" : "unavailable");
    const state = (await control()).state;
    expect(state.tokens).toBe(state.leases[0].reserved); expect(state.leases[0].completed).toBe(true);
    expect(state.users[principal().userId].signals).toBe(1);
  });
});

describe("actual immutable weekly tables and lifecycle", () => {
  it("serializes competing snapshot/result/outcome first writes and executes immutable triggers", async () => {
    const p = persistence(), a = candidate(), b = candidate(); b.input.teams[0].players[0].priorFantasyPpg = 99;
    b.hash = weekHash(b.input); b.slate = prepareWeeklySlate(b.input, NOW);
    const sealed = await Promise.all([p.sealWeek(a), persistence().sealWeek(b)]);
    expect(sealed[0]).toEqual(sealed[1]);
    const frozen = sealed[0];
    for (const sql of ["UPDATE ai_decider_weeks SET input='{}'", "UPDATE ai_decider_weeks SET generation_manifest='{}'", "UPDATE ai_decider_weeks SET input_hash=repeat('0',64)", "UPDATE ai_decider_weeks SET prepared_slate='{}'", "DELETE FROM ai_decider_weeks"]) {
      await expect(pool.query(sql)).rejects.toThrow("AI week is immutable");
    }
    const final = completed(frozen);
    const writes = await Promise.all([p.completeWeek(frozen.key, frozen.hash, final), persistence().completeWeek(frozen.key, frozen.hash, final)]);
    expect(writes.filter(Boolean)).toHaveLength(1);
    await expect(pool.query("UPDATE ai_decider_weeks SET result='{}'")).rejects.toThrow("AI week is immutable");
    expect(cachedWeek((await p.getWeek(frozen.key))!, NOW).status).toBe("ready");
    const outcome = { matchupId: "1", recordedAt: "2026-10-27T01:00:00Z", final: true as const, teamPoints: [{ teamId: "6", points: 123 }, { teamId: "10", points: 122 }] };
    const results = await Promise.all([recordWeeklyOutcome(p, frozen.key, outcome, Date.parse(outcome.recordedAt)), recordWeeklyOutcome(persistence(), frozen.key, outcome, Date.parse(outcome.recordedAt))]);
    expect(results.filter(Boolean)).toHaveLength(1);
    await expect(pool.query("UPDATE ai_decider_outcomes SET outcome='{}'")).rejects.toThrow("AI outcome is append-only");
    await expect(pool.query("DELETE FROM ai_decider_outcomes")).rejects.toThrow("AI outcome is append-only");
    expect((await p.getWeek(frozen.key))!.input).toEqual(frozen.input);
    expect(weeklyDecision(frozen.input, frozen.slate, "f".repeat(64)).payload.input).not.toContain("teamPoints");
  });
  it.each(["preseason", "unknown", "empty"])("does not consume the week for %s input, then generates once when ready", async kind => {
    const h = realHarness(), input = weeklyInput(), unsupported = structuredClone(input);
    if (kind === "preseason") unsupported.phase = "pre";
    if (kind === "unknown") unsupported.scoringMode = "unknown";
    if (kind === "empty") unsupported.teams.forEach(t => { t.players[0].priorFantasyPpg = null; });
    expect(await generateWeeklyPicks(unsupported, token(), h.runtime)).toMatchObject({ code: "weekly_not_ready" });
    expect(await persistence().getWeek(weekKey(input))).toBeNull(); expect(h.create).not.toHaveBeenCalled();
    expect((await generateWeeklyPicks(input, token(), h.runtime)).status).toBe("ready");
    expect((await generateWeeklyPicks(input, token(), h.runtime)).status).toBe("ready");
    expect(h.create).toHaveBeenCalledTimes(1);
  });
  it("persists a partial slate immutably without inventing missing production", async () => {
    const h = realHarness(), input = weeklyInput(); input.teams[1].starters[0] = "0";
    const result = await generateWeeklyPicks(input, token(), h.runtime);
    if (!("matchups" in result)) throw new Error("Expected slate");
    expect(result.matchups.filter(m => m.status === "ready")).toHaveLength(4);
    expect(await generateWeeklyPicks(weeklyInput(), token(), h.runtime)).toMatchObject({ code: "snapshot_conflict" });
    expect(h.create).toHaveBeenCalledTimes(1);
  });
  it("rejects malformed stored results on a real cache read without generating or repairing", async () => {
    const p = persistence(), sealed = await p.sealWeek(candidate()), corrupt = completed(sealed);
    corrupt.matchups[0].result!.probabilities[0].probability = -1;
    await p.completeWeek(sealed.key, sealed.hash, corrupt);
    const h = realHarness(), input = weeklyInput();
    const read = await loadAiDecidesData(h.runtime, async () => ({ leagueId: input.leagueId, season: input.season, week: input.week, matchups: input.matchups, phase: input.phase }));
    expect(read.weekly.status).toBe("unavailable"); expect(h.create).not.toHaveBeenCalled();
    expect((await p.getWeek(sealed.key))!.result).toEqual(corrupt);
  });
  it("retains old model/prompt manifests and idempotent final outcomes after current policy changes", async () => {
    const p = persistence(), record = candidate(), final = completed(record);
    record.manifest = { ...record.manifest, model: "prior-beta-model", promptVersion: "prior-prompt-v1", instructions: "Prior frozen instructions." };
    record.hash = weekHash(record.input, record.manifest); record.slate = prepareWeeklySlate(record.input, NOW, record.manifest);
    final.snapshot = record.slate.snapshot;
    final.matchups.forEach(m => { m.result!.model = record.manifest.model; m.result!.promptVersion = record.manifest.promptVersion; m.result!.snapshot = record.slate.snapshot; });
    await p.sealWeek(record); await p.completeWeek(record.key, record.hash, final);
    const before = await p.getWeek(record.key);
    vi.resetModules();
    vi.doMock("@/domain/ai-decider", async original => ({ ...await original<typeof import("@/domain/ai-decider")>(), AI_DECISION_MODEL: "hypothetical-future-policy", AI_WEEKLY_PROMPT_VERSION: "future-test-policy" }));
    try {
      const future = await import("../weekly");
      expect(future.currentGenerationManifest(record.manifest)).toBe(false);
      expect(future.cachedWeek(before!, NOW)).toEqual(final);
      const outcome = { matchupId: "1", recordedAt: "2026-10-27T01:00:00Z", final: true as const, teamPoints: [{ teamId: "6", points: 123 }, { teamId: "10", points: 122 }] };
      expect(await future.recordWeeklyOutcome(p, record.key, outcome, Date.parse(outcome.recordedAt))).toBe(true);
      expect(await future.recordWeeklyOutcome(p, record.key, outcome, Date.parse(outcome.recordedAt))).toBe(false);
      expect(await p.getWeek(record.key)).toEqual(before);
    } finally { vi.doUnmock("@/domain/ai-decider"); vi.resetModules(); }
  });
});


describe("actual PostgreSQL one-time refresh preservation and admission", () => {
  it("runs one mocked five-pair batch through real claim, paid CAS and complete publication", async () => {
    const fixture = await refreshFixture(), h = realHarness(); h.setTime(NOW + 1000);
    h.runtime.store = new AiDeciderStore(fixture.enabled()); h.runtime.week1Refresh = { originalHash: fixture.original.hash };
    h.runtime.getSourceState = async () => ({ season: "2026", phase: "pre", leg: 0 });
    const sources = { context: async () => ({ leagueId: "1387473752807190528", season: "2026", phase: "pre" as const, leg: 0, week: 1, seasonStartDate: "2026-10-20", statsSeason: "2025", gameModeCode: 1 }), input: async () => fixture.replacement.input };
    const results = await Promise.all([refreshWeek1(principal(), h.runtime, sources), refreshWeek1(principal(2), h.runtime, sources)]);
    // A later overlapping reader may get the same completed result for free.
    expect(results.some(r => r.status === "ready")).toBe(true); expect(h.create).toHaveBeenCalledTimes(1);
    const saved = results.filter(r => r.status === "ready");
    if (saved.length === 2) expect(saved[1]).toEqual(saved[0]);
    expect((await control()).state.requests).toBe(1);
    expect((await fixture.enabled().getWeek(WEEK1_REFRESH_KEY))?.hash).toBe(fixture.replacement.hash);
    expect(await persistence().getWeek(WEEK1_REFRESH_KEY)).toEqual(fixture.original);
    await refreshWeek1(principal(3), h.runtime, sources); expect(h.create).toHaveBeenCalledTimes(1);
    const reads = vi.spyOn(db, "execute");
    let data: Awaited<ReturnType<typeof loadAiDecidesData>>, count: number;
    try {
      data = await loadAiDecidesData(h.runtime, async () => ({ ...await sources.context(), matchups: fixture.replacement.input.matchups }));
      count = reads.mock.calls.length;
    } finally { reads.mockRestore(); }
    expect(data.week1Refresh?.status).toBe("published"); expect(data.weekly.snapshot?.hash).toBe(fixture.replacement.hash);
    // One small control read and one selected full snapshot, no duplicate archive.
    expect(count).toBe(2); expect(h.create).toHaveBeenCalledTimes(1);
  });
  it("allows exactly one claim across independent stores and different capture hashes", async () => {
    const h = await refreshFixture(), before = await control();
    const claims = await Promise.all(Array.from({ length: 5 }, (_, n) => h.enabled().claimWeekRefresh(h.replacement, providerPrincipal(n + 1))));
    expect(claims.filter(Boolean)).toHaveLength(1);
    expect(await h.enabled().getWeek(WEEK1_REFRESH_KEY)).toEqual(h.original);
    expect(await persistence().getOriginalWeek(WEEK1_REFRESH_KEY)).toEqual(h.original);
    expect(await control()).toEqual(before); // Claim neither resets nor spends.
    const changed = structuredClone(h.replacement), capturedAt = new Date(NOW + 2000).toISOString();
    Object.assign(changed.input, { capturedAt, cutoffAt: capturedAt, statsAvailableAt: capturedAt });
    changed.hash = weekHash(changed.input); changed.slate = prepareWeeklySlate(changed.input, NOW + 2000);
    expect(await h.enabled().claimWeekRefresh(changed, providerPrincipal())).toBe(false);
    expect((await pool.query("SELECT count(*)::int AS n FROM ai_decider_weeks")).rows[0].n).toBe(2);
  });
  it("publishes a complete valid batch atomically once and rollback reads the byte-identical original", async () => {
    const h = await refreshFixture(); expect(await h.enabled().claimWeekRefresh(h.replacement, providerPrincipal())).toBe(true);
    const results = await Promise.all([h.enabled().completeWeekRefresh(h.replacement.hash, h.result, providerPrincipal()), h.enabled().completeWeekRefresh(h.replacement.hash, h.result, providerPrincipal())]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await h.enabled().getWeek(WEEK1_REFRESH_KEY))?.hash).toBe(h.replacement.hash);
    expect(cachedWeek((await h.enabled().getWeek(WEEK1_REFRESH_KEY))!, NOW + 1000).status).toBe("ready");
    expect(await persistence().getWeek(WEEK1_REFRESH_KEY)).toEqual(h.original);
    expect(await h.enabled().getWeekRefresh()).toMatchObject({ hash: h.replacement.hash, result: h.result });
    await expect(pool.query("DELETE FROM ai_decider_weeks WHERE week_key=$1", [refreshStorageKey(WEEK1_REFRESH_KEY)])).rejects.toThrow("immutable");
    await expect(pool.query("UPDATE ai_decider_weeks SET input='{}'::jsonb WHERE week_key=$1", [refreshStorageKey(WEEK1_REFRESH_KEY)])).rejects.toThrow("immutable");
    await expect(pool.query("UPDATE ai_decider_weeks SET result='{}'::jsonb WHERE week_key=$1", [WEEK1_REFRESH_KEY])).rejects.toThrow("immutable");
  });
  it.each(["expired", "subject", "uuid", "inactive", "unverified", "team", "control", "outcome"])("rejects %s at atomic claim without modifying archive or spend", async change => {
    const h = await refreshFixture(), auth = providerPrincipal(), before = (await control()).state;
    if (change === "expired") await pool.query("UPDATE auth_session SET expires_at='2000-01-01' WHERE id=$1", [auth.sessionId]);
    if (change === "subject") auth.subject = providerPrincipal(2).subject;
    if (change === "uuid") auth.userId = providerPrincipal(2).userId;
    if (change === "inactive") await pool.query("UPDATE account_identities SET active=false WHERE user_id=$1", [auth.userId]);
    if (change === "unverified") await pool.query("UPDATE auth_user SET email_verified=false WHERE id=$1", [auth.subject]);
    if (change === "team") await pool.query("UPDATE site_users SET team_id='11' WHERE id=$1", [auth.userId]);
    if (change === "control") await pool.query("UPDATE ai_decider_control SET enabled=false");
    if (change === "outcome") await pool.query("INSERT INTO ai_decider_outcomes(week_key,matchup_id,outcome)VALUES($1,'1','{}'::jsonb)", [WEEK1_REFRESH_KEY]);
    expect(await h.enabled().claimWeekRefresh(h.replacement, auth)).toBe(false);
    expect(await h.enabled().getWeekRefresh()).toBeNull(); expect(await persistence().getOriginalWeek(WEEK1_REFRESH_KEY)).toEqual(h.original);
    expect((await control()).state).toEqual(before);
  });
  it("fails closed on revoked completion and invalid partial/probability results, retaining old public picks", async () => {
    const h = await refreshFixture(), p = h.enabled(), auth = providerPrincipal();
    expect(await p.claimWeekRefresh(h.replacement, auth)).toBe(true);
    const partial = { ...structuredClone(h.result), status: "unavailable" as const };
    expect(await p.completeWeekRefresh(h.replacement.hash, partial, auth)).toBe(false);
    const malformed = structuredClone(h.result); malformed.matchups[0].result!.probabilities[0].probability = 2;
    await expect(p.completeWeekRefresh(h.replacement.hash, malformed, auth)).rejects.toThrow("weekly_cache");
    await pool.query("UPDATE account_identities SET active=false WHERE user_id=$1", [auth.userId]);
    expect(await p.completeWeekRefresh(h.replacement.hash, h.result, auth)).toBe(false);
    expect(await p.getWeek(WEEK1_REFRESH_KEY)).toEqual(h.original); expect((await p.getWeekRefresh())?.result).toBeNull();
    expect(await p.claimWeekRefresh(h.replacement, providerPrincipal(2))).toBe(false);
  });
  it("keeps refresh disabled by default and refuses scheduler identities", async () => {
    const h = await refreshFixture();
    expect(await persistence().claimWeekRefresh(h.replacement, providerPrincipal())).toBe(false);
    await expect(h.enabled().claimWeekRefresh(h.replacement, { kind: "weekly_job", userId: principal().userId, auth: "friends" })).rejects.toThrow("refresh_identity");
    expect(await persistence().getWeek(WEEK1_REFRESH_KEY)).toEqual(h.original);
  });
});

describe("actual PostgreSQL forecast series", () => {
  const KEY = "1387473752807190528:2026:2";
  const rev = (revisionId: string, evidenceHash: string, marker: number, supersedes: string | null = null) => ({ revisionId, evidenceHash, marker, supersedes }) as unknown as AiForecastRevision;
  it("appends append-only revisions, dedupes by evidence hash across the series, and reads back by hash", async () => {
    const p = persistence();
    const a = rev("a".repeat(64), "1".repeat(64), 1), b = rev("b".repeat(64), "2".repeat(64), 2, a.revisionId);
    expect(await p.appendForecast(KEY, a)).toBe(true);
    expect(await p.appendForecast(KEY, b)).toBe(true);
    // The same evidence hash under a different revision id no-ops across
    // the whole series (the A → B → A recurrence), as does a repeat append.
    expect(await p.appendForecast(KEY, rev("c".repeat(64), "1".repeat(64), 3))).toBe(false);
    expect(await p.appendForecast(KEY, a)).toBe(false);
    // The chain cannot fork at the storage layer either: a second genesis
    // and a second child of A are both refused by the unique chain indexes.
    expect(await p.appendForecast(KEY, rev("d".repeat(64), "4".repeat(64), 4))).toBe(false);
    expect(await p.appendForecast(KEY, rev("e".repeat(64), "5".repeat(64), 5, a.revisionId))).toBe(false);
    expect((await p.getForecasts(KEY)).map(r => r.revisionId)).toEqual([a.revisionId, b.revisionId]);
    expect(await p.getLatestForecast(KEY)).toEqual(b);
    expect(await p.getForecastByEvidenceHash(KEY, a.evidenceHash)).toEqual(a);
    expect(await p.getForecastByEvidenceHash(KEY, "9".repeat(64))).toBeNull();
    await expect(pool.query("UPDATE ai_decider_forecasts SET revision='{}'::jsonb")).rejects.toThrow("append-only");
    await expect(pool.query("DELETE FROM ai_decider_forecasts")).rejects.toThrow("append-only");
  });
  it("public selection follows the current pointer: A → B → A presents A, then a genuinely new C presents C", async () => {
    const p = persistence();
    const h = realHarness();
    const at = (s: number) => new Date(NOW + s * 1000).toISOString();
    // Valid revision bodies (the public read validates on read-back).
    const validInput = (counted: number, gamesRemaining: number) => {
      const teams: AiForecastTeamInput[] = Array.from({ length: 10 }, (_, n) => ({
        rosterId: String(n + 1), officialPoints: 0,
        starters: [0, 1, 2].map(i => ({
          playerId: String(3000 + n * 10 + i), countedPoints: 0, playedGames: [], rejectedAppearance: false,
          liveGameInProgress: false, gamesRemaining: 2, projectionPpg: 20, projectionBasis: "current" as const,
        })),
      }));
      teams[0].starters[0] = { ...teams[0].starters[0], countedPoints: counted, playedGames: [{ gameId: "9001", points: counted }], gamesRemaining };
      teams[0].officialPoints = counted;
      return {
        leagueId: "1387473752807190528", season: "2026", week: 2, capturedAt: at(0), scoring: { pts: 0.5 },
        matchups: [["1", "2"], ["3", "4"], ["5", "6"], ["7", "8"], ["9", "10"]].map((pair, i) => ({ matchupId: String(i + 1), teamIds: pair as [string, string] })),
        teams, freshness: [{ source: "sleeper-matchups", observedAt: at(0) }],
      };
    };
    const revisionFor = (input: ReturnType<typeof validInput>, generatedAt: string, supersedes: string | null) => buildForecastRevision(
      input, input.teams.map(t => computeForecastTeamLine(t, input.capturedAt)), input.matchups.map(() => null), generatedAt, supersedes);
    const a = revisionFor(validInput(25, 2), at(1), null);
    const b = revisionFor(validInput(41, 0), at(2), a.revisionId);
    const c = revisionFor(validInput(33, 1), at(4), b.revisionId);
    expect(new Set([a.evidenceHash, b.evidenceHash, c.evidenceHash]).size).toBe(3);
    expect(await p.publishForecast(KEY, a, at(1))).toBe(true);
    let state = await loadAiForecastState(h.runtime, KEY);
    expect(state.revision!.revisionId).toBe(a.revisionId);
    expect(await p.publishForecast(KEY, b, at(2))).toBe(true);
    state = await loadAiForecastState(h.runtime, KEY);
    expect(state.revision!.revisionId).toBe(b.revisionId);
    // Evidence recurs to A: the refresh outcome re-observes A (the dedupe
    // hit appends nothing). Insertion order still ends at B — the public
    // read must present A anyway, by revision id AND evidence hash.
    expect(await p.markForecastCurrent(KEY, a.revisionId, a.evidenceHash, at(3))).toBe("moved");
    expect((await p.getLatestForecast(KEY))!.revisionId).toBe(b.revisionId);
    state = await loadAiForecastState(h.runtime, KEY);
    expect(state.status).toBe("ready");
    expect(state.revision!.revisionId).toBe(a.revisionId);
    expect(state.revision!.evidenceHash).toBe(a.evidenceHash);
    expect(state.revisionCount).toBe(2);
    // A subsequent genuinely-new C appends on the chain head (B) and the
    // public read presents C.
    expect(await p.publishForecast(KEY, c, at(4))).toBe(true);
    state = await loadAiForecastState(h.runtime, KEY);
    expect(state.revision!.revisionId).toBe(c.revisionId);
    expect(state.revision!.evidenceHash).toBe(c.evidenceHash);
    expect(state.revisionCount).toBe(3);
    expect((await p.getForecastCurrent(KEY))!.revisionId).toBe(c.revisionId);
    expect((await p.getForecasts(KEY)).map(r => r.supersedes)).toEqual([null, a.revisionId, b.revisionId]);
  });
  it("monotonic pointer: strictly-older moves are refused at the SQL layer on both paths; a fresh re-observation still moves the pointer back", async () => {
    const p = persistence();
    const at = (s: number) => new Date(NOW + s * 1000).toISOString();
    const a = rev("a".repeat(64), "1".repeat(64), 1), b = rev("b".repeat(64), "2".repeat(64), 2, a.revisionId);
    expect(await p.publishForecast(KEY, a, at(10))).toBe(true);
    expect(await p.publishForecast(KEY, b, at(20))).toBe(true);
    // Delayed dedupe re-observation of A carrying an older observation
    // time: refused as stale, pointer and timestamp unmoved.
    expect(await p.markForecastCurrent(KEY, a.revisionId, a.evidenceHash, at(15))).toBe("stale");
    expect((await p.getForecastCurrent(KEY))!.revisionId).toBe(b.revisionId);
    expect((await p.getForecastCurrent(KEY))!.observedAt).toBe(at(20));
    // Delayed publication of new evidence on the chain head, also
    // carrying an older observation time: refused outright — no append.
    const d = rev("d".repeat(64), "4".repeat(64), 4, b.revisionId);
    expect(await p.publishForecast(KEY, d, at(18))).toBe(false);
    expect((await p.getForecasts(KEY)).map(r => r.revisionId)).toEqual([a.revisionId, b.revisionId]);
    expect((await p.getForecastCurrent(KEY))!.revisionId).toBe(b.revisionId);
    // Marking an unknown revision reports missing; marking the current
    // revision with an older time reports current and writes nothing.
    expect(await p.markForecastCurrent(KEY, "f".repeat(64), "9".repeat(64), at(30))).toBe("missing");
    expect(await p.markForecastCurrent(KEY, b.revisionId, b.evidenceHash, at(19))).toBe("current");
    expect((await p.getForecastCurrent(KEY))!.observedAt).toBe(at(20));
    // A FRESH re-observation of A (newer observed_at) legitimately
    // moves the pointer back — revision age is not observation age.
    expect(await p.markForecastCurrent(KEY, a.revisionId, a.evidenceHash, at(30))).toBe("moved");
    expect((await p.getForecastCurrent(KEY))!.revisionId).toBe(a.revisionId);
    // The joined consistent read agrees, with the series count.
    const joined = await p.getForecastCurrentRevision(KEY);
    expect(joined!.pointer.revisionId).toBe(a.revisionId);
    expect(joined!.revision!.revisionId).toBe(a.revisionId);
    expect(joined!.revisionCount).toBe(2);
  });
  it("consistent read contract: no pointer yet reads as null, and the joined read returns the named revision from one snapshot", async () => {
    const p = persistence();
    expect(await p.getForecastCurrentRevision(KEY)).toBeNull();
    const at = new Date(NOW).toISOString();
    const a = rev("a".repeat(64), "1".repeat(64), 1);
    expect(await p.publishForecast(KEY, a, at)).toBe(true);
    const joined = await p.getForecastCurrentRevision(KEY);
    expect(joined!.pointer).toMatchObject({ weekKey: KEY, revisionId: a.revisionId, evidenceHash: a.evidenceHash });
    expect(joined!.revision).toEqual(a);
    expect(joined!.revisionCount).toBe(1);
  });
  it("concurrent different-evidence publications serialize into one linear chain with the pointer on the head", async () => {
    const p1 = persistence(), p2 = persistence();
    const at = new Date(NOW).toISOString();
    const x = rev("a".repeat(64), "1".repeat(64), 1), y = rev("b".repeat(64), "2".repeat(64), 2);
    // Both writers captured the same empty predecessor; exactly one CAS lands.
    const [rx, ry] = await Promise.all([p1.publishForecast(KEY, x, at), p2.publishForecast(KEY, y, at)]);
    expect([rx, ry].filter(Boolean)).toHaveLength(1);
    const winner = rx ? x : y, loser = rx ? y : x, loserStore = rx ? p2 : p1;
    // The loser's append was not lost and did not fork: rebuilt on the
    // winner (the new chain head) it lands as the chain's second link.
    expect(await loserStore.publishForecast(KEY, { ...loser, supersedes: winner.revisionId }, at)).toBe(true);
    const series = await p1.getForecasts(KEY);
    expect(series.map(r => r.revisionId)).toEqual([winner.revisionId, loser.revisionId]);
    expect(series.map(r => r.supersedes)).toEqual([null, winner.revisionId]);
    expect((await p1.getForecastCurrent(KEY))!.revisionId).toBe(loser.revisionId);
    // A raw insert that would fork the chain (a second child of the
    // winner) is refused by the unique chain index itself.
    await expect(pool.query("INSERT INTO ai_decider_forecasts (week_key, revision_id, evidence_hash, revision) VALUES ($1, $2, $3, $4::jsonb)",
      [KEY, "c".repeat(64), "3".repeat(64), JSON.stringify(rev("c".repeat(64), "3".repeat(64), 3, winner.revisionId))])).rejects.toThrow();
    expect((await p1.getForecasts(KEY)).length).toBe(2);
  });
});

describe("actual PostgreSQL forecast pointer under held row locks", () => {
  // The sequential tests above cannot express a statement that starts
  // while another writer's pointer move is uncommitted: that needs two
  // real connections and a row lock HELD across the victim statement's
  // start, with the overlap proven from the lock catalog
  // (waitForBlocked) rather than from timing. The holder below performs
  // the winning write as a raw UPDATE inside an open transaction — the
  // exact lock/snapshot conditions a slow in-flight store statement
  // presents — and commits only once the victim is observed blocked.
  const KEY = "1387473752807190528:2026:2";
  const at = (s: number) => new Date(NOW + s * 1000).toISOString();
  const rev = (revisionId: string, evidenceHash: string, marker: number, supersedes: string | null = null) => ({ revisionId, evidenceHash, marker, supersedes }) as unknown as AiForecastRevision;
  // Valid revision bodies (the public read validates on read-back),
  // mirroring the A → B → A series test above.
  const validInput = (counted: number, gamesRemaining: number) => {
    const teams: AiForecastTeamInput[] = Array.from({ length: 10 }, (_, n) => ({
      rosterId: String(n + 1), officialPoints: 0,
      starters: [0, 1, 2].map(i => ({
        playerId: String(3000 + n * 10 + i), countedPoints: 0, playedGames: [], rejectedAppearance: false,
        liveGameInProgress: false, gamesRemaining: 2, projectionPpg: 20, projectionBasis: "current" as const,
      })),
    }));
    teams[0].starters[0] = { ...teams[0].starters[0], countedPoints: counted, playedGames: [{ gameId: "9001", points: counted }], gamesRemaining };
    teams[0].officialPoints = counted;
    return {
      leagueId: "1387473752807190528", season: "2026", week: 2, capturedAt: at(0), scoring: { pts: 0.5 },
      matchups: [["1", "2"], ["3", "4"], ["5", "6"], ["7", "8"], ["9", "10"]].map((pair, i) => ({ matchupId: String(i + 1), teamIds: pair as [string, string] })),
      teams, freshness: [{ source: "sleeper-matchups", observedAt: at(0) }],
    };
  };
  const revisionFor = (input: ReturnType<typeof validInput>, generatedAt: string, supersedes: string | null) => buildForecastRevision(
    input, input.teams.map(t => computeForecastTeamLine(t, input.capturedAt)), input.matchups.map(() => null), generatedAt, supersedes);

  it("publish vs fresher dedupe: blocked on the held pointer lock, the older-evidence publication is refused at the locked row — no append, no regression", async () => {
    const p = persistence();
    const h = realHarness();
    const a = revisionFor(validInput(25, 2), at(10), null);
    const b = revisionFor(validInput(41, 0), at(20), a.revisionId);
    const c = revisionFor(validInput(33, 1), at(30), b.revisionId);
    expect(new Set([a.evidenceHash, b.evidenceHash, c.evidenceHash]).size).toBe(3);
    expect(await p.publishForecast(KEY, a, at(10))).toBe(true);
    expect(await p.publishForecast(KEY, b, at(20))).toBe(true);
    // Chain A→B, pointer B@20. A dedupe re-observation of A@40 lands on
    // its own connection and HOLDS the pointer row lock uncommitted.
    const holder = await racePool.connect();
    const victim = await racePool.connect();
    try {
      await holder.query("BEGIN");
      const upd = await holder.query("UPDATE ai_decider_forecast_current SET revision_id=$1, evidence_hash=$2, observed_at=$3 WHERE week_key=$4",
        [a.revisionId, a.evidenceHash, at(40), KEY]);
      expect(upd.rowCount).toBe(1);
      const holderPid = await pidOf(holder), victimPid = await pidOf(victim);
      // The publisher of C@30 starts now: its snapshot still shows the
      // committed B@20 (every round-3 gate would pass), so only the
      // locked-row enforcement can refuse it.
      let settled = false;
      const attempt = racePersistence(victim).publishForecast(KEY, c, at(30))
        .then(v => { settled = true; return v; }, (e: unknown) => { settled = true; throw e; });
      await waitForBlocked(victimPid, holderPid, () => settled);
      await holder.query("COMMIT");
      // Refused at the pointer: the publication did not take.
      await expect(attempt).resolves.toBe(false);
      // No append landed, and public selection is the fresher A@40.
      expect((await p.getForecasts(KEY)).map(r => r.revisionId)).toEqual([a.revisionId, b.revisionId]);
      expect(await p.getForecastCurrent(KEY)).toEqual({ weekKey: KEY, revisionId: a.revisionId, evidenceHash: a.evidenceHash, observedAt: at(40) });
      const state = await loadAiForecastState(h.runtime, KEY);
      expect(state.status).toBe("ready");
      expect(state.revision!.revisionId).toBe(a.revisionId);
      expect(state.revision!.evidenceHash).toBe(a.evidenceHash);
    } finally {
      try { await holder.query("ROLLBACK"); } catch { /* already committed */ }
      holder.release(); victim.release();
    }
  });

  it("publish vs fresher dedupe, other commit order: the publication commits first, the fresher dedupe then moves the pointer — same final selection", async () => {
    const p = persistence();
    const a = revisionFor(validInput(25, 2), at(10), null);
    const b = revisionFor(validInput(41, 0), at(20), a.revisionId);
    const c = revisionFor(validInput(33, 1), at(30), b.revisionId);
    expect(await p.publishForecast(KEY, a, at(10))).toBe(true);
    expect(await p.publishForecast(KEY, b, at(20))).toBe(true);
    // No lock held: C@30 is the freshest observation when it commits,
    // so its append legitimately lands and it becomes current.
    expect(await p.publishForecast(KEY, c, at(30))).toBe(true);
    expect((await p.getForecastCurrent(KEY))!.revisionId).toBe(c.revisionId);
    // The fresher dedupe re-observation of A@40 then moves the pointer,
    // exactly as in the held-lock order: final selection is A either
    // way; C stands as history because it WAS current at its commit.
    expect(await p.markForecastCurrent(KEY, a.revisionId, a.evidenceHash, at(40))).toBe("moved");
    expect(await p.getForecastCurrent(KEY)).toEqual({ weekKey: KEY, revisionId: a.revisionId, evidenceHash: a.evidenceHash, observedAt: at(40) });
    expect((await p.getForecasts(KEY)).map(r => r.revisionId)).toEqual([a.revisionId, b.revisionId, c.revisionId]);
    const joined = await p.getForecastCurrentRevision(KEY);
    expect(joined!.revision!.revisionId).toBe(a.revisionId);
  });

  it("refused mark vs concurrent different selection: an A@20 mark blocked by a held B@30 move classifies stale from the post-wait row, never current", async () => {
    const p = persistence();
    const h = realHarness();
    const a = revisionFor(validInput(25, 2), at(10), null);
    const b = revisionFor(validInput(41, 0), at(20), a.revisionId);
    // Series A→B stored, but the pointer still names A@10 (B arrived via
    // the raw append primitive, which never moves selection).
    expect(await p.publishForecast(KEY, a, at(10))).toBe(true);
    expect(await p.appendForecast(KEY, b)).toBe(true);
    expect((await p.getForecastCurrent(KEY))!.revisionId).toBe(a.revisionId);
    // A concurrent move to B@30 holds the pointer row lock uncommitted.
    const holder = await racePool.connect();
    const victim = await racePool.connect();
    try {
      await holder.query("BEGIN");
      const upd = await holder.query("UPDATE ai_decider_forecast_current SET revision_id=$1, evidence_hash=$2, observed_at=$3 WHERE week_key=$4",
        [b.revisionId, b.evidenceHash, at(30), KEY]);
      expect(upd.rowCount).toBe(1);
      const holderPid = await pidOf(holder), victimPid = await pidOf(victim);
      // The delayed A@20 mark starts: its statement snapshot shows A@10
      // as current — a snapshot-proven classification would wrongly
      // report "current" once the upsert's guard refuses the move.
      let settled = false;
      const attempt = racePersistence(victim).markForecastCurrent(KEY, a.revisionId, a.evidenceHash, at(20))
        .then(v => { settled = true; return v; }, (e: unknown) => { settled = true; throw e; });
      await waitForBlocked(victimPid, holderPid, () => settled);
      await holder.query("COMMIT");
      // The verdict describes the post-wait selection: B is current and
      // this older re-observation is stale — the service converges on B
      // instead of returning A as ready.
      await expect(attempt).resolves.toBe("stale");
      expect(await p.getForecastCurrent(KEY)).toEqual({ weekKey: KEY, revisionId: b.revisionId, evidenceHash: b.evidenceHash, observedAt: at(30) });
      const joined = await p.getForecastCurrentRevision(KEY);
      expect(joined!.revision!.revisionId).toBe(b.revisionId);
      const state = await loadAiForecastState(h.runtime, KEY);
      expect(state.status).toBe("ready");
      expect(state.revision!.revisionId).toBe(b.revisionId);
    } finally {
      try { await holder.query("ROLLBACK"); } catch { /* already committed */ }
      holder.release(); victim.release();
    }
  });

  it("no-pointer-row genesis: a publication racing a concurrent first pointer creation cannot overwrite the fresher selection", async () => {
    const p = persistence();
    const a = rev("a".repeat(64), "1".repeat(64), 1), b = rev("b".repeat(64), "2".repeat(64), 2, a.revisionId);
    const c = rev("c".repeat(64), "3".repeat(64), 3, b.revisionId);
    // The series exists with NO pointer row at all (built through the
    // raw append primitive): there is no row for a publication to lock,
    // so its pointer move is exposed to a concurrent first creation.
    expect(await p.appendForecast(KEY, a)).toBe(true);
    expect(await p.appendForecast(KEY, b)).toBe(true);
    expect(await p.getForecastCurrent(KEY)).toBeNull();
    // A mark's first creation of the pointer (A@40), held uncommitted —
    // the speculative-insert state a publisher's creation must meet.
    const holder = await racePool.connect();
    const victim = await racePool.connect();
    try {
      await holder.query("BEGIN");
      const ins = await holder.query("INSERT INTO ai_decider_forecast_current (week_key, revision_id, evidence_hash, observed_at) VALUES ($1, $2, $3, $4)",
        [KEY, a.revisionId, a.evidenceHash, at(40)]);
      expect(ins.rowCount).toBe(1);
      const holderPid = await pidOf(holder), victimPid = await pidOf(victim);
      // The stale publisher of C@30 starts: no pointer row is visible
      // to it anywhere — neither snapshot nor lock can refuse it — so
      // only the move's own structure (guarded UPDATE, yielding
      // creation INSERT) can keep it from overwriting A@40.
      let settled = false;
      const attempt = racePersistence(victim).publishForecast(KEY, c, at(30))
        .then(v => { settled = true; return v; }, (e: unknown) => { settled = true; throw e; });
      await waitForBlocked(victimPid, holderPid, () => settled);
      await holder.query("COMMIT");
      // The publication did not take as current selection.
      await expect(attempt).resolves.toBe(false);
      // The fresher first selection stands; the append stands as inert,
      // never-selected history (the documented corner), and the joined
      // read presents A.
      expect(await p.getForecastCurrent(KEY)).toEqual({ weekKey: KEY, revisionId: a.revisionId, evidenceHash: a.evidenceHash, observedAt: at(40) });
      expect((await p.getForecasts(KEY)).map(r => r.revisionId)).toEqual([a.revisionId, b.revisionId, c.revisionId]);
      const joined = await p.getForecastCurrentRevision(KEY);
      expect(joined!.pointer.revisionId).toBe(a.revisionId);
      expect(joined!.revision!.revisionId).toBe(a.revisionId);
      // The machinery is unharmed afterwards: a genuinely fresh
      // publication on the chain head still lands and becomes current.
      const d = rev("d".repeat(64), "4".repeat(64), 4, c.revisionId);
      expect(await p.publishForecast(KEY, d, at(50))).toBe(true);
      expect((await p.getForecastCurrent(KEY))!.revisionId).toBe(d.revisionId);
    } finally {
      try { await holder.query("ROLLBACK"); } catch { /* already committed */ }
      holder.release(); victim.release();
    }
  });

  it("two publishers queued on the held pointer lock serialize into one linear chain; the loser's rebuild lands on the head", async () => {
    const p = persistence();
    const a = rev("a".repeat(64), "1".repeat(64), 1), b = rev("b".repeat(64), "2".repeat(64), 2, a.revisionId);
    expect(await p.publishForecast(KEY, a, at(10))).toBe(true);
    expect(await p.publishForecast(KEY, b, at(20))).toBe(true);
    // Both racers built on the same head B with different evidence.
    const c = rev("c".repeat(64), "3".repeat(64), 3, b.revisionId);
    const d = rev("d".repeat(64), "4".repeat(64), 4, b.revisionId);
    const holder = await racePool.connect();
    const v1 = await racePool.connect();
    const v2 = await racePool.connect();
    try {
      // Hold the pointer row lock without changing its values, so both
      // publishers provably queue behind it in their lock step.
      await holder.query("BEGIN");
      const upd = await holder.query("UPDATE ai_decider_forecast_current SET observed_at = observed_at WHERE week_key=$1", [KEY]);
      expect(upd.rowCount).toBe(1);
      const holderPid = await pidOf(holder), pid1 = await pidOf(v1), pid2 = await pidOf(v2);
      let s1 = false, s2 = false;
      const a1 = racePersistence(v1).publishForecast(KEY, c, at(30)).then(v => { s1 = true; return v; }, (e: unknown) => { s1 = true; throw e; });
      const a2 = racePersistence(v2).publishForecast(KEY, d, at(30)).then(v => { s2 = true; return v; }, (e: unknown) => { s2 = true; throw e; });
      // Both statements must be observed queued in the pointer lock
      // convoy before the holder releases: the first waits on the
      // holder directly; the second may be attributed to the first
      // (queue order), which proves the same overlap.
      await waitForBlocked(pid1, holderPid, () => s1);
      await waitForBlocked(pid2, holderPid, () => s2, true);
      await holder.query("COMMIT");
      const [r1, r2] = await Promise.all([a1, a2]);
      // Exactly one CAS lands; the chain cannot fork under the lock.
      expect([r1, r2].filter(Boolean)).toHaveLength(1);
      const winner = r1 ? c : d, loser = r1 ? d : c, loserClient = r1 ? v2 : v1;
      let series = await p.getForecasts(KEY);
      expect(series.map(r => r.revisionId)).toEqual([a.revisionId, b.revisionId, winner.revisionId]);
      expect(series.map(r => r.supersedes)).toEqual([null, a.revisionId, b.revisionId]);
      expect((await p.getForecastCurrent(KEY))!.revisionId).toBe(winner.revisionId);
      // The loser's rebuild on the new head lands (equal observation
      // time: the documented tie policy), and the pointer ends on the
      // chain head — the round-2/3 race outcomes, under true overlap.
      expect(await racePersistence(loserClient).publishForecast(KEY, { ...loser, supersedes: winner.revisionId }, at(30))).toBe(true);
      series = await p.getForecasts(KEY);
      expect(series.map(r => r.revisionId)).toEqual([a.revisionId, b.revisionId, winner.revisionId, loser.revisionId]);
      expect(series.map(r => r.supersedes)).toEqual([null, a.revisionId, b.revisionId, winner.revisionId]);
      expect((await p.getForecastCurrent(KEY))!.revisionId).toBe(loser.revisionId);
    } finally {
      try { await holder.query("ROLLBACK"); } catch { /* already committed */ }
      holder.release(); v1.release(); v2.release();
    }
  });
});
