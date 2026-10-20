import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
const factories = vi.hoisted(() => ({ ranked: vi.fn(), choice: vi.fn() }));
vi.mock("../ranked-free-throw/runtime", () => ({ createRankedRuntime: factories.ranked }));
vi.mock("./runtime", () => ({ createChoiceRuntime: factories.choice }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { ArcadeCompetitionStore } from "../arcade-competition/store";
import { DEFAULT_COMPETITION_POLICY } from "../arcade-competition/config";
import { freeThrowRulesVersion } from "../ranked-free-throw/config";
import type { RankedSqlDatabase } from "../ranked-free-throw/store";
import type { CompetitionPeriod, FinalityReceipt } from "@/domain/arcade/competition-period";
import type { ChoiceChallenge, ChoiceGameId, ChoiceInput, ChoiceRunView } from "@/domain/arcade/ranked-game-contract";
import type { RankedAccount } from "@/domain/arcade/ranked-free-throw";
import { choiceRulesVersion, manifestHash, type ChoiceAdapter } from "./adapter";
import { PostgresChoiceStore } from "./store";
import { choiceRequest } from "./http";
import type { ChoiceRuntime } from "./runtime";
import { GET as competitionRead } from "@/app/api/arcade/competition/route";

describe.skipIf(process.env.RUN_CLAIM_TEAM_LOCAL_TEST !== "1")("choice-game HTTP -> real disposable SQL -> sealed boards", () => {
  const schema = `arcade_choice_${randomUUID().replaceAll("-", "")}`;
  const pool = new Pool({ host: "127.0.0.1", port: 55441, database: "claim_team_test", user: "postgres", ssl: false, max: 12,
    options: `-c search_path=${schema} -c application_name=${schema} -c statement_timeout=10000 -c lock_timeout=8000` });
  const db = drizzle(pool), database: RankedSqlDatabase = { execute: async q => db.execute(q),
    transaction: work => db.transaction(tx => work({ execute: async q => tx.execute(q) }), { isolationLevel: "read committed" }) };
  const store = new PostgresChoiceStore(database);
  const ft = { policy: DEFAULT_COMPETITION_POLICY, rulesVersion: freeThrowRulesVersion(DEFAULT_COMPETITION_POLICY) };
  const a: RankedAccount = { subject: "choice-alpha", sessionId: "choice-alpha-session" }, b: RankedAccount = { subject: "choice-beta", sessionId: "choice-beta-session" };
  let owns = false, p: CompetitionPeriod, next: CompetitionPeriod, adapter: ChoiceAdapter, canonical: ArcadeCompetitionStore;
  const challenge = (gameId: ChoiceGameId, format = "b".repeat(64)): ChoiceChallenge => {
    const base = { gameId, formatVersion: format, source: { provider: "SYNTHETIC TEST ONLY", sourceUrl: "https://example.test/fixture", observedAtMs: Date.now(), season: "test-only", version: "synthetic-not-real-grading", contentHash: "a".repeat(64) } };
    return gameId === "priced-in" ? { ...base, gameId, rounds: Array.from({ length: 5 }, (_, i) => ({ playerId: String(i + 1), lineCents: 4000, answerCents: 4200 })) }
      : { ...base, gameId, pools: Array.from({ length: 5 }, (_, i) => ({ teamId: String(i + 1), playerIds: [String(i + 1), "999"] })) };
  };
  function testAdapter(gameId: ChoiceGameId, format = "b".repeat(64)): ChoiceAdapter {
    return { gameId, formatVersion: format, policy: { durationMs: 30000, maxRunsPerPeriod: null, sourceMaxAgeMs: 60000 }, issue: async () => challenge(gameId, format),
      assess: c => ({ status: "scored", result: c.gameId === "priced-in" ? { gameId: c.gameId, score: 750, metric: { kind: "price-points", correct: 5, rounds: 5 }, formatVersion: c.formatVersion, sourceHash: c.source.contentHash }
        : { gameId: c.gameId, score: 50, metric: { kind: "modeled-record", wins: 50, losses: 32 }, formatVersion: c.formatVersion, sourceHash: c.source.contentHash } }) };
  }
  const receipt = (period: CompetitionPeriod, state = "live"): FinalityReceipt => ({ checkedAtMs: Date.now() - 1, source: "synthetic test finality", states: Object.fromEntries(period.fixtures.map(f => [f.id, state])) }) as FinalityReceipt;
  const runtime = (actor = a): ChoiceRuntime => ({ enabled: true, adapters: [adapter], origin: () => "https://test.invalid", account: async () => actor, admitRequest: async () => true, store: () => store });
  async function command(action: "start" | "choose" | "read", value: unknown = {}, run?: ChoiceRunView, actor = a) {
    const url = `https://test.invalid/api/arcade/ranked/${action === "choose" ? "choices" : "runs"}?gameId=${adapter.gameId}${run ? `&runId=${run.id}` : ""}`;
    const request = new Request(url, action === "read" ? {} : { method: "POST", headers: { origin: "https://test.invalid", "content-type": "application/json" }, body: JSON.stringify(value) });
    const response = await choiceRequest(request, action, runtime(actor)); return { code: response.status, value: await response.json() as { status: string; run: ChoiceRunView } };
  }
  async function start(actor = a) { const r = await command("start", {}, undefined, actor); expect(r.code).toBe(201); return r.value.run; }
  const input = (index: number): ChoiceInput => adapter.gameId === "priced-in" ? { call: "over" } : { teamId: String(index + 1), playerId: String(index + 1) };
  async function complete(run: ChoiceRunView, actor = a) { for (let index = 0; index < 5; index++) { const r = await command("choose", { index, input: input(index) }, run, actor); expect(r.code).toBe(201); run = r.value.run; } return run; }
  beforeAll(async () => {
    expect((await pool.query("SELECT current_database() AS name,version() AS version")).rows[0]).toMatchObject({ name: "claim_team_test", version: expect.stringContaining("PostgreSQL 16.") });
    await pool.query(`CREATE SCHEMA ${schema}`); owns = true;
    await pool.query("CREATE TABLE site_users(id uuid PRIMARY KEY,team_id text UNIQUE NOT NULL,display_name text NOT NULL,password_hash text NOT NULL,created_at timestamp DEFAULT now()); CREATE TABLE invite_codes(code text PRIMARY KEY,team_id text,used_by uuid,used_at timestamp,created_at timestamp DEFAULT now()); CREATE TABLE sessions(token_hash text PRIMARY KEY,user_id uuid REFERENCES site_users(id),expires_at timestamp,created_at timestamp DEFAULT now())");
    await pool.query((await readFile("db/friends-auth/0000_friends_auth.sql", "utf8")).replaceAll('"public".', `"${schema}".`));
    await pool.query(await readFile("db/friends-auth/0001_account_usernames.sql", "utf8"));
    await pool.query(await readFile("migrations/ranked-free-throw.sql", "utf8"));
    await pool.query(await readFile("migrations/ranked-choice.sql", "utf8"));
    for (const actor of [a, b]) {
      await pool.query("INSERT INTO auth_user(id,name,email,email_verified,created_at,updated_at) VALUES($1,$2,$3,true,now(),now())", [actor.subject, actor === a ? "alpha" : "beta", `${actor.subject}@example.test`]);
      await pool.query("INSERT INTO auth_session(id,user_id,token,expires_at,created_at,updated_at) VALUES($1,$2,$1,now()+interval '1 hour',now(),now())", [actor.sessionId, actor.subject]);
    }
  }, 30000);
  beforeEach(async () => {
    await pool.query("TRUNCATE arcade_choice_weekly_results,arcade_choice_results,arcade_choice_runs,arcade_weekly_results,ranked_free_throw_scores,ranked_free_throw_runs,arcade_competition_periods CASCADE");
    await pool.query("DELETE FROM account_identities; DELETE FROM site_users; UPDATE auth_session SET expires_at=now()+interval '1 hour'; UPDATE auth_user SET email_verified=true");
    adapter = testAdapter("priced-in"); canonical = new ArcadeCompetitionStore(database, [store.handler(adapter), store.handler(testAdapter("week-2-preview", "c".repeat(64)))]);
    const now = Date.now();
    p = { id: "synthetic-price-week", gameId: "priced-in", formatVersion: adapter.formatVersion, week: "2026-W01", label: "Synthetic price week", order: 1,
      opensAtMs: now - 7200000, predecessorId: null, calendarSource: "https://example.test/calendar", calendarVersion: "test-only", fixtures: [{ id: "123456789", date: "20261020", startsAtMs: now - 3600000 }] };
    next = { ...p, id: "synthetic-draft-week", gameId: "week-2-preview", formatVersion: "c".repeat(64), order: 2, predecessorId: p.id, fixtures: [{ id: "987654321", date: "20261021", startsAtMs: now - 100000 }], opensAtMs: now - 200000 };
    await canonical.reconcile([p, next], ft, new Map([[p.id, receipt(p)], [next.id, receipt(next)]]));
    factories.ranked.mockImplementation(() => ({ configuration: { status: "ready", ...ft }, store: () => canonical, account: async () => a }));
    factories.choice.mockImplementation(() => runtime());
  });
  afterAll(async () => { try { if (owns) await pool.query(`DROP SCHEMA ${schema} CASCADE`); } finally { await pool.end(); } });
  it("mounts owned HTTP commands, hides future answers, atomically completes and recovers without regrading", async () => {
    const run = await start(); expect(run.step).toEqual({ gameId: "priced-in", index: 0, playerId: "1", lineCents: 4000 });
    expect(run.reveals).toEqual([]); expect(JSON.stringify(run)).not.toMatch(/4200|answerCents|manifest|account_id|sessionId/);
    const done = await complete(run); expect(done.completion).toMatchObject({ status: "scored", result: { score: 750, metric: { correct: 5 } } });
    const duplicate = await command("choose", { index: 4, input: input(4) }, run); expect(duplicate.code).toBe(200); expect(duplicate.value.run.completion).toEqual(done.completion);
    expect((await command("read", {}, run)).value.run.completion).toEqual(done.completion);
    expect((await pool.query("SELECT count(*)::integer AS n FROM arcade_choice_results")).rows[0].n).toBe(1);
    expect((await store.board("weekly", (await canonical.currentPeriod())!, adapter.gameId, adapter.formatVersion, a.subject, "everyone")).entries[0]).toMatchObject({ username: "alpha", score: 750, isCurrentUser: true });
  });
  it("rejects foreign, revoked, expired-session and unverified access rather than trusting provider DTOs", async () => {
    const run = await start(); expect((await command("read", {}, run, b)).code).toBe(404);
    expect((await command("choose", { index: 0, input: input(0) }, run, b)).code).toBe(404);
    await pool.query("UPDATE auth_session SET expires_at=now()-interval '1 second' WHERE id=$1", [a.sessionId]);
    expect((await command("choose", { index: 0, input: input(0) }, run)).code).toBe(401);
    expect((await command("read", {}, run)).code).toBe(404);
    await pool.query("UPDATE auth_session SET expires_at=now()+interval '1 hour'");
    await pool.query("UPDATE auth_user SET email_verified=false WHERE id=$1", [a.subject]);
    expect((await command("choose", { index: 0, input: input(0) }, run)).code).toBe(401);
  });
  it("serializes concurrent admissions, same-step repeats and conflicting choices", async () => {
    const runs = await Promise.all([start(), start()]); expect(runs[0].id).toBe(runs[1].id);
    const results = await Promise.all([command("choose", { index: 0, input: { call: "over" } }, runs[0]), command("choose", { index: 0, input: { call: "under" } }, runs[0])]);
    expect(results.map(r => r.code).sort()).toEqual([201, 409]);
    const stored = (await command("read", {}, runs[0])).value.run;
    expect(stored.choices).toHaveLength(1);
    expect((await command("choose", { index: 0, input: stored.choices[0].input }, runs[0])).code).toBe(200);
  });
  it("rejects malformed literal calls through HTTP without SQL writes and preserves valid retry semantics", async () => {
    const run = await start();
    for (const call of [["over"], [["under"]], [], null, true, 1, { value: "over" }, "OVER", "over "]) {
      for (let retry = 0; retry < 2; retry++) expect((await command("choose", { index: 0, input: { call } }, run)).code).toBe(400);
    }
    expect((await command("read", {}, run)).value.run.choices).toEqual([]);
    expect((await pool.query("SELECT choices FROM arcade_choice_runs WHERE id=$1", [run.id])).rows[0].choices).toEqual([]);
    for (const [index, call] of [[0, "over"], [1, "under"]] as const) {
      expect((await command("choose", { index, input: { call } }, run)).code).toBe(201);
      const retry = await command("choose", { index, input: { call } }, run);
      expect(retry.code).toBe(200); expect(retry.value.status).toBe("duplicate");
      expect(retry.value.run.choices[index]).toEqual({ index, input: { call } });
    }
    expect((await command("choose", { index: 0, input: { call: "under" } }, run)).code).toBe(409);
  });
  it.each(["priced-in", "week-2-preview"] as const)("keeps active %s weekly HTTP results on the frozen format after adapter replacement", async gameId => {
    if (gameId === "week-2-preview") {
      await canonical.reconcile([p, next], ft, new Map([[p.id, receipt(p, "final")], [next.id, receipt(next)]]));
      adapter = testAdapter(gameId, next.formatVersion!);
    }
    const frozen = adapter.formatVersion, done = await complete(await start());
    const read = async (kind = "weekly") => {
      const response = await competitionRead(new Request(`https://test.invalid/api/arcade/competition?kind=${kind}&gameId=${gameId}`));
      expect(response.status).toBe(200); return response.json();
    };
    const before = await read();
    expect(before).toMatchObject({ status: "ready", board: { gameId, phase: "open", scoreVersion: frozen, entries: [expect.objectContaining({ username: "alpha", score: gameId === "priced-in" ? 750 : 50 })] } });
    adapter = testAdapter(gameId, "d".repeat(64));
    const after = await read();
    expect(after).toMatchObject({ status: "ready", board: { gameId, phase: "open", scoreVersion: frozen, entries: before.board.entries } });
    const active = (await canonical.currentPeriod())!;
    expect(await store.board("weekly", active, gameId, adapter.formatVersion, a.subject, "everyone")).toMatchObject({ scoreVersion: frozen, entries: before.board.entries });
    expect(await read("all-time")).toMatchObject({ status: "ready", board: { scoreVersion: adapter.formatVersion, entries: [] } });
    expect((await command("start")).value.status).toBe("held");
    expect((await command("read", {}, done)).value.run.completion).toEqual(done.completion);
  });
  it("rejects injected totals/source/identity and out-of-order inputs", async () => {
    const run = await start();
    for (const value of [{ index: 1, input: input(1) }, { index: 0, input: { call: "over", score: 750 } }, { index: 0, input: input(0), userId: b.subject }])
      expect((await command("choose", value, run)).code).toBe(400);
    expect((await command("read", {}, run)).value.run.choices).toHaveLength(0);
  });
  it("rolls the fifth choice back if result insertion fails, then retries exactly once", async () => {
    const run = await start(); for (let index = 0; index < 4; index++) await command("choose", { index, input: input(index) }, run);
    await pool.query("CREATE FUNCTION fail_choice() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic insert failure'; END; $$; CREATE TRIGGER fail_choice BEFORE INSERT ON arcade_choice_results FOR EACH ROW EXECUTE FUNCTION fail_choice()");
    expect((await command("choose", { index: 4, input: input(4) }, run)).code).toBe(503);
    expect((await command("read", {}, run)).value.run.choices).toHaveLength(4);
    await pool.query("DROP TRIGGER fail_choice ON arcade_choice_results; DROP FUNCTION fail_choice()");
    const results = await Promise.all([command("choose", { index: 4, input: input(4) }, run), command("choose", { index: 4, input: input(4) }, run)]);
    expect(results.map(r => r.code).sort()).toEqual([200, 201]);
    expect((await pool.query("SELECT count(*)::integer AS n FROM arcade_choice_results")).rows[0].n).toBe(1);
  });
  it("seals frozen eligibility and format, expires old runs, opens the actual next game and retains owner recovery", async () => {
    const done = await complete(await start()), unfinished = await start(b);
    expect((await canonical.start(a, ft)).status).toBe("week_closing");
    expect((await canonical.board("weekly", null, ft, null)).phase).toBe("held");
    expect(await canonical.reconcile([p, next], ft, new Map([[p.id, receipt(p, "final")], [next.id, receipt(next)]]))).toEqual([p.id]);
    expect((await command("read", {}, unfinished, b)).value.run.state).toBe("expired");
    expect((await command("read", {}, done)).value.run.completion).toEqual(done.completion);
    expect((await command("choose", { index: 4, input: input(4) }, done)).code).toBe(200);
    const team = randomUUID(); await pool.query("INSERT INTO site_users(id,team_id,display_name,password_hash) VALUES($1,'1','Synthetic','unused')", [team]);
    await pool.query("INSERT INTO account_identities(subject,user_id,active) VALUES($1,$2,true)", [a.subject, team]);
    const final = (await canonical.period(p.id))!;
    expect((await store.board("archive", final, "priced-in", "d".repeat(64), null, "league")).entries).toHaveLength(0);
    expect((await store.board("weekly", final, "priced-in", "d".repeat(64), null, "everyone")).scoreVersion).toBe(p.formatVersion);
    expect((await store.board("all-time", null, "priced-in", adapter.formatVersion, null, "league")).entries).toHaveLength(1);
    adapter = testAdapter("week-2-preview", "c".repeat(64));
    const draft = await start(); expect(draft.gameId).toBe("week-2-preview"); expect((await complete(draft)).completion).toMatchObject({ status: "scored", result: { score: 50, metric: { wins: 50, losses: 32 } } });
    expect((await store.board("all-time", null, "priced-in", "d".repeat(64), null, "everyone")).entries).toHaveLength(0);
    await expect(pool.query("UPDATE arcade_choice_weekly_results SET score=0")).rejects.toMatchObject({ code: "P0001" });
    await expect(pool.query("UPDATE arcade_choice_results SET score=0")).rejects.toMatchObject({ code: "P0001" });
    await expect(pool.query("UPDATE arcade_choice_runs SET manifest='{}' WHERE id=$1", [draft.id])).rejects.toMatchObject({ code: "P0001" });
  });
  it("records missing coverage as unscored and never admits it to either ranking", async () => {
    adapter = { ...adapter, assess: () => ({ status: "unscored", reason: "missing_coverage" }) };
    const done = await complete(await start()); expect(done.completion).toMatchObject({ status: "unscored", reason: "missing_coverage" });
    expect((await store.board("all-time", null, adapter.gameId, adapter.formatVersion, null, "everyone")).entries).toHaveLength(0);
    await canonical.reconcile([p, next], ft, new Map([[p.id, receipt(p, "final")]]));
    expect((await pool.query("SELECT count(*)::integer AS n FROM arcade_choice_weekly_results")).rows[0].n).toBe(0);
  });
  it("does not publish or skip an unsupported game's predecessor", async () => {
    await pool.query("TRUNCATE arcade_choice_weekly_results,arcade_choice_results,arcade_choice_runs,arcade_competition_periods CASCADE");
    const held = new ArcadeCompetitionStore(database);
    expect(await held.reconcile([p, next], ft, new Map([[p.id, receipt(p, "final")], [next.id, receipt(next)]]))).toEqual([]);
    expect(await held.currentPeriod()).toBeNull();
  });
  it("enforces policy quota, source age and rejects frozen version changes", async () => {
    const limited = { ...adapter, policy: { ...adapter.policy, maxRunsPerPeriod: 1 } };
    expect((await store.start(a, limited, await limited.issue())).status).toBe("held");
    const old = await adapter.issue(); old!.source.observedAtMs = Date.now() - 120000;
    expect((await store.start(a, adapter, old)).status).toBe("unavailable");
    expect(choiceRulesVersion(limited)).not.toBe(choiceRulesVersion(adapter));
    await pool.query("TRUNCATE arcade_choice_weekly_results,arcade_choice_results,arcade_choice_runs,arcade_competition_periods CASCADE");
    adapter = limited; canonical = new ArcadeCompetitionStore(database, [store.handler(adapter)]);
    await canonical.reconcile([p], ft, new Map([[p.id, receipt(p)]]));
    await complete(await start()); expect((await command("start")).code).toBe(429);
  });
  it("rejects wrong frozen teams/pools, duplicate players and completion before five picks", async () => {
    await canonical.reconcile([p, next], ft, new Map([[p.id, receipt(p, "final")], [next.id, receipt(next)]]));
    adapter = testAdapter("week-2-preview", "c".repeat(64)); const run = await start();
    expect((await command("choose", { index: 0, input: { teamId: "2", playerId: "2" } }, run)).code).toBe(400);
    expect((await command("choose", { index: 0, input: { teamId: "1", playerId: "404" } }, run)).code).toBe(400);
    expect((await command("choose", { index: 0, input: { teamId: "1", playerId: "999" } }, run)).code).toBe(201);
    expect((await command("choose", { index: 1, input: { teamId: "2", playerId: "999" } }, run)).code).toBe(400);
    expect((await pool.query("SELECT count(*)::integer AS n FROM arcade_choice_results")).rows[0].n).toBe(0);
  });
  it("fails closed when the trusted grader returns wrong game, source, format or metric", async () => {
    const run = await start(); for (let index = 0; index < 4; index++) await command("choose", { index, input: input(index) }, run);
    const real = adapter.assess;
    for (const extra of [{ sourceHash: "0".repeat(64) }, { formatVersion: "0".repeat(64) }, { gameId: "week-2-preview" }, { score: 751 }]) {
      adapter = { ...adapter, assess: (c, choices) => { const a = real(c, choices); if (a.status !== "scored") throw Error("bad fixture"); return { status: "scored", result: { ...a.result, ...extra } } as never; } };
      expect((await command("choose", { index: 4, input: input(4) }, run)).code).toBe(503);
      expect((await command("read", {}, run)).value.run.choices).toHaveLength(4);
    }
    expect((await pool.query("SELECT count(*)::integer AS n FROM arcade_choice_results")).rows[0].n).toBe(0);
  });
  it("keeps one best result per account, with acceptance time then immutable result UUID ties", async () => {
    const c = (await adapter.issue())!, at = Date.now() - 100;
    const choices = Array.from({ length: 5 }, (_, index) => ({ index, input: input(index) }));
    for (const [actor, id, time] of [[a, "00000000-0000-4000-8000-000000000002", at], [b, "00000000-0000-4000-8000-000000000001", at], [a, "00000000-0000-4000-8000-000000000003", at + 1]] as const) {
      const runId = randomUUID(), assessment = adapter.assess(c, choices);
      await pool.query("INSERT INTO arcade_choice_runs(id,account_id,period_id,game_id,rules_version,format_version,policy,manifest,manifest_hash,started_at_ms,expires_at_ms,choices,state) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'completed')", [runId, actor.subject, p.id, adapter.gameId, choiceRulesVersion(adapter), adapter.formatVersion, JSON.stringify(adapter.policy), JSON.stringify(c), manifestHash(c), at - 1000, at + 29000, JSON.stringify(choices)]);
      await pool.query("INSERT INTO arcade_choice_results(id,run_id,score,assessment,achieved_at_ms) VALUES($1,$2,750,$3,$4)", [id, runId, JSON.stringify(assessment), time]);
    }
    expect((await store.board("all-time", null, adapter.gameId, adapter.formatVersion, null, "everyone")).entries.map(e => e.username)).toEqual(["beta", "alpha"]);
    await canonical.reconcile([p, next], ft, new Map([[p.id, receipt(p, "final")]]));
    const final = (await canonical.period(p.id))!;
    expect((await store.board("archive", final, adapter.gameId, adapter.formatVersion, null, "everyone")).entries.map(e => e.username)).toEqual(["beta", "alpha"]);
    expect((await pool.query("SELECT result_id FROM arcade_choice_weekly_results WHERE account_id=$1", [a.subject])).rows[0].result_id).toBe("00000000-0000-4000-8000-000000000002");
  });
  it("rolls back a failed seal without a partial archive or next-game admission", async () => {
    await complete(await start());
    await pool.query("CREATE FUNCTION fail_choice_seal() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic seal failure'; END; $$; CREATE TRIGGER fail_choice_seal BEFORE INSERT ON arcade_choice_weekly_results FOR EACH ROW EXECUTE FUNCTION fail_choice_seal()");
    await expect(canonical.reconcile([p, next], ft, new Map([[p.id, receipt(p, "final")]]))).rejects.toThrow();
    expect((await canonical.currentPeriod())!.id).toBe(p.id); expect(await canonical.archives()).toHaveLength(0);
    await pool.query("DROP TRIGGER fail_choice_seal ON arcade_choice_weekly_results; DROP FUNCTION fail_choice_seal()");
    expect(await canonical.reconcile([p, next], ft, new Map([[p.id, receipt(p, "final")], [next.id, receipt(next)]]))).toEqual([p.id]);
    expect(await canonical.reconcile([p, next], ft, new Map([[p.id, receipt(p, "final")]]))).toEqual([]);
    expect(await canonical.archives()).toHaveLength(1);
  });
  it("waits for an in-flight fifth choice before taking its immutable final", async () => {
    const run = await start(); for (let index = 0; index < 4; index++) await command("choose", { index, input: input(index) }, run);
    const blocker = await pool.connect();
    try {
      await blocker.query("BEGIN"); await blocker.query("SELECT id FROM arcade_choice_runs WHERE id=$1 FOR UPDATE", [run.id]);
      const saving = command("choose", { index: 4, input: input(4) }, run);
      const deadline = Date.now() + 3000; let waiting = false;
      while (Date.now() < deadline) {
        const rows = await pool.query("SELECT pid FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock' AND query LIKE '%SELECT * FROM arcade_choice_runs%FOR UPDATE%'", [schema]);
        if (rows.rowCount) { waiting = true; break; } await new Promise(resolve => setTimeout(resolve, 20));
      }
      expect(waiting).toBe(true);
      const finalizing = canonical.reconcile([p, next], ft, new Map([[p.id, receipt(p, "final")], [next.id, receipt(next)]]));
      await blocker.query("COMMIT"); expect((await saving).code).toBe(201); expect(await finalizing).toEqual([p.id]);
      expect((await store.board("archive", (await canonical.period(p.id))!, adapter.gameId, adapter.formatVersion, null, "everyone")).entries).toHaveLength(1);
    } finally { await blocker.query("ROLLBACK"); blocker.release(); }
  });
  it("publishes a later reviewed format without requiring removed adapters for already sealed weeks", async () => {
    await canonical.reconcile([p, next], ft, new Map([[p.id, receipt(p, "final")], [next.id, receipt(next, "final")]]));
    adapter = testAdapter("priced-in", "d".repeat(64));
    const later: CompetitionPeriod = { ...p, id: "synthetic-later-format", formatVersion: adapter.formatVersion, order: 3, predecessorId: next.id,
      opensAtMs: Date.now() - 10000, fixtures: [{ id: "123456791", date: "20261022", startsAtMs: Date.now() - 1000 }] };
    canonical = new ArcadeCompetitionStore(database, [store.handler(adapter)]);
    await canonical.reconcile([p, next, later], ft, new Map([[later.id, receipt(later)]]));
    expect((await canonical.currentPeriod())!.id).toBe(later.id);
    expect((await start()).formatVersion).toBe(later.formatVersion);
    expect((await canonical.period(p.id))!.scoreVersion).toBe(p.formatVersion);
  });
  it("fails closed on migration reapplication without changing the existing schema", async () => {
    const client = await pool.connect();
    try {
      const before = (await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema=$1 ORDER BY table_name", [schema])).rows;
      await expect(client.query(await readFile("migrations/ranked-choice.sql", "utf8"))).rejects.toMatchObject({ code: "42P07" });
      await client.query("ROLLBACK");
      expect((await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema=$1 ORDER BY table_name", [schema])).rows).toEqual(before);
      expect((await client.query("SELECT count(*)::integer AS n FROM auth_user")).rows[0].n).toBe(2);
    } finally { await client.query("ROLLBACK"); client.release(); }
  });
  it("rechecks run expiry and session expiry after queued lock waits", async () => {
    const id = randomUUID(), c = (await adapter.issue())!, at = Date.now();
    await pool.query("INSERT INTO arcade_choice_runs(id,account_id,period_id,game_id,rules_version,format_version,policy,manifest,manifest_hash,started_at_ms,expires_at_ms) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
      [id, a.subject, p.id, adapter.gameId, choiceRulesVersion(adapter), adapter.formatVersion, JSON.stringify(adapter.policy), JSON.stringify(c), manifestHash(c), at - 29500, at + 500]);
    const blocker = await pool.connect();
    try {
      await blocker.query("BEGIN"); await blocker.query("SELECT id FROM arcade_choice_runs WHERE id=$1 FOR UPDATE", [id]);
      const pending = store.choose(a, adapter, id, 0, input(0));
      const deadline = Date.now() + 3000; let waiting = false;
      while (Date.now() < deadline) {
        const rows = await pool.query("SELECT pid FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock' AND query LIKE '%SELECT * FROM arcade_choice_runs%FOR UPDATE%'", [schema]);
        if (rows.rowCount) { waiting = true; break; } await new Promise(resolve => setTimeout(resolve, 20));
      }
      expect(waiting).toBe(true); await new Promise(resolve => setTimeout(resolve, 550)); await blocker.query("COMMIT");
      expect((await pending).status).toBe("expired");
      expect((await store.read(a, id, adapter.gameId))!.choices).toHaveLength(0);
      await pool.query("UPDATE auth_session SET expires_at=clock_timestamp()+interval '500 milliseconds' WHERE id=$1", [a.sessionId]);
      await blocker.query("BEGIN"); await blocker.query("SELECT id FROM auth_user WHERE id=$1 FOR UPDATE", [a.subject]);
      const admission = store.start(a, adapter, await adapter.issue());
      const until = Date.now() + 3000; waiting = false;
      while (Date.now() < until) {
        const rows = await pool.query("SELECT pid FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock' AND query LIKE '%FOR UPDATE OF u,s%'", [schema]);
        if (rows.rowCount) { waiting = true; break; } await new Promise(resolve => setTimeout(resolve, 20));
      }
      expect(waiting).toBe(true); await new Promise(resolve => setTimeout(resolve, 550)); await blocker.query("COMMIT");
      expect((await admission).status).toBe("unauthenticated");
    } finally { await blocker.query("ROLLBACK"); blocker.release(); }
  });
});
