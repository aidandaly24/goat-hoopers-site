import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { parseAccountUsername } from "@/domain/friends-accounts";
import { periodPhase, type CompetitionBoard, type CompetitionPeriod, type PeriodRecord } from "@/domain/arcade/competition-period";
import { choiceGameId, parseChoiceAssessment, parseChoiceChallenge, parseChoicePolicy, publicChoiceStep, validateChoiceInput,
  type ChoiceAssessment, type ChoiceBoardEntry, type ChoiceGameId, type ChoiceRunView, type LockedChoice } from "@/domain/arcade/ranked-game-contract";
import type { RankedAccount, RankedScope } from "@/domain/arcade/ranked-free-throw";
import type { RankedSqlClient, RankedSqlDatabase } from "../ranked-free-throw/store";
import type { PeriodGamePersistence } from "../arcade-competition/store";
import { choiceRulesVersion, manifestHash, type ChoiceAdapter } from "./adapter";

const number = (v: unknown) => { const n = typeof v === "string" && /^\d+$/.test(v) ? Number(v) : v;
  if (typeof n !== "number" || !Number.isSafeInteger(n) || n < 0) throw new Error("invalid_choice_state"); return n; };
const clock = async (tx: RankedSqlClient) => number((await tx.execute(sql`SELECT floor(extract(epoch FROM clock_timestamp())*1000)::bigint AS now_ms`)).rows[0]?.now_ms);
const authorization = (a: RankedAccount) => sql`SELECT u.id FROM auth_user u JOIN auth_session s ON s.user_id=u.id
  WHERE u.id=${a.subject} AND s.id=${a.sessionId} AND u.email_verified=true AND s.expires_at>clock_timestamp() FOR UPDATE OF u,s`;
function period(row: Record<string, unknown>): PeriodRecord {
  const p = row.definition as CompetitionPeriod;
  if (!p || p.id !== row.id || p.gameId !== row.game_id) throw new Error("invalid_choice_period");
  return { ...p, receipt: row.receipt as PeriodRecord["receipt"], scoreVersion: String(row.score_version),
    closedAtMs: row.closed_at_ms == null ? null : number(row.closed_at_ms), finalizedAtMs: row.finalized_at_ms == null ? null : number(row.finalized_at_ms) };
}
const open = (p: PeriodRecord, all: PeriodRecord[], now: number) => periodPhase(p, now, p.predecessorId === null || all.some(old => old.id === p.predecessorId && old.finalizedAtMs !== null)) === "open";
function saved(row: Record<string, unknown>) {
  const challenge = parseChoiceChallenge(row.manifest), policy = parseChoicePolicy(row.policy), choices = row.choices as LockedChoice[];
  if (!challenge || !policy || !Array.isArray(choices) || choices.length > 5 || challenge.gameId !== row.game_id ||
    challenge.formatVersion !== row.format_version || manifestHash(challenge) !== row.manifest_hash ||
    choiceRulesVersion({ gameId: challenge.gameId, formatVersion: challenge.formatVersion, policy }) !== row.rules_version ||
    choices.some((c, i) => !c || c.index !== i || validateChoiceInput(challenge, choices.slice(0, i), c.index, c.input).status !== "accepted") ||
    !["open", "completed", "expired"].includes(String(row.state)) || row.state === "completed" && choices.length !== 5 || row.state === "open" && choices.length === 5 ||
    number(row.expires_at_ms) - number(row.started_at_ms) !== policy.durationMs) throw new Error("invalid_choice_state");
  return { challenge, policy, choices };
}
export type ChoiceMutation = { status: "created" | "accepted" | "duplicate" | "completed"; run: ChoiceRunView }
  | { status: "unauthenticated" | "held" | "quota" | "not_found" | "expired" | "invalid_input" | "conflict" | "unavailable" };

/** Period -> account/session -> run lock order matches the canonical finalizer.
 * All timestamps used for authority are DB clocks read AFTER lock waits. */
export class PostgresChoiceStore {
  constructor(private readonly db: RankedSqlDatabase) {}
  private async periods(tx: RankedSqlClient, lock = false) {
    const rows = (await tx.execute(sql`SELECT * FROM arcade_competition_periods ORDER BY ordinal ${lock ? sql`FOR SHARE` : sql``}`)).rows;
    if (rows.length > 60) throw new Error("invalid_choice_calendar");
    return { rows, all: rows.map(period) };
  }
  private async view(tx: RankedSqlClient, row: Record<string, unknown>): Promise<ChoiceRunView> {
    const { challenge, choices } = saved(row), now = await clock(tx);
    const result = (await tx.execute(sql`SELECT id,score,assessment,achieved_at_ms FROM arcade_choice_results WHERE run_id=${String(row.id)}::uuid`)).rows[0];
    const assessment = result ? parseChoiceAssessment(result.assessment, challenge) : null;
    if ((row.state === "completed") !== !!result || result && (!assessment ||
      (assessment.status === "scored" ? result.score !== assessment.result.score : result.score !== null) ||
      number(result.achieved_at_ms) < number(row.started_at_ms) || number(result.achieved_at_ms) >= number(row.expires_at_ms))) throw new Error("invalid_choice_completion");
    const state = row.state === "completed" ? "completed" : row.state === "expired" || now >= number(row.expires_at_ms) ? "expired" : "open";
    return { id: String(row.id), gameId: challenge.gameId, periodId: String(row.period_id), formatVersion: challenge.formatVersion,
      startedAtMs: number(row.started_at_ms), expiresAtMs: number(row.expires_at_ms), asOfMs: now, state,
      choices, step: state === "open" ? publicChoiceStep(challenge, choices.length) : null,
      basis: { provider: challenge.source.provider, season: challenge.source.season, version: challenge.source.version, observedAtMs: challenge.source.observedAtMs, contentHash: challenge.source.contentHash },
      reveals: challenge.gameId === "priced-in" ? challenge.rounds.slice(0, choices.length).map((r, index) => ({ index, playerId: r.playerId, answerCents: r.answerCents })) : [],
      completion: result && assessment ? { ...assessment, id: String(result.id), achievedAtMs: number(result.achieved_at_ms) } : null };
  }
  async start(a: RankedAccount, adapter: ChoiceAdapter, value: unknown): Promise<ChoiceMutation> {
    const challenge = parseChoiceChallenge(value), rulesVersion = choiceRulesVersion(adapter);
    if (!challenge || challenge.gameId !== adapter.gameId || challenge.formatVersion !== adapter.formatVersion) return { status: "unavailable" };
    return this.db.transaction(async tx => {
      const { all, rows } = await this.periods(tx, true), p = all.find(p => p.finalizedAtMs === null), frozen = rows.find(r => r.id === p?.id);
      if (!p || p.gameId !== adapter.gameId || p.formatVersion !== adapter.formatVersion || frozen?.rules_version !== rulesVersion) return { status: "held" };
      if (!(await tx.execute(authorization(a))).rows.length) return { status: "unauthenticated" };
      let now = await clock(tx);
      if (!open(p, all, now)) return { status: "held" };
      await tx.execute(sql`UPDATE arcade_choice_runs SET state='expired' WHERE account_id=${a.subject} AND game_id=${adapter.gameId} AND state='open' AND expires_at_ms<=${now}`);
      const active = (await tx.execute(sql`SELECT * FROM arcade_choice_runs WHERE account_id=${a.subject} AND game_id=${adapter.gameId} AND state='open' LIMIT 1 FOR UPDATE`)).rows[0];
      now = await clock(tx);
      if (!open(p, all, now)) return { status: "held" };
      if (!(await tx.execute(authorization(a))).rows.length) return { status: "unauthenticated" };
      if (active) return active.period_id === p.id && active.rules_version === rulesVersion ? { status: "created", run: await this.view(tx, active) } : { status: "held" };
      if (challenge.source.observedAtMs > now || now - challenge.source.observedAtMs > adapter.policy.sourceMaxAgeMs) return { status: "unavailable" };
      if (adapter.policy.maxRunsPerPeriod !== null) {
        const count = number((await tx.execute(sql`SELECT count(*)::integer AS count FROM arcade_choice_runs WHERE account_id=${a.subject} AND period_id=${p.id}`)).rows[0]?.count);
        if (count >= adapter.policy.maxRunsPerPeriod) return { status: "quota" };
      }
      const row = (await tx.execute(sql`INSERT INTO arcade_choice_runs(id,account_id,period_id,game_id,rules_version,format_version,policy,manifest,manifest_hash,started_at_ms,expires_at_ms)
        SELECT ${randomUUID()}::uuid,${a.subject},${p.id},${adapter.gameId},${rulesVersion},${adapter.formatVersion},${JSON.stringify(adapter.policy)}::jsonb,
          ${JSON.stringify(challenge)}::jsonb,${manifestHash(challenge)},${now},${now + adapter.policy.durationMs}
        WHERE EXISTS(SELECT 1 FROM auth_session s JOIN auth_user u ON u.id=s.user_id WHERE u.id=${a.subject} AND s.id=${a.sessionId} AND u.email_verified=true AND s.expires_at>clock_timestamp())
          AND floor(extract(epoch FROM clock_timestamp())*1000)<${now + adapter.policy.durationMs}
          AND floor(extract(epoch FROM clock_timestamp())*1000)-${p.receipt!.checkedAtMs}<=600000 RETURNING *`)).rows[0];
      return row ? { status: "created", run: await this.view(tx, row) } : { status: "held" };
    });
  }
  async read(a: RankedAccount, id: string, gameId: ChoiceGameId): Promise<ChoiceRunView | null> {
    const row = (await this.db.execute(sql`SELECT r.* FROM arcade_choice_runs r JOIN auth_user u ON u.id=r.account_id JOIN auth_session s ON s.user_id=u.id
      WHERE r.id=${id}::uuid AND r.account_id=${a.subject} AND r.game_id=${gameId} AND s.id=${a.sessionId} AND u.email_verified=true AND s.expires_at>clock_timestamp()`)).rows[0];
    return row ? this.view(this.db, row) : null;
  }
  async choose(a: RankedAccount, adapter: ChoiceAdapter, id: string, index: unknown, input: unknown): Promise<ChoiceMutation> {
    return this.db.transaction(async tx => {
      const { all, rows } = await this.periods(tx, true);
      if (!(await tx.execute(authorization(a))).rows.length) return { status: "unauthenticated" };
      const row = (await tx.execute(sql`SELECT * FROM arcade_choice_runs WHERE id=${id}::uuid AND account_id=${a.subject} AND game_id=${adapter.gameId} FOR UPDATE`)).rows[0];
      if (!row) return { status: "not_found" };
      if (!(await tx.execute(authorization(a))).rows.length) return { status: "unauthenticated" };
      const { challenge, choices } = saved(row), checked = validateChoiceInput(challenge, choices, index, input);
      if (checked.status === "invalid") return { status: "invalid_input" };
      if (checked.status === "conflict") return { status: "conflict" };
      // Lost-response retry survives closure, expiry, and a later configured version.
      if (checked.status === "duplicate") return { status: "duplicate", run: await this.view(tx, row) };
      const p = all.find(p => p.id === row.period_id), frozen = rows.find(r => r.id === row.period_id);
      let now = await clock(tx);
      if (row.state !== "open" || now >= number(row.expires_at_ms)) return { status: "expired" };
      if (!p || p.gameId !== adapter.gameId || p.formatVersion !== adapter.formatVersion || row.rules_version !== choiceRulesVersion(adapter) || frozen?.rules_version !== row.rules_version || !open(p, all, now)) return { status: "held" };
      const next = [...choices, checked.choice];
      const assessment: ChoiceAssessment | null = next.length === 5 ? parseChoiceAssessment(adapter.assess(challenge, next), challenge) : null;
      if (next.length === 5 && !assessment) throw new Error("invalid_choice_grader");
      // Even a slow synchronous grader cannot cross expiry/freshness/session bounds.
      now = await clock(tx);
      if (now >= number(row.expires_at_ms)) return { status: "expired" };
      if (!open(p, all, now)) return { status: "held" };
      if (!(await tx.execute(authorization(a))).rows.length) return { status: "unauthenticated" };
      const updated = (await tx.execute(sql`UPDATE arcade_choice_runs SET choices=${JSON.stringify(next)}::jsonb,state=${assessment ? "completed" : "open"} WHERE id=${id}::uuid
        AND floor(extract(epoch FROM clock_timestamp())*1000)<expires_at_ms
        AND floor(extract(epoch FROM clock_timestamp())*1000)-${p.receipt!.checkedAtMs}<=600000
        AND EXISTS(SELECT 1 FROM auth_session s JOIN auth_user u ON u.id=s.user_id WHERE u.id=${a.subject} AND s.id=${a.sessionId} AND u.email_verified=true AND s.expires_at>clock_timestamp()) RETURNING *`)).rows[0];
      if (!updated) return { status: "held" };
      if (assessment) await tx.execute(sql`INSERT INTO arcade_choice_results(run_id,score,assessment,achieved_at_ms)
        VALUES(${id}::uuid,${assessment.status === "scored" ? assessment.result.score : null},${JSON.stringify(assessment)}::jsonb,${now})`);
      return { status: assessment ? "completed" : "accepted", run: await this.view(tx, updated) };
    });
  }
  handler(adapter: ChoiceAdapter): PeriodGamePersistence {
    return { gameId: adapter.gameId,
      versions: p => p.gameId === adapter.gameId && p.formatVersion === adapter.formatVersion ? { rulesVersion: choiceRulesVersion(adapter), scoreVersion: adapter.formatVersion } : null,
      seal: async (tx, p) => {
        await tx.execute(sql`INSERT INTO arcade_choice_weekly_results(period_id,account_id,rank,result_id,score,assessment,achieved_at_ms,username_at_final,team_id)
          SELECT ${p.id},account_id,row_number() OVER(ORDER BY score DESC,achieved_at_ms,id),id,score,assessment,achieved_at_ms,username,team_id FROM (
            SELECT DISTINCT ON(r.account_id) r.account_id,s.*,u.name AS username,t.team_id FROM arcade_choice_results s JOIN arcade_choice_runs r ON r.id=s.run_id
            JOIN auth_user u ON u.id=r.account_id LEFT JOIN account_identities i ON i.subject=r.account_id AND i.active=true
            LEFT JOIN site_users t ON t.id=i.user_id AND t.team_id~'^(?:[1-9]|10)$'
            WHERE r.period_id=${p.id} AND r.game_id=${adapter.gameId} AND r.format_version=${adapter.formatVersion} AND r.state='completed' AND s.score IS NOT NULL
            ORDER BY r.account_id,s.score DESC,s.achieved_at_ms,s.id
          ) best ON CONFLICT(period_id,account_id) DO NOTHING`);
        await tx.execute(sql`UPDATE arcade_choice_runs SET state='expired' WHERE period_id=${p.id} AND state='open'`);
      } };
  }
  async board(kind: CompetitionBoard["kind"], p: PeriodRecord | null, gameId: ChoiceGameId, format: string, viewer: string | null, scope: RankedScope, limit = 50): Promise<CompetitionBoard> {
    if (!["everyone", "league"].includes(scope) || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !/^[a-f0-9]{64}$/.test(format) || !choiceGameId(gameId)) throw new Error("invalid_board_query");
    const sealed = p?.finalizedAtMs != null, version = sealed && kind !== "all-time" ? p.scoreVersion! : format;
    const final = kind === "archive" || kind === "weekly" && sealed;
    const selected = final ? sql`SELECT f.result_id AS id,f.account_id,f.score,f.assessment,f.achieved_at_ms,COALESCE(u.name,f.username_at_final) AS username,f.team_id
      FROM arcade_choice_weekly_results f LEFT JOIN auth_user u ON u.id=f.account_id WHERE f.period_id=${p?.id ?? null}
        ${scope === "league" ? sql`AND f.team_id IS NOT NULL` : sql``}`
      : sql`SELECT DISTINCT ON(r.account_id) s.id,r.account_id,s.score,s.assessment,s.achieved_at_ms,u.name AS username,t.team_id
        FROM arcade_choice_results s JOIN arcade_choice_runs r ON r.id=s.run_id JOIN auth_user u ON u.id=r.account_id
        LEFT JOIN account_identities i ON i.subject=r.account_id AND i.active=true LEFT JOIN site_users t ON t.id=i.user_id AND t.team_id~'^(?:[1-9]|10)$'
        WHERE r.game_id=${gameId} AND r.format_version=${version} AND r.state='completed' AND s.score IS NOT NULL
          ${kind === "weekly" ? sql`AND r.period_id=${p?.id ?? null}` : sql``} ${scope === "league" ? sql`AND t.id IS NOT NULL` : sql``}
        ORDER BY r.account_id,s.score DESC,s.achieved_at_ms,s.id`;
    const rows = (await this.db.execute(sql`WITH best AS (${selected}) SELECT *,row_number() OVER(ORDER BY score DESC,achieved_at_ms,id)::integer AS rank,
      (account_id=${viewer}) AS is_current_user FROM best ORDER BY score DESC,achieved_at_ms,id LIMIT ${limit}`)).rows;
    const entries: ChoiceBoardEntry[] = rows.map(r => {
      const raw = r.assessment as { result?: { sourceHash?: unknown } };
      const assessment = parseChoiceAssessment(raw, { gameId, formatVersion: version, source: { contentHash: String(raw?.result?.sourceHash ?? "") } });
      if (!assessment || assessment.status !== "scored" || assessment.result.score !== r.score) throw new Error("invalid_choice_board");
      return { rank: number(r.rank), username: parseAccountUsername(r.username) ?? "Player", teamId: r.team_id == null ? null : String(r.team_id),
        achievedAtMs: number(r.achieved_at_ms), isCurrentUser: r.is_current_user === true, score: assessment.result.score, metric: assessment.result.metric };
    });
    const { all } = await this.periods(this.db), now = await clock(this.db);
    return { gameId, kind, periodId: p?.id ?? null, label: kind === "all-time" ? "All-time · compatible scoring format" : p?.label ?? "Competition not configured",
      scoreVersion: version, asOfMs: now, phase: p ? periodPhase(p, now, p.predecessorId === null || all.some(old => old.id === p.predecessorId && old.finalizedAtMs !== null)) : "held", entries };
  }
}
