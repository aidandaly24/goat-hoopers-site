import { readFile } from "node:fs/promises";
import { expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { PostgresRankedFreeThrowStore, type RankedSqlDatabase } from "../store";
import { account, configuration, nowMs, policy, replayContext, round, run, sampleScore, submission } from "./fixtures";
import { rankedReplayContext } from "@/domain/arcade/ranked-free-throw";
import { freeThrowRulesVersion } from "../config";

function database(rows: Record<string, unknown>[][]) {
  const statements: { sql: string; params: unknown[] }[] = [];
  const dialect = new PgDialect();
  const db: RankedSqlDatabase = {
    execute: vi.fn(async statement => { statements.push(dialect.sqlToQuery(statement)); return { rows: rows.shift() ?? [] }; }),
    transaction: vi.fn(async work => work(db)),
  };
  return { db, statements, store: new PostgresRankedFreeThrowStore(db) };
}

it("serializes admissions on the personal-account row before a fresh quota read and insert", async () => {
  const { store, db, statements } = database([[{ id: account.subject }], [{ now_ms: String(nowMs) }], [], [], [{ count: 0 }], [{ id: run.id }]]);
  const result = await store.start(account, configuration);
  expect(result.status).toBe("created");
  if (result.status !== "created") throw new Error("fixture");
  expect(result.run.userId).toBe(account.subject);
  expect(result.run.startedAtMs).toBe(nowMs);
  expect(result.run.expiresAtMs - result.run.startedAtMs).toBe(policy.durationMs);
  expect(db.transaction).toHaveBeenCalledTimes(1);
  expect(statements[0].sql).toContain("FOR UPDATE OF a, s");
  expect(statements[0].params).toContain(account.sessionId);
  expect(statements[4].sql).toContain("started_at_ms >=");
  expect(statements[4].sql).not.toContain("rules_version");
  expect(statements[5].params).toContain(account.subject);
  expect(statements[5].sql).toContain("s.expires_at > clock_timestamp()");
  expect(statements.map(statement => statement.sql).join(" ")).not.toContain("site_users");
});

it("does no admission work after session denial and enforces busy/quota/closing without insertion", async () => {
  const denied = database([]);
  expect(await denied.store.start(account, configuration)).toEqual({ status: "unauthenticated" });
  expect(denied.statements).toHaveLength(1);
  const busy = database([[{ id: account.subject }], [{ now_ms: nowMs }], [], [{ id: run.id }]]);
  expect(await busy.store.start(account, configuration)).toEqual({ status: "busy" });
  const quota = database([[{ id: account.subject }], [{ now_ms: nowMs }], [], [], [{ count: policy.maxRunsPerWeek }]]);
  expect(await quota.store.start(account, configuration)).toEqual({ status: "quota" });
  const closing = database([[{ id: account.subject }], [{ now_ms: run.period.endsAtMs - policy.durationMs + 1 }]]);
  expect(await closing.store.start(account, configuration)).toEqual({ status: "week_closing" });
  for (const result of [busy, quota, closing]) expect(result.statements.some(statement => /INSERT INTO/.test(statement.sql))).toBe(false);
});

it("fails closed on a missing/corrupt database clock or admission count", async () => {
  const badClock = database([[{ id: account.subject }], [{ now_ms: "NaN" }]]);
  await expect(badClock.store.start(account, configuration)).rejects.toThrow("ranked_state_unavailable");
  const badCount = database([[{ id: account.subject }], [{ now_ms: nowMs }], [], [], [{ count: -1 }]]);
  await expect(badCount.store.start(account, configuration)).rejects.toThrow("ranked_state_unavailable");
});

it("locks before reading the acceptance clock, and consumes plus inserts in one rollback-capable transaction", async () => {
  const scoreId = "00000000-0000-4000-8000-000000000002";
  const { store, db, statements } = database([[{ id: account.subject }], [{ id: run.id }],
    [{ score_id: scoreId, run_id: run.id, score: 2, outcomes: "11", achieved_at_ms: String(nowMs) }]]);
  expect(await store.consume(account, run, round)).toMatchObject({ id: scoreId, runId: run.id, score: 2, achievedAtMs: nowMs, makes: 2, attempts: 2, accuracy: 1, longestStreak: 2, endingStreak: 2, outcomes: [1, 1] });
  expect(db.transaction).toHaveBeenCalledTimes(1);
  expect(statements[0].sql).toContain("FOR UPDATE OF a, s");
  expect(statements[1].sql).toContain("FOR UPDATE");
  expect(statements[0].sql + statements[1].sql).not.toContain(" AS now_ms");
  const commit = statements[2];
  expect(commit.sql).toContain("UPDATE ranked_free_throw_runs");
  expect(commit.sql).toContain("INSERT INTO ranked_free_throw_scores");
  expect(commit.sql).toContain("r.state = 'open'");
  expect(commit.sql).toContain("moment.now_ms < r.expires_at_ms");
  expect(commit.sql).toContain("moment.now_ms < r.week_ends_at_ms");
  expect(commit.sql).toContain("s.expires_at > clock_timestamp()");
  expect(commit.sql).not.toContain("ON CONFLICT");
  expect(commit.params).toContain(account.subject); expect(commit.params).toContain(account.sessionId);
  expect(commit.params).toContain(configuration.rulesVersion);
  expect(commit.params).toContain("11"); expect(commit.params).toContain(JSON.stringify(submission.shots));
});

it("does not insert after authorization/state denial or turn a failed SQL statement into success", async () => {
  const denied = database([]);
  expect(await denied.store.consume(account, run, round)).toBeNull();
  const consumed = database([[{ id: account.subject }], [{ id: run.id }], []]);
  expect(await consumed.store.consume(account, run, round)).toBeNull();
  const failure = database([[{ id: account.subject }], [{ id: run.id }]]);
  const execute = failure.db.execute;
  failure.db.execute = async statement => {
    if (new PgDialect().sqlToQuery(statement).sql.includes("INSERT INTO ranked_free_throw_scores")) throw new Error("synthetic insert failure");
    return execute(statement);
  };
  await expect(failure.store.consume(account, run, round)).rejects.toThrow("synthetic insert failure");
});

it("reads owner-filtered server state and refuses altered policy metadata", async () => {
  const row = { id: run.id, account_id: account.subject, rules: policy, replay_context: replayContext, rules_version: configuration.rulesVersion,
    state: "open", week: run.week, started_at_ms: String(run.startedAtMs), expires_at_ms: String(run.expiresAtMs),
    week_starts_at_ms: String(run.period.startsAtMs), week_ends_at_ms: String(run.period.endsAtMs), now_ms: String(nowMs) };
  const valid = database([[row]]);
  expect(await valid.store.readRun(account, run.id)).toEqual({ run, policy, replayContext, nowMs });
  expect(valid.statements[0].params).toContain(account.subject);
  expect(valid.statements[0].params).toContain(account.sessionId);
  const altered = database([[{ ...row, rules: { ...policy, shots: 3 } }]]);
  await expect(altered.store.readRun(account, run.id)).rejects.toThrow("ranked_state_unavailable");
});

const savedRow = { id: run.id, account_id: account.subject, rules: policy, replay_context: replayContext, rules_version: configuration.rulesVersion,
  state: "consumed", week: run.week, started_at_ms: run.startedAtMs, expires_at_ms: run.expiresAtMs,
  week_starts_at_ms: run.period.startsAtMs, week_ends_at_ms: run.period.endsAtMs,
  score_id: sampleScore.id, run_id: run.id, score: 2, outcomes: "11", shot_inputs: submission.shots, achieved_at_ms: nowMs };

it("retains the old v1 fingerprint and replays historical fixed-line results using their frozen context", async () => {
  const oldPolicy = { ...policy, engine: "fixed-line-makes-v1" as const }, oldContext = rankedReplayContext("fixed-line-makes-v1");
  const oldVersion = freeThrowRulesVersion(oldPolicy, oldContext);
  expect(oldVersion).toBe("ea542fed1409014a88ba462b0834b73bfbc90fffa196e33c2018f5781cff10c4");
  expect(oldVersion).not.toBe(configuration.rulesVersion);
  const oldInputs = submission.shots.map(input => ({ ...input, power: 50 }));
  expect(await database([[{ ...savedRow, rules: oldPolicy, replay_context: oldContext, rules_version: oldVersion, shot_inputs: oldInputs }]]).store.result(account, run.id))
    .toMatchObject({ score: 2, outcomes: [1, 1], inputs: oldInputs, replayContext: oldContext, rulesVersion: oldVersion });
});

it("reconstructs private results from immutable run metadata, compact outcomes and stored input evidence", async () => {
  const result = database([[savedRow]]);
  expect(await result.store.result(account, run.id)).toEqual(sampleScore);
  const query = result.statements[0];
  expect(query.params).toContain(account.subject); expect(query.params).toContain(account.sessionId);
  expect(query.sql).toContain("r.account_id ="); expect(query.sql).toContain("session.expires_at > clock_timestamp()");
  expect(query.sql).toContain("a.email_verified = true"); expect(query.sql).not.toContain("UPDATE");
  expect(await database([[]]).store.result(account, run.id)).toBeNull();
});

it.each([
  { outcomes: "10" }, { outcomes: "11\n" }, { score: 1 }, { shot_inputs: [] },
  { shot_inputs: submission.shots.map(shot => ({ ...shot, direction: 14 })) },
  { shot_inputs: [{ ...submission.shots[0], made: true }, submission.shots[1]] },
  { replay_context: { ...replayContext, engine: "unknown" } },
  { expires_at_ms: run.expiresAtMs + 1 }, { week_ends_at_ms: run.period.endsAtMs + 1 },
])("refuses corrupted stored results rather than exposing inconsistent derived stats: %j", async changed => {
  await expect(database([[{ ...savedRow, ...changed }]]).store.result(account, run.id)).rejects.toThrow("ranked_state_unavailable");
});

it("writes compact ordered outcomes and normalized input evidence in the same consume/insert statement", async () => {
  const result = database([[{ id: account.subject }], [{ id: run.id }], [savedRow]]);
  await result.store.consume(account, run, round);
  const insert = result.statements[2];
  expect(insert.sql).toContain("(run_id, score, outcomes, shot_inputs, achieved_at_ms)");
  expect(insert.params).toContain("11"); expect(insert.params).toContain(JSON.stringify(submission.shots));
  expect(insert.sql).toContain("RETURNING id AS score_id");
  const start = database([[{ id: account.subject }], [{ now_ms: nowMs }], [], [], [{ count: 0 }], [{ id: run.id }]]);
  await start.store.start(account, configuration);
  expect(start.statements[5].params).toContain(JSON.stringify(replayContext));
});

it("builds a bounded per-person weekly board with stable ties and privacy-safe names", async () => {
  const result = database([[{ now_ms: nowMs }], [
    { rank: 1, score: 2, outcomes: "11", username: "hooper_one", team_id: null, achieved_at_ms: nowMs, is_current_user: true },
    { rank: 2, score: 0, outcomes: "00", username: "private@example.test", team_id: "1", achieved_at_ms: nowMs, is_current_user: false },
  ]]);
  expect((await result.store.leaderboard(configuration, "everyone", account.subject, 50)).entries).toMatchObject([
    { rank: 1, score: 2, attempts: 2, makes: 2, accuracy: 1, longestStreak: 2, endingStreak: 2, username: "hooper_one", teamId: null, achievedAtMs: nowMs, isCurrentUser: true },
    { rank: 2, score: 0, attempts: 2, makes: 0, accuracy: 0, longestStreak: 0, endingStreak: 0, username: "Player", teamId: "1", achievedAtMs: nowMs, isCurrentUser: false },
  ]);
  const query = result.statements[1];
  expect(query.sql).toContain("DISTINCT ON (r.account_id)");
  expect(query.sql).toContain("score DESC, achieved_at_ms ASC, id ASC");
  expect(query.sql).toContain("i.active = true"); expect(query.sql).not.toContain("AND u.id IS NOT NULL");
  expect(query.params).toContain(configuration.rulesVersion); expect(query.params).toContain(run.period.startsAtMs);
  expect(query.sql).not.toContain("a.email");
  await expect(result.store.leaderboard(configuration, "everyone", null, 101)).rejects.toThrow("invalid_leaderboard_request");
});

it("enforces current valid team membership for League while retaining a neutral username fallback", async () => {
  const league = database([[{ now_ms: nowMs }], [{ rank: 1, score: 2, outcomes: "11", username: null, team_id: "1", achieved_at_ms: nowMs, is_current_user: true }]]);
  expect((await league.store.leaderboard(configuration, "league", account.subject, 50)).entries[0])
    .toMatchObject({ username: "Player", teamId: "1", isCurrentUser: true });
  expect(league.statements[1].sql).toContain("AND u.id IS NOT NULL");
  for (const teamId of [null, "11", "not-a-team"]) {
    const corrupt = database([[{ now_ms: nowMs }], [{ rank: 1, score: 2, outcomes: "11", username: "hooper", team_id: teamId, achieved_at_ms: nowMs }]]);
    await expect(corrupt.store.leaderboard(configuration, "league", null, 50)).rejects.toThrow("ranked_state_unavailable");
  }
});

it.each([
  { score_id: "invalid-score-id" }, { run_id: "different-run" }, { score: 99 }, { outcomes: "10" },
  { achieved_at_ms: run.startedAtMs - 1 }, { achieved_at_ms: run.expiresAtMs },
])("does not report a corrupt score receipt as a successful commit: %j", changed => {
  const result = database([[{ id: account.subject }], [{ id: run.id }], [{ score_id: "00000000-0000-4000-8000-000000000002",
    run_id: run.id, score: 2, outcomes: "11", achieved_at_ms: nowMs, ...changed }]]);
  return expect(result.store.consume(account, run, round)).rejects.toThrow();
});

it("proposes separate personal ownership and one-score-per-run constraints without applying SQL", async () => {
  const migration = await readFile(new URL("../../../../migrations/ranked-free-throw.sql", import.meta.url), "utf8");
  expect(migration).toContain("account_id text NOT NULL REFERENCES auth_user(id)");
  expect(migration).toContain("run_id uuid NOT NULL UNIQUE REFERENCES ranked_free_throw_runs(id)");
  expect(migration).toContain("WHERE state = 'open'");
  expect(migration).not.toMatch(/(?:ALTER|DROP|UPDATE|INSERT INTO) (?:game_scores|rewards|site_users)/i);
});
