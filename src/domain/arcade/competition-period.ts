import type { RankedPeriod, RankedLeaderboardEntry } from "./ranked-free-throw";

export type CompetitionFixture = { id: string; date: string; startsAtMs: number };
export type CompetitionPeriod = {
  id: string; gameId: "free-throw"; week: string; label: string; order: number;
  opensAtMs: number; predecessorId: string | null;
  calendarSource: string; calendarVersion: string; fixtures: readonly CompetitionFixture[];
};
export type FixtureState = "scheduled" | "live" | "final" | "postponed" | "missing";
export type FinalityReceipt = { checkedAtMs: number; source: string; states: Record<string, FixtureState> };
export type PeriodRecord = CompetitionPeriod & { scoreVersion?: string; closedAtMs: number | null; finalizedAtMs: number | null; receipt: FinalityReceipt | null };
export type PeriodPhase = "upcoming" | "open" | "blocked" | "final";
export const FINALITY_FRESH_MS = 10 * 60 * 1000;

export function periodPhase(period: PeriodRecord, nowMs: number, predecessorFinal: boolean): PeriodPhase {
  if (period.finalizedAtMs !== null) return "final";
  if (nowMs < period.opensAtMs) return "upcoming";
  if (!predecessorFinal || period.closedAtMs !== null || !period.receipt || period.receipt.checkedAtMs > nowMs ||
    nowMs - period.receipt.checkedAtMs > FINALITY_FRESH_MS || !period.fixtures.length ||
    period.fixtures.every(f => period.receipt!.states[f.id] === "final") ||
    period.fixtures.some(f => !period.receipt!.states[f.id] || ["missing", "postponed"].includes(period.receipt!.states[f.id]))) return "blocked";
  return "open";
}

/** Never infer finality from elapsed time, a scheduled tip or an incomplete fixture response. */
export function canFinalize(period: PeriodRecord, receipt: FinalityReceipt, nowMs: number): boolean {
  return period.finalizedAtMs === null && nowMs >= period.opensAtMs && receipt.checkedAtMs <= nowMs &&
    nowMs - receipt.checkedAtMs <= FINALITY_FRESH_MS && period.fixtures.length > 0 &&
    period.fixtures.every(f => f.startsAtMs <= nowMs && receipt.states[f.id] === "final");
}
export const runPeriod = (p: PeriodRecord): RankedPeriod => ({ id: p.id, week: p.week, startsAtMs: p.opensAtMs, endsAtMs: p.closedAtMs });

export type CompetitionBoard = {
  gameId: string; kind: "weekly" | "all-time" | "archive"; label: string; phase: PeriodPhase | "held";
  asOfMs: number; periodId: string | null; scoreVersion: string; entries: RankedLeaderboardEntry[];
};
export type CompetitionArchive = { id: string; gameId: string; label: string; closedAtMs: number; finalizedAtMs: number };

/** Dates are explicit source receipts, not a guessed 168-hour recurrence. */
export function parseCompetitionCalendar(value: unknown): CompetitionPeriod[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 60) return null;
  const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
  const ids = new Set<string>(), fixtureIds = new Set<string>(), result: CompetitionPeriod[] = [];
  const midnight = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hourCycle: "h23", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  for (const p of value) {
    if (!record(p) || typeof p.id !== "string" || !/^[a-z0-9-]{3,80}$/.test(p.id) || ids.has(p.id) || p.gameId !== "free-throw" ||
      typeof p.week !== "string" || !/^\d{4}-W(?:0[1-9]|[1-4]\d|5[0-3])$/.test(p.week) ||
      typeof p.label !== "string" || !p.label || p.label.length > 100 || typeof p.order !== "number" || !Number.isSafeInteger(p.order) || p.order < 1 ||
      typeof p.opensAtMs !== "number" || !Number.isSafeInteger(p.opensAtMs) || p.opensAtMs < 0 || p.opensAtMs > 8640000000000000 ||
      !(p.predecessorId === null || typeof p.predecessorId === "string") || typeof p.calendarSource !== "string" || p.calendarSource.length > 2048 ||
      typeof p.calendarVersion !== "string" || !p.calendarVersion || p.calendarVersion.length > 128 ||
      !Array.isArray(p.fixtures) || !p.fixtures.length || p.fixtures.length > 150) return null;
    try { if (new URL(p.calendarSource).protocol !== "https:") return null; } catch { return null; }
    const fixtures: CompetitionFixture[] = [];
    for (const f of p.fixtures) {
      if (!record(f) || typeof f.id !== "string" || !/^\d{6,15}$/.test(f.id) || fixtureIds.has(f.id) ||
        typeof f.date !== "string" || !/^\d{8}$/.test(f.date) || typeof f.startsAtMs !== "number" || !Number.isSafeInteger(f.startsAtMs) || f.startsAtMs < 0) return null;
      const date = `${f.date.slice(0, 4)}-${f.date.slice(4, 6)}-${f.date.slice(6, 8)}`;
      if (!Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) return null;
      fixtureIds.add(f.id); fixtures.push({ id: f.id, date: f.date, startsAtMs: f.startsAtMs });
    }
    ids.add(p.id); result.push({ id: p.id, gameId: "free-throw", week: p.week, label: p.label, order: p.order, opensAtMs: p.opensAtMs,
      predecessorId: p.predecessorId, calendarSource: p.calendarSource, calendarVersion: p.calendarVersion, fixtures });
  }
  result.sort((a, b) => a.order - b.order);
  if (result.some((p, i) => p.predecessorId !== (i ? result[i - 1].id : null) || i > 0 &&
    (p.order <= result[i - 1].order || p.opensAtMs <= result[i - 1].opensAtMs || p.opensAtMs % 1000 !== 0 || midnight.format(p.opensAtMs) !== "00:00:00"))) return null;
  return result;
}
