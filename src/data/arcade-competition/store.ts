import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { PostgresRankedFreeThrowStore, type RankedSqlClient, type RankedSqlDatabase, type ReadyRankedConfiguration, type StartRunResult } from "../ranked-free-throw/store";
import { rankedReplayContext, summarizeOutcomes, decodeOutcomes, type RankedAccount, type RankedRun, type RankedScope, type ValidatedRound, type RankedLeaderboardEntry, type RankedScore } from "@/domain/arcade/ranked-free-throw";
import { canFinalize, periodPhase, runPeriod, type CompetitionPeriod, type PeriodRecord, type FinalityReceipt, type CompetitionBoard, type CompetitionArchive } from "@/domain/arcade/competition-period";
import { scoreFormatVersion } from "./config";
import { reconcileWindowOpen, type ReconcileWindow } from "@/domain/arcade/reconcile-window";

const time = (v: unknown) => { if (v === null || v === undefined || v === "") throw new Error("invalid_database_clock"); const n = Number(v); if (!Number.isSafeInteger(n) || n < 0) throw new Error("invalid_database_clock"); return n; };
const clock = async (db: RankedSqlClient) => time((await db.execute(sql`SELECT floor(extract(epoch FROM clock_timestamp())*1000)::bigint AS now_ms`)).rows[0]?.now_ms);
async function checkExecutionWindow(tx: RankedSqlClient, window: ReconcileWindow | undefined) {
  if (window && !reconcileWindowOpen(window, await clock(tx))) throw new Error("reconcile_window_closed");
}
function decode(row: Record<string, unknown>): PeriodRecord {
  const spec = row.definition as CompetitionPeriod;
  if (!spec || spec.id !== row.id) throw new Error("invalid_period");
  return { ...spec, scoreVersion: String(row.score_version), receipt: row.receipt as FinalityReceipt | null, closedAtMs: row.closed_at_ms == null ? null : time(row.closed_at_ms),
    finalizedAtMs: row.finalized_at_ms == null ? null : time(row.finalized_at_ms) };
}
function selected(periods: PeriodRecord[]) { return periods.find(p => p.finalizedAtMs === null) ?? periods.at(-1) ?? null; }
const allowed = (p: PeriodRecord, periods: PeriodRecord[], now: number) => periodPhase(p, now,
  p.predecessorId === null || periods.some(old => old.id === p.predecessorId && old.finalizedAtMs !== null)) === "open";
const authorize = (a: RankedAccount) => sql`SELECT u.id FROM auth_user u JOIN auth_session s ON s.user_id=u.id
  WHERE u.id=${a.subject} AND s.id=${a.sessionId} AND u.email_verified=true AND s.expires_at>clock_timestamp() FOR UPDATE OF u,s`;
const CONFLICTING_OBSERVATIONS = "Conflicting publisher observations at the same timestamp";
const sameObservation = (a: FinalityReceipt, b: FinalityReceipt) => a.source === b.source &&
  Object.keys(a.states).length === Object.keys(b.states).length && Object.keys(a.states).every(id => a.states[id] === b.states[id]);

/** Canonical period locks are acquired before account/run locks, including finalization. */
export class ArcadeCompetitionStore extends PostgresRankedFreeThrowStore {
  constructor(private readonly database: RankedSqlDatabase) { super(database); }
  private async records(db: RankedSqlClient, lock = false) {
    return (await db.execute(sql`SELECT * FROM arcade_competition_periods ORDER BY ordinal ${lock ? sql`FOR SHARE` : sql``}`)).rows.map(decode);
  }
  async start(account: RankedAccount, config: ReadyRankedConfiguration): Promise<StartRunResult> {
    return this.database.transaction(async tx => {
      const periods = await this.records(tx, true), p = selected(periods);
      if (!p || !allowed(p, periods, await clock(tx))) return { status: "week_closing" };
      const frozen = (await tx.execute(sql`SELECT rules_version FROM arcade_competition_periods WHERE id=${p.id}`)).rows[0];
      if (frozen?.rules_version !== config.rulesVersion) throw new Error("period_policy_mismatch");
      if ((await tx.execute(authorize(account))).rows.length !== 1) return { status: "unauthenticated" };
      const now = await clock(tx);
      if (!allowed(p, periods, now)) return { status: "week_closing" };
      await tx.execute(sql`UPDATE ranked_free_throw_runs SET state='expired' WHERE account_id=${account.subject} AND state='open' AND expires_at_ms<=${now}`);
      if ((await tx.execute(sql`SELECT id FROM ranked_free_throw_runs WHERE account_id=${account.subject} AND state='open' LIMIT 1`)).rows.length) return { status: "busy" };
      if (config.policy.maxRunsPerWeek !== null) {
        const n = Number((await tx.execute(sql`SELECT count(*)::integer AS count FROM ranked_free_throw_runs WHERE account_id=${account.subject} AND period_id=${p.id}`)).rows[0]?.count);
        if (!Number.isSafeInteger(n)) throw new Error("invalid_admission_count");
        if (n >= config.policy.maxRunsPerWeek) return { status: "quota" };
      }
      const run: RankedRun = { id: randomUUID(), userId: account.subject, gameId: "free-throw", week: p.week, rulesVersion: config.rulesVersion,
        startedAtMs: now, expiresAtMs: now + config.policy.durationMs, state: "open", period: runPeriod(p) };
      const result = await tx.execute(sql`INSERT INTO ranked_free_throw_runs
        (id,account_id,period_id,rules_version,rules,replay_context,week,week_starts_at_ms,week_ends_at_ms,started_at_ms,expires_at_ms,state)
        SELECT ${run.id}::uuid,u.id,${p.id},${run.rulesVersion},${JSON.stringify(config.policy)}::jsonb,${JSON.stringify(rankedReplayContext(config.policy.engine))}::jsonb,
          ${p.week},${p.opensAtMs},NULL,${now},${run.expiresAtMs},'open'
        FROM auth_user u JOIN auth_session s ON s.user_id=u.id WHERE u.id=${account.subject} AND s.id=${account.sessionId}
          AND u.email_verified=true AND s.expires_at>clock_timestamp() AND floor(extract(epoch FROM clock_timestamp())*1000)<${run.expiresAtMs} RETURNING id`);
      return result.rows.length ? { status: "created", run } : { status: "unauthenticated" };
    });
  }
  async consume(account: RankedAccount, run: RankedRun, round: ValidatedRound): Promise<RankedScore | null> {
    return this.database.transaction(async tx => {
      const periods = await this.records(tx, true), p = periods.find(p => p.id === run.period.id), now = await clock(tx);
      if (!p || !allowed(p, periods, now) || now >= run.expiresAtMs) return null;
      if ((await tx.execute(authorize(account))).rows.length !== 1) return null;
      if (!(await tx.execute(sql`SELECT id FROM ranked_free_throw_runs WHERE id=${run.id}::uuid AND account_id=${account.subject} FOR UPDATE`)).rows.length) return null;
      // Clock is checked again after every lock wait; failure rolls back consumption and insertion together.
      const result = await tx.execute(sql`WITH moment AS MATERIALIZED (SELECT floor(extract(epoch FROM clock_timestamp())*1000)::bigint AS now_ms), consumed AS (
        UPDATE ranked_free_throw_runs r SET state='consumed',consumed_at_ms=moment.now_ms FROM moment
        WHERE r.id=${run.id}::uuid AND r.account_id=${account.subject} AND r.period_id=${p.id} AND r.state='open'
          AND r.rules_version=${run.rulesVersion} AND r.replay_context=${JSON.stringify(round.replayContext)}::jsonb
          AND r.started_at_ms=${run.startedAtMs} AND r.expires_at_ms=${run.expiresAtMs} AND moment.now_ms<r.expires_at_ms
          AND ${round.outcomes.length}=(r.rules->>'shots')::integer AND ${round.statistics.score}<=${round.outcomes.length}
          AND EXISTS(SELECT 1 FROM arcade_competition_periods cp WHERE cp.id=r.period_id AND cp.closed_at_ms IS NULL
            AND cp.receipt IS NOT NULL AND (cp.receipt->>'checkedAtMs')::bigint<=moment.now_ms
            AND moment.now_ms-(cp.receipt->>'checkedAtMs')::bigint<=600000)
          AND EXISTS(SELECT 1 FROM auth_session s JOIN auth_user u ON u.id=s.user_id WHERE u.id=${account.subject}
            AND s.id=${account.sessionId} AND u.email_verified=true AND s.expires_at>clock_timestamp())
        RETURNING r.id,r.consumed_at_ms
      ) INSERT INTO ranked_free_throw_scores(run_id,score,outcomes,shot_inputs,achieved_at_ms)
        SELECT id,${round.statistics.score},${round.outcomes.join("")},${JSON.stringify(round.inputs)}::jsonb,consumed_at_ms FROM consumed
        RETURNING id,achieved_at_ms`);
      const row = result.rows[0];
      return row ? { ...summarizeOutcomes(round.outcomes), id: String(row.id), runId: run.id, gameId: "free-throw" as const,
        week: run.week, rulesVersion: run.rulesVersion, startedAtMs: run.startedAtMs, achievedAtMs: time(row.achieved_at_ms),
        outcomes: [...round.outcomes], inputs: [...round.inputs], replayContext: round.replayContext } : null;
    });
  }
  private async entries(db: RankedSqlClient, kind: "weekly" | "all-time" | "archive", periodId: string | null, scoreVersion: string, viewer: string | null, scope: RankedScope, limit: number) {
    const rows = kind === "archive" ? await db.execute(sql`SELECT row_number() OVER(ORDER BY f.rank)::integer AS rank,f.score,f.outcomes,f.achieved_at_ms,
      COALESCE(u.name,f.username_at_final) AS username,f.team_id,(f.account_id=${viewer}) AS is_current_user
      FROM arcade_weekly_results f LEFT JOIN auth_user u ON u.id=f.account_id WHERE f.period_id=${periodId}
        ${scope === "league" ? sql`AND f.team_id IS NOT NULL` : sql``} ORDER BY f.rank LIMIT ${limit}`)
      : await db.execute(sql`WITH best AS (SELECT DISTINCT ON(r.account_id) s.id,s.score,s.outcomes,s.achieved_at_ms,u.name AS username,
          t.team_id,(r.account_id=${viewer}) AS is_current_user
        FROM ranked_free_throw_scores s JOIN ranked_free_throw_runs r ON r.id=s.run_id
        JOIN arcade_competition_periods p ON p.id=r.period_id JOIN auth_user u ON u.id=r.account_id
        LEFT JOIN account_identities i ON i.subject=r.account_id AND i.active=true LEFT JOIN site_users t ON t.id=i.user_id AND t.team_id~'^(?:[1-9]|10)$'
        WHERE p.game_id='free-throw' AND p.score_version=${scoreVersion} AND r.state='consumed'
          ${kind === "weekly" ? sql`AND r.period_id=${periodId}` : sql``} ${scope === "league" ? sql`AND t.id IS NOT NULL` : sql``}
        ORDER BY r.account_id,s.score DESC,s.achieved_at_ms,s.id)
      SELECT row_number() OVER(ORDER BY score DESC,achieved_at_ms,id)::integer AS rank,* FROM best ORDER BY score DESC,achieved_at_ms,id LIMIT ${limit}`);
    return rows.rows.map(row => ({ ...summarizeOutcomes(decodeOutcomes(row.outcomes)), rank: Number(row.rank),
      username: typeof row.username === "string" && /^[a-z0-9_]{3,20}$/.test(row.username) ? row.username : "Player",
      teamId: row.team_id == null ? null : String(row.team_id), achievedAtMs: time(row.achieved_at_ms), isCurrentUser: row.is_current_user === true })) satisfies RankedLeaderboardEntry[];
  }
  async leaderboard(config: ReadyRankedConfiguration, scope: RankedScope, viewer: string | null, limit: number) {
    const board = await this.board("weekly", null, config, viewer, scope, limit);
    const records = await this.records(this.database), p = records.find(p => p.id === board.periodId);
    if (!p) throw new Error("calendar_unavailable");
    return { period: runPeriod(p), entries: board.entries };
  }
  async board(kind: "weekly" | "all-time" | "archive", periodId: string | null, config: ReadyRankedConfiguration, viewer: string | null, scope: RankedScope = "everyone", limit = 50): Promise<CompetitionBoard> {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !["everyone", "league"].includes(scope)) throw new Error("invalid_board_query");
    const records = await this.records(this.database), now = await clock(this.database), p = kind === "archive" ? records.find(p => p.id === periodId && p.finalizedAtMs !== null) : selected(records);
    const sealed = !!p && p.finalizedAtMs !== null;
    const readKind = kind === "weekly" && sealed ? "archive" : kind;
    const version = readKind === "archive" && p?.scoreVersion ? p.scoreVersion : scoreFormatVersion(config.policy);
    if (!p && kind !== "all-time") return { gameId: "free-throw", kind, label: "Competition not configured", phase: "held", asOfMs: now, periodId: null, scoreVersion: version, entries: [] };
    return { gameId: "free-throw", kind, label: kind === "all-time" ? `All-time · ${config.policy.shots} shots / ${config.policy.durationMs / 1000}s format` : p!.label,
      phase: p ? periodPhase(p, now, p.predecessorId === null || records.some(old => old.id === p.predecessorId && old.finalizedAtMs !== null)) : "held",
      asOfMs: now, periodId: p?.id ?? null, scoreVersion: version,
      entries: await this.entries(this.database, readKind, p?.id ?? null, version, viewer, scope, limit) };
  }
  async archives(): Promise<CompetitionArchive[]> {
    return (await this.records(this.database)).filter(p => p.finalizedAtMs !== null).map(p => ({ id: p.id, gameId: p.gameId, label: p.label,
      closedAtMs: p.closedAtMs!, finalizedAtMs: p.finalizedAtMs! }));
  }
  async reconcile(calendar: CompetitionPeriod[], config: ReadyRankedConfiguration, receipts: ReadonlyMap<string, FinalityReceipt>, window?: ReconcileWindow) {
    return this.database.transaction(async tx => {
      // A transaction-level advisory lock serializes retries and first publication across worker instances.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(7042026)`);
      await checkExecutionWindow(tx, window);
      for (const p of calendar) await tx.execute(sql`INSERT INTO arcade_competition_periods(id,ordinal,game_id,definition,rules_version,score_version)
        VALUES(${p.id},${p.order},${p.gameId},${JSON.stringify(p)}::jsonb,${config.rulesVersion},${scoreFormatVersion(config.policy)}) ON CONFLICT(id) DO NOTHING`);
      const rows = (await tx.execute(sql`SELECT * FROM arcade_competition_periods ORDER BY ordinal FOR UPDATE`)).rows;
      const now = await clock(tx), finalized: string[] = [];
      for (const row of rows) {
        const p = decode(row), spec = calendar.find(s => s.id === p.id), receipt = receipts.get(p.id);
        if (p.finalizedAtMs !== null) continue;
        if (!spec || p.fixtures.length !== spec.fixtures.length || p.fixtures.some(f => !spec.fixtures.some(s => s.id === f.id && s.date === f.date && s.startsAtMs === f.startsAtMs)) ||
          p.opensAtMs !== spec.opensAtMs || p.calendarVersion !== spec.calendarVersion || p.calendarSource !== spec.calendarSource ||
          p.predecessorId !== spec.predecessorId || p.order !== spec.order || p.week !== spec.week || p.label !== spec.label ||
          p.gameId !== spec.gameId || row.rules_version !== config.rulesVersion) throw new Error("published_calendar_policy_changed");
        // Fetches occur before this lock. A slower older worker must not reopen
        // a period after a newer missing/postponed observation has blocked it.
        if (!receipt || receipt.checkedAtMs > now || now - receipt.checkedAtMs > 600000 ||
          p.receipt && receipt.checkedAtMs < p.receipt.checkedAtMs) continue;
        if (p.receipt && receipt.checkedAtMs === p.receipt.checkedAtMs) {
          if (sameObservation(p.receipt, receipt) || p.receipt.source === CONFLICTING_OBSERVATIONS) continue;
          const conflict: FinalityReceipt = { checkedAtMs: receipt.checkedAtMs, source: CONFLICTING_OBSERVATIONS,
            states: Object.fromEntries(p.fixtures.map(f => [f.id, "missing" as const])) };
          await tx.execute(sql`UPDATE arcade_competition_periods SET receipt=${JSON.stringify(conflict)}::jsonb WHERE id=${p.id} AND finalized_at_ms IS NULL`);
          continue; // A tie cannot choose the friendlier observation or seal a result.
        }
        await tx.execute(sql`UPDATE arcade_competition_periods SET receipt=${JSON.stringify(receipt)}::jsonb WHERE id=${p.id} AND finalized_at_ms IS NULL`);
        const prior = p.predecessorId === null || rows.some(old => old.id === p.predecessorId && old.finalized_at_ms != null) || finalized.includes(p.predecessorId);
        if (!prior) continue;
        if (!canFinalize(p, receipt, now)) continue;
        // Period FOR UPDATE waits for all save/admission FOR SHARE locks before the immutable snapshot.
        await tx.execute(sql`INSERT INTO arcade_weekly_results(period_id,account_id,rank,score_id,score,outcomes,achieved_at_ms,username_at_final,team_id)
          SELECT ${p.id},account_id,row_number() OVER(ORDER BY score DESC,achieved_at_ms,id),id,score,outcomes,achieved_at_ms,username,team_id FROM (
            SELECT DISTINCT ON(r.account_id) r.account_id,s.*,u.name AS username,t.team_id FROM ranked_free_throw_scores s
            JOIN ranked_free_throw_runs r ON r.id=s.run_id JOIN auth_user u ON u.id=r.account_id
            LEFT JOIN account_identities i ON i.subject=r.account_id AND i.active=true LEFT JOIN site_users t ON t.id=i.user_id AND t.team_id~'^(?:[1-9]|10)$'
            WHERE r.period_id=${p.id} AND r.state='consumed' ORDER BY r.account_id,s.score DESC,s.achieved_at_ms,s.id
          ) best ON CONFLICT(period_id,account_id) DO NOTHING`);
        // Unfinished rounds from the sealed period cannot hold the account's
        // one-open-run slot when the next period becomes eligible.
        await tx.execute(sql`UPDATE ranked_free_throw_runs SET state='expired' WHERE period_id=${p.id} AND state='open'`);
        await tx.execute(sql`UPDATE arcade_competition_periods SET closed_at_ms=${now},finalized_at_ms=${now} WHERE id=${p.id} AND finalized_at_ms IS NULL`);
        finalized.push(p.id);
      }
      // Roll the whole transaction back if authority expired during any lock
      // wait or write, rather than committing a partial publication/final.
      await checkExecutionWindow(tx, window);
      return finalized;
    });
  }
}
