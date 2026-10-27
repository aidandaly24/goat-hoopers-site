import "server-only";
import { randomUUID } from "node:crypto";
import { sql, type SQL } from "drizzle-orm";
import { getDb, type Db } from "../db";
import type { AiForecastCurrentPointer, AiForecastRevision, AiGenerationManifest, AiWeeklyInput, AiWeeklyOutcome, AiWeeklySlate } from "@/domain/ai-decider";
import { isRecord, uuidValid } from "./validation";
import { aiDataDeadline } from "./deadline";
import { refreshStorageKey, WEEK1_REFRESH_KEY, type AiWeek1RefreshPolicy } from "./refresh-policy";
import { cachedWeek } from "./weekly";

/** Shared spending, active-request and rolling burst guards; no ordinary cooldown. */
// Counter storage covers ten current managers plus one retained account generation.
export const AI_BUDGET = Object.freeze({ retainedUserCapacity: 20, userBurst: 20, burstMs: 60000, globalTokensDay: 100000, concurrent: 2, leaseMs: 60000, retentionMs: 7 * 86400000 });
export type AiLegacyIdentity = { kind: "legacy"; userId: string; tokenHash: string };
/** Only a secret-authenticated server cron may construct this fixed app principal. */
export type AiWeeklyJobIdentity = { kind: "weekly_job"; userId: string; auth: "legacy" | "friends" };
export type AiIdentity = AiLegacyIdentity | { kind: "friends"; userId: string; sessionId: string; subject: string } | AiWeeklyJobIdentity;
type UserCounter = { day: string; requests: number; hour: string; hourly: number; denied: number; signals: number; lastSeen: number; recent?: number[] };
export type AiBudgetState = {
  version: 1;
  day: string;
  requests: number;
  tokens: number;
  users: Record<string, UserCounter>;
  leases: { id: string; userId: string; fingerprint: string; expires: number; reserved: number; shared: boolean; completed?: true }[];
  /** Retained legacy entries expire normally; completed fingerprints no longer gate calls. */
  duplicates: { userId: string; fingerprint: string; expires: number; shared: boolean }[];
};
export type AiControl = { enabled: boolean; revision: number; state: AiBudgetState };
export type AiStoredWeek = { key: string; hash: string; manifest: AiGenerationManifest; input: AiWeeklyInput; slate: AiWeeklySlate; result: AiWeeklySlate | null; refreshed?: true };
/**
 * Outcome of a guarded current-pointer move (see markForecastCurrent):
 * "moved" — the pointer now names the target revision at the caller's
 * observation; "current" — it already named the target at a fresher
 * observation, so selection was already as asked and nothing was
 * written; "stale" — a strictly fresher observation of a DIFFERENT
 * revision is current and the move was refused; "missing" — no such
 * stored revision exists for the week and nothing was written.
 */
export type AiForecastMarkResult = "moved" | "current" | "stale" | "missing";
/** Purpose-built CAS and append-only operations, not a generic storage framework. */
export type AiPersistence = {
  readControl(): Promise<AiControl | null>;
  compareControl(revision: number, state: AiBudgetState, identity?: AiIdentity, disable?: boolean): Promise<boolean>;
  authorizeWeeklyOperator(identity: AiWeeklyJobIdentity): Promise<boolean>;
  sealWeek(week: AiStoredWeek): Promise<AiStoredWeek>;
  getWeek(key: string): Promise<AiStoredWeek | null>;
  getOriginalWeek(key: string): Promise<AiStoredWeek | null>;
  getWeekRefresh(): Promise<AiStoredWeek | null>;
  hasWeekRefresh(): Promise<boolean>;
  claimWeekRefresh(week: AiStoredWeek, identity: AiIdentity): Promise<boolean>;
  completeWeekRefresh(hash: string, slate: AiWeeklySlate, identity: AiIdentity): Promise<boolean>;
  completeWeek(key: string, hash: string, slate: AiWeeklySlate): Promise<boolean>;
  recordOutcome(key: string, outcome: AiWeeklyOutcome): Promise<boolean>;
  /** In-season forecast series (issue #149): append-only; false when this revision id or evidence hash is already stored for the week. Raw primitive — publication goes through publishForecast. */
  appendForecast(key: string, revision: AiForecastRevision): Promise<boolean>;
  getForecasts(key: string): Promise<AiForecastRevision[]>;
  getLatestForecast(key: string): Promise<AiForecastRevision | null>;
  /** The stored revision for one evidence state, looked up across the week's whole series (evidence can recur: A → B → A). */
  getForecastByEvidenceHash(key: string, evidenceHash: string): Promise<AiForecastRevision | null>;
  /**
   * Serialized publication: in ONE statement, appends this revision and
   * moves the week's current pointer to it — but only while the chain
   * head is still `revision.supersedes`, no revision for this evidence
   * state exists, and the move is not stale under the pointer's
   * monotonic observation rule (see markForecastCurrent: a writer whose
   * evidence was observed strictly before the current selection was
   * observed may not append over it or move the pointer). The
   * monotonic gate is enforced against the pointer row AS LOCKED by
   * this statement (SELECT … FOR UPDATE re-reads the newest committed
   * version after any wait, and the row lock is held to the statement's
   * end), never against a statement-snapshot read: a fresher selection
   * committed by a concurrent writer while this statement waited is
   * seen by the gate, and the pointer mutation itself carries the same
   * guard, re-checked against the latest row version. False means the
   * publication did not take as current selection (the chain moved, a
   * fork was refused, the evidence is already stored, or a strictly
   * fresher selection is already current): the caller re-reads and
   * converges or retries on the new head. One corner is deliberate: if
   * the week's pointer row is FIRST created, at a strictly fresher
   * observation, by a concurrent mark while this statement is in
   * flight (possible only before any publication has landed — service
   * publications create the pointer atomically with the genesis
   * append), the guarded mutation refuses and this returns false, but
   * the append may already stand as inert, never-selected history; the
   * caller converges on the fresher selection exactly as for any other
   * lost race. This store executes single statements (neon-http has
   * no interactive transactions), so the CAS is per-statement atomic and
   * the migration's unique chain indexes make a fork structurally
   * impossible even across statement snapshots.
   */
  publishForecast(key: string, revision: AiForecastRevision, observedAt: string): Promise<boolean>;
  /**
   * Re-observes an already-stored revision as the week's current
   * selection (the dedupe hit that appends nothing), under the
   * MONOTONIC OBSERVATION RULE: the pointer records the evidence
   * observedAt of the refresh that set it, and a move applies only when
   * the incoming observedAt is >= the stored one — a delayed writer
   * carrying strictly older evidence can never drag public selection
   * back to a superseded state, and instead converges on the current
   * selection (see AiForecastMarkResult for the outcomes). Tie policy:
   * at EQUAL observedAt the move applies — ties break by store
   * serialization order (the later-completing refresh wins), so two
   * refreshes that observed their evidence in the same instant resolve
   * exactly like sequential refreshes; the rule forbids only regression
   * to STRICTLY older evidence, and neither writer can flap the pointer
   * without completing a refresh of its own. Note the asymmetry the
   * rule relies on: a re-observation of an old REVISION carries a fresh
   * observedAt — revision age is not observation age — so a genuine
   * A → B → A recurrence still moves the pointer back to A. The
   * classification is proven from the pointer row AS LOCKED by the
   * statement (SELECT … FOR UPDATE re-reads the newest committed
   * version after any wait and the lock is held to the statement's
   * end), never from the pre-wait statement snapshot: a selection
   * committed by a concurrent writer while this statement waited on
   * the row is the state the verdict describes, and no further move
   * can interleave before this statement commits. (A move landing
   * after this statement commits is a later fact, not a contradiction:
   * the verdict is exact as of its own commit, and every subsequent
   * read — public reads included — goes through the pointer afresh.)
   */
  markForecastCurrent(key: string, revisionId: string, evidenceHash: string, observedAt: string): Promise<AiForecastMarkResult>;
  /** The week's recorded current selection, or null when no refresh outcome has been recorded for it yet. */
  getForecastCurrent(key: string): Promise<AiForecastCurrentPointer | null>;
  /**
   * Consistent public read: the pointer joined to the revision it names
   * in ONE statement, so both halves come from a single snapshot and a
   * publication landing mid-read can never tear the pair. `revision` is
   * null only when the named revision is genuinely absent from that
   * same snapshot (a dangling pointer); `revisionCount` is the week's
   * series size in the same snapshot. Null when no pointer has been
   * recorded for the week yet.
   */
  getForecastCurrentRevision(key: string): Promise<{ pointer: AiForecastCurrentPointer; revision: AiForecastRevision | null; revisionCount: number } | null>;
};
export type AiReservation = { status: "reserved"; leaseId: string } | { status: "disabled" | "rate_limited" | "burst_limited" | "busy" | "duplicate"; retryAfterSeconds?: number };
const count = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const hashValid = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const authIdValid = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 256 && !/[\s\u0000-\u001f\u007f]/.test(v);
export function validAiIdentity(identity: AiIdentity): boolean {
  return uuidValid(identity.userId) && (identity.kind === "legacy" ? hashValid(identity.tokenHash)
    : identity.kind === "friends" ? authIdValid(identity.sessionId) && authIdValid(identity.subject)
      : identity.kind === "weekly_job" && ["legacy", "friends"].includes(identity.auth));
}
const dateValid = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v));

/** Corrupt/missing counters must never silently reset a spending budget. */
export function validBudgetState(v: unknown): v is AiBudgetState {
  if (!isRecord(v) || v.version !== 1 || !dateValid(v.day) || !count(v.requests) || !count(v.tokens) || !isRecord(v.users) || Object.keys(v.users).length > AI_BUDGET.retainedUserCapacity || !Array.isArray(v.leases) || v.leases.length > AI_BUDGET.concurrent || !Array.isArray(v.duplicates) || v.duplicates.length > 100) return false;
  for (const [id, u] of Object.entries(v.users)) {
    if (!uuidValid(id) || !isRecord(u) || !dateValid(u.day) || typeof u.hour !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(u.hour) || ![u.requests, u.hourly, u.denied, u.signals, u.lastSeen].every(count)) return false;
    if (u.recent !== undefined && (!Array.isArray(u.recent) || u.recent.length > AI_BUDGET.userBurst || !u.recent.every((time, i, times) => count(time) && (i === 0 || time >= times[i - 1])))) return false;
  }
  const ids = new Set<string>();
  for (const lease of v.leases) {
    if (!isRecord(lease) || !uuidValid(lease.id) || ids.has(lease.id) || !uuidValid(lease.userId) || !hashValid(lease.fingerprint) || !count(lease.expires) || !count(lease.reserved) || typeof lease.shared !== "boolean" || (lease.completed !== undefined && lease.completed !== true)) return false;
    ids.add(lease.id);
  }
  return v.duplicates.every(d => isRecord(d) && uuidValid(d.userId) && hashValid(d.fingerprint) && count(d.expires) && typeof d.shared === "boolean");
}

function checked(control: AiControl | null): AiControl {
  if (!control || typeof control.enabled !== "boolean" || !count(control.revision) || !validBudgetState(control.state)) throw new Error("state_unavailable");
  return control;
}
export function emptyBudgetState(now: number): AiBudgetState {
  return { version: 1, day: new Date(now).toISOString().slice(0, 10), requests: 0, tokens: 0, users: {}, leases: [], duplicates: [] };
}

export class AiDeciderStore {
  constructor(readonly persistence: AiPersistence) {}
  async available(): Promise<boolean> { return checked(await this.persistence.readControl()).enabled; }

  async reserve(identity: AiIdentity, fingerprint: string, tokens: number, now: number, shared = false): Promise<AiReservation> {
    if (!validAiIdentity(identity) || !hashValid(fingerprint) || !count(tokens) || tokens === 0 || tokens > 20000 || !count(now)) throw new Error("invalid_reservation");
    for (let attempt = 0; attempt < 8; attempt++) {
      const control = checked(await this.persistence.readControl());
      if (!control.enabled) return { status: "disabled" };
      const state = structuredClone(control.state);
      const iso = new Date(now).toISOString();
      const day = iso.slice(0, 10), hour = iso.slice(0, 13);
      // Clock rollback is fail-closed; counters must not reset into an earlier day.
      if (day < state.day) throw new Error("state_unavailable");
      if (day !== state.day) { state.day = day; state.requests = 0; state.tokens = 0; }
      state.leases = state.leases.filter(l => l.expires > now);
      state.duplicates = state.duplicates.filter(d => d.expires > now);
      for (const [id, u] of Object.entries(state.users)) if (u.lastSeen + AI_BUDGET.retentionMs <= now) delete state.users[id];
      const prev = state.users[identity.userId];
      if (prev && (day < prev.day || hour < prev.hour)) throw new Error("state_unavailable");
      const user: UserCounter = prev ?? { day, requests: 0, hour, hourly: 0, denied: 0, signals: 0, lastSeen: now };
      if (user.day !== day) { user.day = day; user.requests = 0; }
      if (user.hour !== hour) { user.hour = hour; user.hourly = 0; user.denied = 0; user.signals = 0; }
      // Additive bounded state: existing counters need no migration or reset.
      if ((user.recent?.at(-1) ?? 0) > now) throw new Error("state_unavailable");
      user.recent = (user.recent ?? []).filter(time => time > now - AI_BUDGET.burstMs);
      user.lastSeen = now;
      state.users[identity.userId] = user;
      if (Object.keys(state.users).length > AI_BUDGET.retainedUserCapacity) throw new Error("state_unavailable");
      let denial: AiReservation | null = null;
      const duplicate = state.leases.find(l => l.fingerprint === fingerprint && (shared || l.shared || l.userId === identity.userId));
      const ownLease = state.leases.find(l => l.userId === identity.userId);
      const globalExpiry = state.leases.length >= AI_BUDGET.concurrent ? Math.min(...state.leases.map(l => l.expires)) : 0;
      const leaseWait = (expires: number) => Math.max(1, Math.ceil((expires - now) / 1000));
      if (duplicate) denial = { status: "duplicate", retryAfterSeconds: leaseWait(duplicate.expires) };
      else if (ownLease || globalExpiry) denial = { status: "busy", retryAfterSeconds: leaseWait(Math.max(ownLease?.expires ?? 0, globalExpiry)) };
      else if (state.tokens + tokens > AI_BUDGET.globalTokensDay) denial = { status: "rate_limited", retryAfterSeconds: Math.max(1, Math.ceil(((Math.floor(now / 86400000) + 1) * 86400000 - now) / 1000)) };
      else if (user.recent.length >= AI_BUDGET.userBurst) denial = { status: "burst_limited", retryAfterSeconds: leaseWait(user.recent[0] + AI_BUDGET.burstMs) };
      if (denial) user.denied = Math.min(user.denied + 1, 1000000);
      else {
        user.requests++; user.hourly++; state.requests++; state.tokens += tokens;
        user.recent.push(now);
        const lease = { id: randomUUID(), userId: identity.userId, fingerprint, expires: now + AI_BUDGET.leaseMs, reserved: tokens, shared };
        state.leases.push(lease);
      }
      // Identity is revalidated inside the same SQL mutation as the budget reservation.
      if (await this.persistence.compareControl(control.revision, state, identity)) return denial ?? { status: "reserved", leaseId: state.leases.at(-1)!.id };
    }
    throw new Error("state_unavailable");
  }

  /** No refunds. Unknown spend retains a settled lease; its completion is idempotent. */
  async finish(leaseId: string, actualTokens: number | null, signal: boolean, unknownSpend: boolean, now: number): Promise<void> {
    if (!uuidValid(leaseId) || (actualTokens !== null && !count(actualTokens)) || !count(now)) throw new Error("state_unavailable");
    for (let attempt = 0; attempt < 8; attempt++) {
      const control = checked(await this.persistence.readControl());
      const state = structuredClone(control.state);
      const lease = state.leases.find(l => l.id === leaseId);
      if (!lease || lease.completed) return;
      const overrun = actualTokens !== null && actualTokens > lease.reserved;
      if (overrun) state.tokens += actualTokens - lease.reserved;
      if (signal && state.users[lease.userId]) state.users[lease.userId].signals = Math.min(state.users[lease.userId].signals + 1, 1000000);
      if (unknownSpend || actualTokens === null) lease.completed = true;
      else state.leases = state.leases.filter(l => l.id !== leaseId);
      if (await this.persistence.compareControl(control.revision, state, undefined, overrun)) return;
    }
    throw new Error("state_unavailable");
  }
}

/** Real shared Postgres persistence. CAS guarantees survive cold starts and overlap. */
export class PostgresAiPersistence implements AiPersistence {
  constructor(private readonly db: Db, private readonly weeklyOperator?: { userId: string; auth: "legacy" | "friends" }, private readonly refreshPolicy?: AiWeek1RefreshPolicy) {}
  private execute(statement: SQL) { return aiDataDeadline(this.db.execute(statement)); }
  async readControl(): Promise<AiControl | null> {
    const result = await this.execute(sql`SELECT enabled, revision, state FROM ai_decider_control WHERE id = 'goat-hoopers'`);
    const r = result.rows[0];
    return r ? { enabled: r.enabled as boolean, revision: Number(r.revision), state: r.state as AiBudgetState } : null;
  }
  async compareControl(revision: number, state: AiBudgetState, identity?: AiIdentity, disable = false): Promise<boolean> {
    if (!validBudgetState(state) || (identity && !validAiIdentity(identity))) throw new Error("state_unavailable");
    if (identity?.kind === "weekly_job" && !this.matchesWeeklyOperator(identity)) return false;
    const auth = !identity ? sql`` : identity.kind === "weekly_job"
      ? sql`AND enabled = true AND EXISTS (${this.weeklyMembership(identity)})`
      : identity.kind === "legacy"
      ? sql`AND enabled = true AND EXISTS (SELECT 1 FROM sessions s JOIN site_users u ON u.id = s.user_id WHERE s.token_hash = ${identity.tokenHash} AND u.id = ${identity.userId}::uuid AND u.team_id ~ '^(?:[1-9]|10)$' AND s.expires_at > now())`
      : sql`AND enabled = true AND EXISTS (
          SELECT 1 FROM auth_session s
          JOIN account_identities i ON i.subject = s.user_id
          JOIN auth_user a ON a.id = i.subject
          JOIN site_users u ON u.id = i.user_id
          WHERE s.id = ${identity.sessionId} AND s.user_id = ${identity.subject}
            AND u.id = ${identity.userId}::uuid AND i.active = true AND a.email_verified = true
            AND u.team_id ~ '^(?:[1-9]|10)$' AND s.expires_at > now())`;
    const result = await this.execute(sql`UPDATE ai_decider_control SET state = ${JSON.stringify(state)}::jsonb, revision = revision + 1, enabled = CASE WHEN ${disable} THEN false ELSE enabled END WHERE id = 'goat-hoopers' AND revision = ${revision} ${auth} RETURNING revision`);
    return result.rows.length === 1;
  }
  private matchesWeeklyOperator(identity: AiWeeklyJobIdentity): boolean {
    return validAiIdentity(identity) && identity.userId === this.weeklyOperator?.userId && identity.auth === this.weeklyOperator?.auth;
  }
  private weeklyMembership(identity: AiWeeklyJobIdentity): SQL {
    return identity.auth === "friends"
      ? sql`SELECT 1 FROM site_users u JOIN account_identities i ON i.user_id = u.id JOIN auth_user a ON a.id = i.subject WHERE u.id = ${identity.userId}::uuid AND u.team_id ~ '^(?:[1-9]|10)$' AND i.active = true AND a.email_verified = true`
      : sql`SELECT 1 FROM site_users u WHERE u.id = ${identity.userId}::uuid AND u.team_id ~ '^(?:[1-9]|10)$'`;
  }
  async authorizeWeeklyOperator(identity: AiWeeklyJobIdentity): Promise<boolean> {
    if (!this.matchesWeeklyOperator(identity)) return false;
    const result = await this.execute(sql`SELECT EXISTS (${this.weeklyMembership(identity)}) AS authorized`);
    return result.rows[0]?.authorized === true;
  }
  async sealWeek(week: AiStoredWeek): Promise<AiStoredWeek> {
    await this.execute(sql`INSERT INTO ai_decider_weeks (week_key, input_hash, generation_manifest, input, prepared_slate) VALUES (${week.key}, ${week.hash}, ${JSON.stringify(week.manifest)}::jsonb, ${JSON.stringify(week.input)}::jsonb, ${JSON.stringify(week.slate)}::jsonb) ON CONFLICT (week_key) DO NOTHING`);
    const sealed = await this.getWeek(week.key);
    if (!sealed) throw new Error("state_unavailable");
    return sealed;
  }
  async getWeek(key: string): Promise<AiStoredWeek | null> {
    if (this.refreshPolicy && key === WEEK1_REFRESH_KEY) {
      // Only the selected complete snapshot crosses the DB boundary. The original
      // hash check is inside SQL; no duplicate full archive read on every visit.
      const result = await this.execute(sql`SELECT week_key,input_hash,generation_manifest,input,prepared_slate,result FROM ai_decider_weeks
        WHERE week_key=${refreshStorageKey(key)} AND result IS NOT NULL
          AND EXISTS (SELECT 1 FROM ai_decider_weeks original WHERE original.week_key=${key} AND original.input_hash=${this.refreshPolicy.originalHash}) LIMIT 1`);
      const row = result.rows[0];
      if (row) {
        const replacement: AiStoredWeek = { key, hash: row.input_hash as string, manifest: row.generation_manifest as AiGenerationManifest, input: row.input as AiWeeklyInput, slate: row.prepared_slate as AiWeeklySlate, result: row.result as AiWeeklySlate, refreshed: true };
        if (cachedWeek(replacement, Date.parse(replacement.result!.generatedAt ?? "")).status !== "ready") throw new Error("weekly_cache");
        return replacement;
      }
    }
    return this.getOriginalWeek(key);
  }
  async getOriginalWeek(key: string): Promise<AiStoredWeek | null> {
    const result = await this.execute(sql`SELECT week_key, input_hash, generation_manifest, input, prepared_slate, result FROM ai_decider_weeks WHERE week_key = ${key} LIMIT 1`);
    const row = result.rows[0];
    return row ? { key: row.week_key as string, hash: row.input_hash as string, manifest: row.generation_manifest as AiGenerationManifest, input: row.input as AiWeeklyInput, slate: row.prepared_slate as AiWeeklySlate, result: row.result as AiWeeklySlate | null } : null;
  }
  async getWeekRefresh(): Promise<AiStoredWeek | null> {
    if (!this.refreshPolicy) return null;
    const stored = await this.getOriginalWeek(refreshStorageKey(WEEK1_REFRESH_KEY));
    return stored ? { ...stored, key: WEEK1_REFRESH_KEY } : null;
  }
  async hasWeekRefresh(): Promise<boolean> {
    if (!this.refreshPolicy) return false;
    const result = await this.execute(sql`SELECT EXISTS (SELECT 1 FROM ai_decider_weeks WHERE week_key=${refreshStorageKey(WEEK1_REFRESH_KEY)}) AS present`);
    const present = result.rows[0]?.present;
    if (typeof present !== "boolean") throw new Error("refresh_state");
    return present;
  }
  private refreshAdmission(identity: AiIdentity): SQL {
    if (identity.kind === "weekly_job" || !validAiIdentity(identity)) throw new Error("refresh_identity");
    return identity.kind === "legacy"
      ? sql`SELECT 1 FROM sessions s JOIN site_users u ON u.id=s.user_id WHERE s.token_hash=${identity.tokenHash} AND u.id=${identity.userId}::uuid AND u.team_id ~ '^(?:[1-9]|10)$' AND s.expires_at>now()`
      : sql`SELECT 1 FROM auth_session s JOIN account_identities i ON i.subject=s.user_id JOIN auth_user a ON a.id=i.subject JOIN site_users u ON u.id=i.user_id WHERE s.id=${identity.sessionId} AND s.user_id=${identity.subject} AND u.id=${identity.userId}::uuid AND i.active=true AND a.email_verified=true AND u.team_id ~ '^(?:[1-9]|10)$' AND s.expires_at>now()`;
  }
  async claimWeekRefresh(week: AiStoredWeek, identity: AiIdentity): Promise<boolean> {
    if (!this.refreshPolicy || week.key !== WEEK1_REFRESH_KEY || week.result !== null) return false;
    cachedWeek(week, Date.parse(week.input.capturedAt));
    const admission = this.refreshAdmission(identity);
    const result = await this.execute(sql`INSERT INTO ai_decider_weeks (week_key,input_hash,generation_manifest,input,prepared_slate)
      SELECT ${refreshStorageKey(week.key)},${week.hash},${JSON.stringify(week.manifest)}::jsonb,${JSON.stringify(week.input)}::jsonb,${JSON.stringify(week.slate)}::jsonb
      FROM ai_decider_weeks original WHERE original.week_key=${week.key} AND original.input_hash=${this.refreshPolicy.originalHash}
        AND original.result->>'status'='ready' AND NOT EXISTS (SELECT 1 FROM ai_decider_outcomes WHERE week_key=${week.key})
        AND EXISTS (SELECT 1 FROM ai_decider_control WHERE id='goat-hoopers' AND enabled=true)
        AND EXISTS (${admission}) ON CONFLICT (week_key) DO NOTHING RETURNING week_key`);
    return result.rows.length === 1;
  }
  async completeWeekRefresh(hash: string, slate: AiWeeklySlate, identity: AiIdentity): Promise<boolean> {
    if (!this.refreshPolicy || slate.status !== "ready" || !slate.generatedAt) return false;
    const record = await this.getWeekRefresh();
    if (!record || record.hash !== hash || record.result) return false;
    if (cachedWeek({ ...record, result: slate }, Date.parse(slate.generatedAt)).status !== "ready") return false;
    const admission = this.refreshAdmission(identity);
    const result = await this.execute(sql`UPDATE ai_decider_weeks SET result=${JSON.stringify(slate)}::jsonb
      WHERE week_key=${refreshStorageKey(WEEK1_REFRESH_KEY)} AND input_hash=${hash} AND result IS NULL
        AND EXISTS (SELECT 1 FROM ai_decider_weeks original WHERE original.week_key=${WEEK1_REFRESH_KEY} AND original.input_hash=${this.refreshPolicy.originalHash} AND original.result->>'status'='ready')
        AND NOT EXISTS (SELECT 1 FROM ai_decider_outcomes WHERE week_key=${WEEK1_REFRESH_KEY})
        AND EXISTS (SELECT 1 FROM ai_decider_control WHERE id='goat-hoopers' AND enabled=true)
        AND EXISTS (${admission}) RETURNING week_key`);
    return result.rows.length === 1;
  }
  async completeWeek(key: string, hash: string, slate: AiWeeklySlate): Promise<boolean> {
    const result = await this.execute(sql`UPDATE ai_decider_weeks SET result = ${JSON.stringify(slate)}::jsonb WHERE week_key = ${key} AND input_hash = ${hash} AND result IS NULL RETURNING week_key`);
    return result.rows.length === 1;
  }
  async recordOutcome(key: string, outcome: AiWeeklyOutcome): Promise<boolean> {
    const result = await this.execute(sql`INSERT INTO ai_decider_outcomes (week_key, matchup_id, outcome) VALUES (${key}, ${outcome.matchupId}, ${JSON.stringify(outcome)}::jsonb) ON CONFLICT (week_key, matchup_id) DO NOTHING RETURNING matchup_id`);
    return result.rows.length === 1;
  }
  async appendForecast(key: string, revision: AiForecastRevision): Promise<boolean> {
    // Either unique key (revision id, or evidence hash within the week)
    // turns a repeat append into a no-op: overlapping refreshes converge
    // on one stored revision per evidence state.
    const result = await this.execute(sql`INSERT INTO ai_decider_forecasts (week_key, revision_id, evidence_hash, revision) VALUES (${key}, ${revision.revisionId}, ${revision.evidenceHash}, ${JSON.stringify(revision)}::jsonb) ON CONFLICT DO NOTHING RETURNING revision_id`);
    return result.rows.length === 1;
  }
  async getForecasts(key: string): Promise<AiForecastRevision[]> {
    try {
      const result = await this.execute(sql`SELECT revision FROM ai_decider_forecasts WHERE week_key = ${key} ORDER BY seq ASC`);
      return result.rows.map(r => r.revision as AiForecastRevision);
    } catch (error) { if (isMissingForecastTable(error)) return []; throw error; }
  }
  async getLatestForecast(key: string): Promise<AiForecastRevision | null> {
    try {
      const result = await this.execute(sql`SELECT revision FROM ai_decider_forecasts WHERE week_key = ${key} ORDER BY seq DESC LIMIT 1`);
      return result.rows[0] ? result.rows[0].revision as AiForecastRevision : null;
    } catch (error) { if (isMissingForecastTable(error)) return null; throw error; }
  }
  async getForecastByEvidenceHash(key: string, evidenceHash: string): Promise<AiForecastRevision | null> {
    try {
      const result = await this.execute(sql`SELECT revision FROM ai_decider_forecasts WHERE week_key = ${key} AND evidence_hash = ${evidenceHash} LIMIT 1`);
      return result.rows[0] ? result.rows[0].revision as AiForecastRevision : null;
    } catch (error) { if (isMissingForecastTable(error)) return null; throw error; }
  }
  async publishForecast(key: string, revision: AiForecastRevision, observedAt: string): Promise<boolean> {
    // One statement, so append and pointer move commit or fail together.
    // The append is gated on the evidence state being absent AND the
    // chain head still being the revision's recorded predecessor; a
    // concurrent winner makes this insert a no-op (or a unique-violation
    // on the chain indexes, folded into the same "CAS lost" result).
    // The monotonic gate is the third condition: while a strictly
    // fresher selection is current, a delayed writer's older evidence
    // neither appends over it nor moves the pointer — the publication
    // simply does not take, and the caller converges on the current
    // revision (rebuilding on the new head cannot make old evidence
    // fresh). Equal observed_at is NOT stale (the documented tie
    // policy): sequential same-instant refreshes still publish.
    //
    // The gate is evaluated on the LOCKED pointer row, not on a
    // snapshot subquery: `cur_lock` takes the row's lock (FOR UPDATE),
    // which waits out any concurrent writer holding it and then
    // returns the NEWEST committed version of the row — so a fresher
    // dedupe observation committed while this statement was starting
    // (invisible to the statement snapshot, which is exactly how an
    // unguarded snapshot check gets bypassed) is seen by the gate, and
    // the lock is then held to the statement's end, so the gated
    // append and the pointer move below serialize against every other
    // pointer writer. The pointer mutation is additionally guarded in
    // its own right: the upsert's WHERE is re-checked against the
    // latest committed row version after any lock wait, which covers
    // the one case the lock cannot — no pointer row existed to lock
    // when the statement began and a concurrent first creation lands
    // mid-statement.
    try {
      const result = await this.execute(sql`
        WITH cur_lock AS (
          SELECT observed_at FROM ai_decider_forecast_current
          WHERE week_key = ${key}
          FOR UPDATE
        ),
        ins AS (
          INSERT INTO ai_decider_forecasts (week_key, revision_id, evidence_hash, revision)
          SELECT ${key}, ${revision.revisionId}, ${revision.evidenceHash}, ${JSON.stringify(revision)}::jsonb
          WHERE NOT EXISTS (SELECT 1 FROM ai_decider_forecasts WHERE week_key = ${key} AND evidence_hash = ${revision.evidenceHash})
            AND COALESCE((SELECT revision_id FROM ai_decider_forecasts WHERE week_key = ${key} ORDER BY seq DESC LIMIT 1), '') = ${revision.supersedes ?? ""}
            AND NOT EXISTS (SELECT 1 FROM cur_lock WHERE cur_lock.observed_at > ${observedAt}::timestamptz)
          ON CONFLICT DO NOTHING
          RETURNING revision_id
        ),
        ptr AS (
          INSERT INTO ai_decider_forecast_current (week_key, revision_id, evidence_hash, observed_at)
          SELECT ${key}, ins.revision_id, ${revision.evidenceHash}, ${observedAt}::timestamptz FROM ins
          ON CONFLICT (week_key) DO UPDATE SET revision_id = EXCLUDED.revision_id, evidence_hash = EXCLUDED.evidence_hash, observed_at = EXCLUDED.observed_at
          WHERE ai_decider_forecast_current.observed_at <= EXCLUDED.observed_at
          RETURNING revision_id
        )
        SELECT revision_id FROM ptr`);
      return result.rows.length === 1;
    } catch (error) { if ((error as { code?: unknown } | null)?.code === "23505") return false; throw error; }
  }
  async markForecastCurrent(key: string, revisionId: string, evidenceHash: string, observedAt: string): Promise<AiForecastMarkResult> {
    // The pointer may only ever name a revision actually stored for the
    // week (the SELECT source), mirroring the table's foreign key — and
    // it may only move monotonically: the upsert's WHERE refuses to
    // overwrite a strictly fresher observation. The classification
    // reads `cur` AS A LOCKED RE-READ (FOR UPDATE): if a concurrent
    // writer holds the row, the read waits and then returns the newest
    // committed version — the selection the refused upsert actually
    // lost to — and the lock is held to the statement's end, so the
    // verdict and the write can never disagree. (A plain snapshot read
    // here could still see the pre-wait row and report "current" for a
    // revision a committed concurrent move had already replaced.)
    try {
      const result = await this.execute(sql`
        WITH stored AS (
          SELECT week_key, revision_id, evidence_hash FROM ai_decider_forecasts
          WHERE week_key = ${key} AND revision_id = ${revisionId} AND evidence_hash = ${evidenceHash}
        ),
        cur AS (
          SELECT revision_id, evidence_hash, observed_at FROM ai_decider_forecast_current WHERE week_key = ${key} FOR UPDATE
        ),
        up AS (
          INSERT INTO ai_decider_forecast_current (week_key, revision_id, evidence_hash, observed_at)
          SELECT week_key, revision_id, evidence_hash, ${observedAt}::timestamptz FROM stored
          ON CONFLICT (week_key) DO UPDATE SET revision_id = EXCLUDED.revision_id, evidence_hash = EXCLUDED.evidence_hash, observed_at = EXCLUDED.observed_at
          WHERE ai_decider_forecast_current.observed_at <= EXCLUDED.observed_at
          RETURNING revision_id
        )
        SELECT CASE
          WHEN NOT EXISTS (SELECT 1 FROM stored) THEN 'missing'
          WHEN EXISTS (SELECT 1 FROM up) THEN 'moved'
          WHEN EXISTS (SELECT 1 FROM cur WHERE revision_id = ${revisionId} AND evidence_hash = ${evidenceHash}) THEN 'current'
          ELSE 'stale'
        END AS outcome`);
      const outcome = result.rows[0]?.outcome;
      return outcome === "moved" || outcome === "current" || outcome === "stale" ? outcome : "missing";
    } catch (error) { if (isMissingForecastTable(error)) return "missing"; throw error; }
  }
  async getForecastCurrent(key: string): Promise<AiForecastCurrentPointer | null> {
    try {
      const result = await this.execute(sql`SELECT week_key, revision_id, evidence_hash, observed_at FROM ai_decider_forecast_current WHERE week_key = ${key}`);
      const r = result.rows[0];
      if (!r) return null;
      const at = r.observed_at as Date | string;
      return { weekKey: r.week_key as string, revisionId: r.revision_id as string, evidenceHash: r.evidence_hash as string, observedAt: at instanceof Date ? at.toISOString() : String(at) };
    } catch (error) { if (isMissingForecastTable(error)) return null; throw error; }
  }
  async getForecastCurrentRevision(key: string): Promise<{ pointer: AiForecastCurrentPointer; revision: AiForecastRevision | null; revisionCount: number } | null> {
    // ONE statement: the pointer, the revision it names and the series
    // count all come from a single snapshot, so a publication landing
    // mid-read can never tear the pair. The LEFT JOIN yields a null
    // revision only when the named revision is genuinely absent from
    // that same snapshot (a dangling pointer — which the table's
    // foreign key already makes structurally impossible here, but the
    // read contract does not rely on that).
    try {
      const result = await this.execute(sql`
        SELECT c.revision_id AS pointer_revision_id, c.evidence_hash AS pointer_evidence_hash, c.observed_at AS pointer_observed_at,
               f.revision AS revision,
               (SELECT count(*)::int FROM ai_decider_forecasts WHERE week_key = ${key}) AS revision_count
        FROM ai_decider_forecast_current c
        LEFT JOIN ai_decider_forecasts f ON f.week_key = c.week_key AND f.revision_id = c.revision_id
        WHERE c.week_key = ${key}`);
      const r = result.rows[0];
      if (!r) return null;
      const at = r.pointer_observed_at as Date | string;
      return {
        pointer: { weekKey: key, revisionId: r.pointer_revision_id as string, evidenceHash: r.pointer_evidence_hash as string, observedAt: at instanceof Date ? at.toISOString() : String(at) },
        revision: (r.revision as AiForecastRevision | null) ?? null,
        revisionCount: Number(r.revision_count),
      };
    } catch (error) { if (isMissingForecastTable(error)) return null; throw error; }
  }
}

/**
 * The forecast tables are applied separately from the base migration;
 * until they exist, forecast reads are a clean empty series, never an
 * error that could disturb the pregame read path.
 */
function isMissingForecastTable(error: unknown): boolean {
  const e = error as { code?: unknown; message?: unknown } | null;
  return e?.code === "42P01" || (typeof e?.message === "string" && /ai_decider_forecast/.test(e.message) && /does not exist/i.test(e.message));
}

export function getAiDeciderStore(weeklyOperator?: { userId: string; auth: "legacy" | "friends" }, refreshPolicy?: AiWeek1RefreshPolicy): AiDeciderStore { return new AiDeciderStore(new PostgresAiPersistence(getDb(), weeklyOperator, refreshPolicy)); }
