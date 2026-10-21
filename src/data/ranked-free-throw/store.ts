import "server-only";
import type { RankedAcceptedScore } from "@/domain/arcade/ranked-record-feedback";
import { randomUUID } from "node:crypto";
import { sql, type SQL } from "drizzle-orm";
import { parseAccountUsername } from "@/domain/friends-accounts";
import { validateScoreSubmission } from "@/domain/arcade/competition";
import {
  decodeOutcomes, parseFreeThrowPolicy, parseRankedReplayContext, rankedId, rankedPeriod, rankedReplayContext, replayRankedRound, safeInteger, summarizeOutcomes,
  type FreeThrowPolicy, type RankedAccount, type RankedReplayContext, type ValidatedRound,
  type RankedLeaderboardEntry, type RankedPeriod, type RankedRun, type RankedScope, type RankedScore,
} from "@/domain/arcade/ranked-free-throw";
import { freeThrowRulesVersion } from "./config";

export type ReadyRankedConfiguration = { policy: FreeThrowPolicy; rulesVersion: string };
export type StartRunResult = { status: "created"; run: RankedRun } | { status: "unauthenticated" | "busy" | "quota" | "week_closing" };
export type StoredRankedRun = { run: RankedRun; policy: unknown; replayContext: RankedReplayContext; nowMs: number };
export type RankedPersistence = {
  start(account: RankedAccount, config: ReadyRankedConfiguration): Promise<StartRunResult>;
  readRun(account: RankedAccount, id: string): Promise<StoredRankedRun | null>;
  consume(account: RankedAccount, run: RankedRun, round: ValidatedRound): Promise<RankedAcceptedScore | null>;
  result(account: RankedAccount, runId: string): Promise<RankedScore | null>;
  leaderboard(config: ReadyRankedConfiguration, scope: RankedScope, viewer: string | null, limit: number): Promise<{ period: RankedPeriod; entries: RankedLeaderboardEntry[] }>;
};
export type RankedSqlClient = { execute(statement: SQL): Promise<{ rows: Record<string, unknown>[] }> };
/** Adapter transactions must provide READ COMMITTED; runtime sets it explicitly. */
export type RankedSqlDatabase = RankedSqlClient & { transaction<T>(work: (tx: RankedSqlClient) => Promise<T>): Promise<T> };

const millis = (value: unknown) => {
  const parsed = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  if (!safeInteger(parsed) || parsed < 0 || parsed > 253402214400000) throw new Error("ranked_state_unavailable");
  return parsed;
};
const clock = sql`SELECT floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint AS now_ms`;
const authorization = (account: RankedAccount) => sql`
  SELECT a.id FROM auth_user a JOIN auth_session s ON s.user_id = a.id
  WHERE a.id = ${account.subject} AND s.id = ${account.sessionId}
    AND a.email_verified = true AND s.expires_at > clock_timestamp()
  FOR UPDATE OF a, s`;

function persistedOutcomes(value: unknown) {
  try { return decodeOutcomes(value); } catch { throw new Error("ranked_state_unavailable"); }
}

function metadata(row: Record<string, unknown>) {
  const state = row.state;
  if (state !== "open" && state !== "consumed" && state !== "expired") throw new Error("ranked_state_unavailable");
  const policy = parseFreeThrowPolicy(row.rules), replayContext = parseRankedReplayContext(row.replay_context);
  if (!policy || !replayContext || policy.engine !== replayContext.engine || freeThrowRulesVersion(policy, replayContext) !== row.rules_version) throw new Error("ranked_state_unavailable");
  const run: RankedRun = { id: String(row.id), userId: String(row.account_id), gameId: "free-throw", rulesVersion: String(row.rules_version),
    week: String(row.week), state, startedAtMs: millis(row.started_at_ms), expiresAtMs: millis(row.expires_at_ms),
    period: { week: String(row.week), startsAtMs: millis(row.week_starts_at_ms), endsAtMs: row.week_ends_at_ms == null ? null : millis(row.week_ends_at_ms) } };
  const canonical = typeof row.period_id === "string";
  if (canonical) run.period = { ...run.period, id: String(row.period_id), endsAtMs: row.week_ends_at_ms == null ? null : millis(row.week_ends_at_ms) };
  const period = canonical ? run.period : rankedPeriod(run.startedAtMs, policy.calendar);
  if (!rankedId(row.id) || typeof row.account_id !== "string" || !row.account_id || run.week !== period.week ||
    run.period.startsAtMs !== period.startsAtMs || run.period.endsAtMs !== period.endsAtMs ||
    run.expiresAtMs - run.startedAtMs !== policy.durationMs || (period.endsAtMs !== null && run.expiresAtMs > period.endsAtMs)) throw new Error("ranked_state_unavailable");
  return { run, policy, replayContext };
}

function completedScore(row: Record<string, unknown>, run: RankedRun, replayContext: RankedReplayContext, round: ValidatedRound): RankedScore {
  const achievedAtMs = millis(row.achieved_at_ms), outcomes = persistedOutcomes(row.outcomes);
  if (!rankedId(row.score_id) || row.run_id !== run.id || row.score !== round.statistics.score ||
    outcomes.join("") !== round.outcomes.join("") || achievedAtMs < run.startedAtMs || achievedAtMs >= run.expiresAtMs) {
    throw new Error("ranked_state_unavailable");
  }
  return { ...summarizeOutcomes(outcomes), id: row.score_id, runId: run.id, gameId: "free-throw", week: run.week, rulesVersion: run.rulesVersion,
    startedAtMs: run.startedAtMs, achievedAtMs, outcomes, inputs: round.inputs.map(input => ({ ...input })), replayContext };
}

/** No team UUID conversion: the provider's personal account subject owns every run. */
export class PostgresRankedFreeThrowStore implements RankedPersistence {
  constructor(private readonly db: RankedSqlDatabase) {}

  async start(account: RankedAccount, config: ReadyRankedConfiguration): Promise<StartRunResult> {
    return this.db.transaction(async tx => {
      if ((await tx.execute(authorization(account))).rows.length !== 1) return { status: "unauthenticated" };
      // READ COMMITTED statements after the account lock see prior admissions.
      // A statement-wide CTE snapshot alone would not make count-then-insert safe.
      const now = millis((await tx.execute(clock)).rows[0]?.now_ms);
      const period = rankedPeriod(now, config.policy.calendar);
      if (now + config.policy.durationMs > period.endsAtMs) return { status: "week_closing" };
      await tx.execute(sql`UPDATE ranked_free_throw_runs SET state = 'expired'
        WHERE account_id = ${account.subject} AND state = 'open' AND expires_at_ms <= ${now}`);
      const active = await tx.execute(sql`SELECT id FROM ranked_free_throw_runs
        WHERE account_id = ${account.subject} AND state = 'open' LIMIT 1`);
      if (active.rows.length) return { status: "busy" };
      // Changing rule labels/configuration cannot reset this calendar-period admission count.
      const count = await tx.execute(sql`SELECT count(*)::integer AS count FROM ranked_free_throw_runs
        WHERE account_id = ${account.subject} AND started_at_ms >= ${period.startsAtMs} AND started_at_ms < ${period.endsAtMs}`);
      const used = count.rows[0]?.count;
      if (!safeInteger(used) || used < 0) throw new Error("ranked_state_unavailable");
      if (config.policy.maxRunsPerWeek !== null && used >= config.policy.maxRunsPerWeek) return { status: "quota" };
      const run: RankedRun = { id: randomUUID(), userId: account.subject, gameId: "free-throw", week: period.week,
        rulesVersion: config.rulesVersion, startedAtMs: now, expiresAtMs: now + config.policy.durationMs, state: "open", period };
      const inserted = await tx.execute(sql`INSERT INTO ranked_free_throw_runs
        (id, account_id, rules_version, rules, replay_context, week, week_starts_at_ms, week_ends_at_ms, started_at_ms, expires_at_ms, state)
        SELECT ${run.id}::uuid, a.id, ${run.rulesVersion}, ${JSON.stringify(config.policy)}::jsonb, ${JSON.stringify(rankedReplayContext(config.policy.engine))}::jsonb, ${run.week},
          ${period.startsAtMs}, ${period.endsAtMs}, ${run.startedAtMs}, ${run.expiresAtMs}, 'open'
        FROM auth_user a JOIN auth_session s ON s.user_id = a.id
        WHERE a.id = ${account.subject} AND s.id = ${account.sessionId}
          AND a.email_verified = true AND s.expires_at > clock_timestamp()
          AND floor(extract(epoch FROM clock_timestamp()) * 1000) < ${run.expiresAtMs}
        RETURNING id`);
      return inserted.rows.length === 1 ? { status: "created", run } : { status: "unauthenticated" };
    });
  }

  async readRun(account: RankedAccount, id: string): Promise<StoredRankedRun | null> {
    const result = await this.db.execute(sql`SELECT r.*, floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint AS now_ms
      FROM ranked_free_throw_runs r
      JOIN auth_user a ON a.id = r.account_id JOIN auth_session s ON s.user_id = a.id
      WHERE r.id = ${id}::uuid AND r.account_id = ${account.subject} AND s.id = ${account.sessionId}
        AND a.email_verified = true AND s.expires_at > clock_timestamp()`);
    const row = result.rows[0];
    if (!row) return null;
    return { nowMs: millis(row.now_ms), ...metadata(row) };
  }

  async consume(account: RankedAccount, run: RankedRun, round: ValidatedRound): Promise<RankedScore | null> {
    const stats = summarizeOutcomes(round.outcomes), score = stats.score;
    if (stats.attempts === 0 || stats.attempts !== round.inputs.length || JSON.stringify(stats) !== JSON.stringify(round.statistics)) throw new Error("invalid_ranked_score");
    return this.db.transaction(async tx => {
      if ((await tx.execute(authorization(account))).rows.length !== 1) return null;
      const locked = await tx.execute(sql`SELECT id FROM ranked_free_throw_runs
        WHERE id = ${run.id}::uuid AND account_id = ${account.subject} FOR UPDATE`);
      if (locked.rows.length !== 1) return null;
      // Read the clock after acquiring both locks. A pre-lock timestamp could
      // otherwise admit a run that expired while waiting. Insert errors roll
      // back the state transition; UNIQUE(run_id) is an additional invariant.
      const result = await tx.execute(sql`WITH moment AS MATERIALIZED (
        SELECT floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint AS now_ms
      ), consumed AS (
        UPDATE ranked_free_throw_runs r SET state = 'consumed', consumed_at_ms = moment.now_ms
        FROM moment
        WHERE r.id = ${run.id}::uuid AND r.account_id = ${account.subject} AND r.state = 'open'
          AND r.rules_version = ${run.rulesVersion} AND r.week = ${run.week}
          AND r.replay_context = ${JSON.stringify(round.replayContext)}::jsonb
          AND r.started_at_ms = ${run.startedAtMs} AND r.expires_at_ms = ${run.expiresAtMs}
          AND r.week_starts_at_ms = ${run.period.startsAtMs} AND r.week_ends_at_ms = ${run.period.endsAtMs}
          AND r.started_at_ms <= moment.now_ms AND moment.now_ms < r.expires_at_ms
          AND r.week_starts_at_ms <= moment.now_ms AND moment.now_ms < r.week_ends_at_ms
          AND ${score} <= (r.rules ->> 'shots')::integer
          AND ${round.outcomes.length} = (r.rules ->> 'shots')::integer
          AND EXISTS (SELECT 1 FROM auth_session s JOIN auth_user a ON a.id = s.user_id
            WHERE a.id = ${account.subject} AND s.id = ${account.sessionId}
              AND a.email_verified = true AND s.expires_at > clock_timestamp())
        RETURNING r.id, r.consumed_at_ms
      ) INSERT INTO ranked_free_throw_scores (run_id, score, outcomes, shot_inputs, achieved_at_ms)
        SELECT id, ${score}, ${round.outcomes.join("")}, ${JSON.stringify(round.inputs)}::jsonb, consumed_at_ms FROM consumed
        RETURNING id AS score_id, run_id, score, outcomes, achieved_at_ms`);
      const row = result.rows[0];
      if (!row) return null;
      return completedScore(row, run, round.replayContext, round);
    });
  }

  async result(account: RankedAccount, runId: string): Promise<RankedScore | null> {
    const result = await this.db.execute(sql`SELECT r.*, s.id AS score_id, s.run_id, s.score, s.outcomes, s.shot_inputs, s.achieved_at_ms
      FROM ranked_free_throw_scores s JOIN ranked_free_throw_runs r ON r.id = s.run_id
      JOIN auth_user a ON a.id = r.account_id JOIN auth_session session ON session.user_id = a.id
      WHERE r.id = ${runId}::uuid AND r.account_id = ${account.subject} AND r.state = 'consumed'
        AND session.id = ${account.sessionId} AND session.expires_at > clock_timestamp() AND a.email_verified = true`);
    const row = result.rows[0];
    if (!row) return null;
    const { run, policy, replayContext } = metadata(row);
    let round: ValidatedRound | null = null;
    const checked = validateScoreSubmission({ runId, shots: row.shot_inputs }, account.subject, { ...run, state: "open" },
      { enabled: true, version: run.rulesVersion, maxEvents: policy.shots, maxDurationMs: policy.durationMs,
        minShotIntervalMs: policy.minShotIntervalMs, maxScore: policy.shots }, millis(row.achieved_at_ms), shots => {
        round = replayRankedRound(shots, millis(row.achieved_at_ms) - run.startedAtMs, policy, replayContext); return round.statistics.score;
      });
    if (!checked.ok || !round) throw new Error("ranked_state_unavailable");
    return completedScore(row, run, replayContext, round);
  }

  async leaderboard(config: ReadyRankedConfiguration, scope: RankedScope, viewer: string | null, limit: number): Promise<{ period: RankedPeriod; entries: RankedLeaderboardEntry[] }> {
    if ((scope !== "everyone" && scope !== "league") || !safeInteger(limit) || limit < 1 || limit > 100) throw new Error("invalid_leaderboard_request");
    const now = millis((await this.db.execute(clock)).rows[0]?.now_ms);
    const period = rankedPeriod(now, config.policy.calendar);
    const membership = sql`LEFT JOIN account_identities i ON i.subject = r.account_id AND i.active = true
      LEFT JOIN site_users u ON u.id = i.user_id AND u.team_id ~ '^(?:[1-9]|10)$'`;
    const result = await this.db.execute(sql`WITH best AS (
        SELECT DISTINCT ON (r.account_id) s.id, s.score, s.outcomes, s.achieved_at_ms,
          CASE WHEN a.name ~ '^[a-z0-9_]{3,20}$' THEN a.name ELSE NULL END AS username,
          u.team_id, (r.account_id = ${viewer}) AS is_current_user
        FROM ranked_free_throw_scores s JOIN ranked_free_throw_runs r ON r.id = s.run_id
        JOIN auth_user a ON a.id = r.account_id ${membership}
        WHERE r.rules_version = ${config.rulesVersion} AND r.week = ${period.week}
          AND r.week_starts_at_ms = ${period.startsAtMs} AND r.week_ends_at_ms = ${period.endsAtMs}
          AND r.state = 'consumed' ${scope === "league" ? sql`AND u.id IS NOT NULL` : sql``}
        ORDER BY r.account_id, s.score DESC, s.achieved_at_ms ASC, s.id ASC
      ) SELECT row_number() OVER (ORDER BY score DESC, achieved_at_ms ASC, id ASC)::integer AS rank,
        score, outcomes, achieved_at_ms, username, team_id, is_current_user
      FROM best ORDER BY score DESC, achieved_at_ms ASC, id ASC LIMIT ${limit}`);
    const entries: RankedLeaderboardEntry[] = result.rows.map(row => {
      if (!safeInteger(row.rank) || row.rank < 1 || !safeInteger(row.score) || row.score < 0 || row.score > config.policy.shots) throw new Error("ranked_state_unavailable");
      const stats = summarizeOutcomes(persistedOutcomes(row.outcomes));
      if (stats.attempts !== config.policy.shots || stats.score !== row.score) throw new Error("ranked_state_unavailable");
      const teamId = row.team_id === null ? null : typeof row.team_id === "string" && /^(?:[1-9]|10)$/.test(row.team_id) ? row.team_id : undefined;
      if (teamId === undefined || (scope === "league" && teamId === null)) throw new Error("ranked_state_unavailable");
      return { ...stats, rank: row.rank, achievedAtMs: millis(row.achieved_at_ms),
        username: parseAccountUsername(row.username) ?? "Player", teamId,
        isCurrentUser: row.is_current_user === true };
    });
    return { period, entries };
  }
}
