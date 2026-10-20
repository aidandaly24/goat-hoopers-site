/**
 * team-value-history.ts — the recorded-only producer for issue #217.
 *
 * Serves the v1 team-value-history envelope/detail (contract:
 * `src/domain/team-value-history.ts`, integration doc on PR #218) from
 * sources that already exist and are read here, read-only:
 *
 * - Recorded modeled quotes from `stock_snapshots`, through the batched
 *   adapter in `recorded-quotes.ts` (original quote ids, integer cents,
 *   native UTC-convention timestamps). The market loader's saving path
 *   is never invoked: API reads write nothing.
 * - A pinned, dated roster anchor: the current Sleeper rosters, observed
 *   at load time.
 * - The completed-move generation over the public Sleeper transaction
 *   feed, in the frozen replay ordering (status_updated asc, tie-break
 *   transaction_id, complete-only, trades atomic). A team's roster at a
 *   quote instant is its anchor roster with every later completed move
 *   inverted; days whose membership cannot be proven that way stay
 *   unpriced and are reported ambiguous/unavailable, never stretched.
 *
 * NO-WRITE BOUNDARY (amendment 1 on #217): this module performs zero
 * Neon writes — no migration apply, no population of the #219 tables
 * (sleeper_transactions / roster_snapshots_daily / roster_boundary_moves
 * / team_value_points), no backfill, and no reconstruction of
 * pre-Oct-2026 prices. Persisting recorded points against the 30-day
 * prune is a separate, separately reviewed PR.
 *
 * GENERATION FINGERPRINT (dot's invariant on #217): the generation binds
 * the anchor roster, the completed-move set, the admitted recorded
 * quote set (quote ids + exact native timestamps + integer cents) and
 * the roster/source bounds. Adding, revising or pruning any admitted
 * quote changes the generation; detail/summary requests carrying an
 * obsolete generation get HTTP 409 instead of a silently different day.
 *
 * FAIL-CLOSED FEED: the move generation loads through a strict fetcher
 * — every season week must succeed. A failed or malformed week rejects
 * the load (503) instead of reading as an empty move set.
 *
 * VALIDATED AS-OF CUTOFF: evidence is admitted only at or before the
 * load instant (`now`). A quote or move timestamped after the cutoff is
 * not admitted, never advances `asOf`, and an unpriced detail for today
 * claims replay only through the cutoff — not through end-of-day. The
 * comparison is made at native microsecond precision (`instantMicros`),
 * never through `Date.parse`: a quote one microsecond past the cutoff
 * is future evidence and is excluded at admission, not admitted and
 * then rejected by envelope validation.
 *
 * CONFLICTING QUOTES: two different prices for one player at one native
 * instant are a contradiction the schema permits but quote-id ordering
 * cannot adjudicate; the observation is quarantined (that player is
 * unpriced at that instant) rather than silently selecting a price.
 *
 * CURRENT QUOTE: valued from the anchor roster — the independently
 * observed current membership — at the latest admitted instant that
 * prices at least one current player. Historical replay membership is
 * never relabeled as current.
 */
import { createHash } from "node:crypto";
import {
  historyInstantKey, isTeamValueHistoryDetail, isTeamValueHistoryEnvelope, shiftHistoryDay,
  TEAM_HISTORY_MAX_MOVES, TEAM_HISTORY_MAX_POINTS, validHistoryDay, validHistoryRange,
  type TeamHistoryMove, type TeamHistoryPoint, type TeamHistoryRange,
  type TeamValueHistoryDetail, type TeamValueHistoryEnvelope,
} from "@/domain/team-value-history";
import { getRecordedQuoteStore, type RecordedQuote, type RecordedQuoteStore } from "./recorded-quotes";
import {
  fetchNbaState, fetchPlayerDirectory, fetchRosters, fetchUsers, LEAGUE_ID,
  type RawPlayerEntry, type RawTransaction,
} from "./sleeper";
import { fetchTransactionsByWeekComplete, validSeasonWeeks } from "./league";
import { teamNameOf } from "./transform";

export class TeamHistoryError extends Error {
  constructor(message: string, readonly status: 400 | 404 | 409 | 503) { super(message); }
}

/* ------------------------------ sources ------------------------------ */

/** The pinned roster anchor: every team's current roster, dated. */
export type HistoryAnchor = {
  observedAt: string;
  teams: { id: string; name: string; players: string[] }[];
};

/** A completed Sleeper move, normalized for the frozen replay order. */
export type HistoryMove = {
  id: string;
  type: TeamHistoryMove["type"];
  /** Effective instant: `status_updated`, falling back to `created`. */
  effectiveMs: number;
  adds: { playerId: string; rosterId: number }[];
  drops: { playerId: string; rosterId: number }[];
};

export type TeamHistoryDeps = {
  quotes?: RecordedQuoteStore | null;
  fetchAnchor?: () => Promise<HistoryAnchor>;
  fetchMoves?: () => Promise<HistoryMove[]>;
  fetchNames?: () => Promise<Record<string, RawPlayerEntry>>;
  now?: () => Date;
};

/** Source-confirmed league start: the founding draft day, 2025-10-20. */
export const HISTORY_LEAGUE_FROM = "2025-10-20";
/** First day of the 2026 league's transaction feed (season boundary). */
export const HISTORY_SEASON_TWO_FROM = "2026-08-13";
const SEASON_ONE_LEAGUE_ID = "1282883196567977984";
const DAY_MS = 86_400_000;
const MAX_RESPONSE_BYTES = 256 * 1024;

const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const instantIso = (ms: number) => new Date(ms).toISOString();
const dayOf = (nativeTimestamp: string) => nativeTimestamp.slice(0, 10);
const instantMs = (nativeTimestamp: string) => Date.parse(`${nativeTimestamp}Z`);

/**
 * Native timestamps at full microsecond fidelity, as epoch microseconds.
 * `Date.parse` is millisecond-precision: it would read a quote at
 * 12:00:00.000001 as equal to a 12:00:00.000 cutoff and admit evidence
 * from after the validated as-of instant (which the envelope contract
 * then rejects, failing the whole load). The adapter emits exactly six
 * fractional digits (`to_char … .US`), so parse them as integers and
 * never let a JS Date near the fraction. Epoch µs ≈ 1.8e15 stays exact
 * in a double (< 2^53). Non-canonical shapes fall back to ms fidelity.
 */
const NATIVE_INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?$/;
function instantMicros(nativeTimestamp: string): number {
  const match = NATIVE_INSTANT.exec(nativeTimestamp);
  if (!match) return instantMs(nativeTimestamp) * 1000;
  const [, year, month, day, hour, minute, second, fraction = ""] = match;
  const secondMicros = Date.UTC(Number(year), Number(month) - 1, Number(day),
    Number(hour), Number(minute), Number(second)) * 1000;
  return secondMicros + Number((fraction + "000000").slice(0, 6));
}

/** A move's effective instant in epoch µs (Sleeper reports epoch ms). */
const moveMicros = (move: HistoryMove) => move.effectiveMs * 1000;

function moveType(raw: string): TeamHistoryMove["type"] {
  return raw === "waiver" || raw === "free_agent" || raw === "trade" || raw === "commissioner" ? raw : "other";
}

/** Raw Sleeper transactions → completed moves in the frozen replay order. */
export function toHistoryMoves(raw: RawTransaction[]): HistoryMove[] {
  const entries = (record: Record<string, number> | null | undefined) =>
    Object.entries(record ?? {}).map(([playerId, rosterId]) => ({ playerId, rosterId }));
  return raw
    .filter(tx => tx.status === "complete")
    .map(tx => ({
      id: tx.transaction_id, type: moveType(tx.type),
      effectiveMs: tx.status_updated ?? tx.created,
      adds: entries(tx.adds), drops: entries(tx.drops),
    }))
    .filter(move => typeof move.id === "string" && move.id.length > 0 && Number.isFinite(move.effectiveMs))
    .sort((a, b) => a.effectiveMs - b.effectiveMs || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

async function defaultAnchor(): Promise<HistoryAnchor> {
  const [rosters, users] = await Promise.all([fetchRosters(), fetchUsers()]);
  const byId = new Map(users.map(user => [user.user_id, user]));
  return {
    observedAt: new Date().toISOString(),
    teams: rosters.map(roster => ({
      id: String(roster.roster_id), name: teamNameOf(byId.get(roster.owner_id)), players: [...roster.players],
    })),
  };
}

/**
 * The completed-move generation, loaded fail-closed: the season state
 * must establish a provable week range and EVERY week's fetch must
 * succeed. The shared tolerant fetcher converts a failed week into an
 * empty array — fine for stats, fatal here: silence would be replayed
 * as "no moves happened" and invent historical membership. Any failure
 * rejects, and `loadTeamHistoryState` surfaces that as 503.
 */
async function defaultMoves(): Promise<HistoryMove[]> {
  const state = await fetchNbaState();
  const weeks = validSeasonWeeks(state);
  if (weeks.length === 0) {
    throw new Error("Sleeper season state does not establish a provable transaction week range");
  }
  const byWeek = await fetchTransactionsByWeekComplete(weeks);
  return toHistoryMoves(byWeek.flat());
}

/* --------------------------- producer state --------------------------- */

type InstantEval = {
  nativeTimestamp: string;
  /** The instant at native microsecond precision (epoch µs). */
  micros: number;
  roster: string[];
  quotes: Map<string, RecordedQuote>;
};

export type TeamHistoryState = {
  team: { id: string; name: string };
  generation: string;
  asOf: string;
  leagueRange: TeamHistoryRange;
  seasons: TeamValueHistoryEnvelope["seasons"];
  coverage: TeamValueHistoryEnvelope["coverage"];
  sourceNotes: string[];
  points: TeamHistoryPoint[];
  currentQuote: TeamValueHistoryEnvelope["currentQuote"];
  envelope: (range: TeamHistoryRange) => TeamValueHistoryEnvelope;
  detail: (day: string, names: Record<string, RawPlayerEntry>) => TeamValueHistoryDetail;
  receipt: () => TeamHistoryReceipt;
};

/** Deterministic point → roster → move receipt for one team's series. */
export type TeamHistoryReceipt = {
  teamId: string;
  generation: string;
  anchor: { observedAt: string; roster: string[] };
  points: {
    pointId: string; day: string; valuationAt: string; roster: string[];
    pricedPlayerIds: string[]; subtotalCents: number | null;
    /** Completed moves inverted to derive this roster from the anchor. */
    generationMoves: { id: string; type: string; effectiveAt: string }[];
  }[];
};

function buildState(args: {
  anchor: HistoryAnchor;
  team: { id: string; name: string; players: string[] };
  moves: HistoryMove[];
  quotes: RecordedQuote[];
  now: Date;
}): TeamHistoryState {
  const { anchor, team } = args;
  const rosterId = Number(team.id);
  const anchorRoster = [...team.players].sort();
  // Validated as-of cutoff: nothing timestamped after the load instant
  // is admitted as evidence — not quotes, not moves. Future-dated rows
  // from a faulty source can neither move a historical day nor advance
  // asOf past the moment the envelope claims to speak for. The
  // comparison runs at native microsecond precision: a quote one
  // microsecond past the cutoff is future evidence and is excluded
  // here, never admitted and then rejected by envelope validation.
  const cutoffMs = args.now.getTime();
  const cutoffMicros = cutoffMs * 1000;
  const quotes = args.quotes.filter(quote => instantMicros(quote.nativeTimestamp) <= cutoffMicros);
  const moves = args.moves.filter(move => moveMicros(move) <= cutoffMicros
    && (move.adds.some(entry => entry.rosterId === rosterId) || move.drops.some(entry => entry.rosterId === rosterId)));

  /**
   * Roster at an instant (epoch µs): the anchor with every completed
   * move effective after the instant inverted, in exact reverse frozen
   * order. Returns null when inversion contradicts the anchor (an add
   * to invert that is absent, a drop to restore that is present) —
   * membership unproven.
   */
  function rosterAt(micros: number): string[] | null {
    const roster = new Set(anchorRoster);
    for (let i = moves.length - 1; i >= 0; i--) {
      const move = moves[i];
      if (moveMicros(move) <= micros) break;
      for (const drop of move.drops) {
        if (drop.rosterId !== rosterId) continue;
        if (roster.has(drop.playerId)) return null;
        roster.add(drop.playerId);
      }
      for (const add of move.adds) {
        if (add.rosterId !== rosterId) continue;
        if (!roster.has(add.playerId)) return null;
        roster.delete(add.playerId);
      }
    }
    return [...roster].sort();
  }

  // Genuine common observation instants: quotes grouped by their exact
  // native timestamp. No carry, no backdating, no appended current quote.
  // Two rows for one player at one instant with the SAME price are one
  // observation (the smaller quote id stays as provenance, deterministi-
  // cally). Two rows with DIFFERENT prices contradict each other and no
  // quote-id ordering is evidence for either — the observation is
  // quarantined: the player is unpriced at that instant.
  const byInstant = new Map<string, Map<string, RecordedQuote>>();
  const conflicted = new Set<string>();
  for (const quote of quotes) {
    const key = `${quote.nativeTimestamp}|${quote.playerId}`;
    if (conflicted.has(key)) continue;
    let at = byInstant.get(quote.nativeTimestamp);
    if (!at) { at = new Map<string, RecordedQuote>(); byInstant.set(quote.nativeTimestamp, at); }
    const prior = at.get(quote.playerId);
    if (!prior) { at.set(quote.playerId, quote); continue; }
    if (prior.priceCents === quote.priceCents) {
      if (quote.quoteId < prior.quoteId) at.set(quote.playerId, quote);
      continue;
    }
    at.delete(quote.playerId);
    conflicted.add(key);
  }
  const instantList = [...byInstant.entries()]
    .filter(([, at]) => at.size > 0)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const evals: InstantEval[] = [];
  for (const [nativeTimestamp, at] of instantList) {
    const micros = instantMicros(nativeTimestamp);
    const roster = rosterAt(micros);
    if (roster) evals.push({ nativeTimestamp, micros, roster, quotes: at });
  }

  const rosterRef = (roster: readonly string[]) => `roster-${team.id}-${sha([...roster].sort().join(",")).slice(0, 12)}`;
  const setId = (prefix: string, ids: readonly string[]) => `${prefix}-${sha([...ids].sort().join(",")).slice(0, 12)}`;

  // One point per UTC day: the instant pricing the largest share of that
  // day's roster; ties resolve to the latest instant. Deterministic.
  const byDay = new Map<string, { build: TeamHistoryPoint; ev: InstantEval; pricedIds: string[] }>();
  for (const ev of evals) {
    const day = dayOf(ev.nativeTimestamp);
    const pricedIds = ev.roster.filter(id => ev.quotes.has(id));
    const prior = byDay.get(day);
    if (prior && (prior.pricedIds.length > pricedIds.length
      || prior.pricedIds.length === pricedIds.length && prior.ev.nativeTimestamp >= ev.nativeTimestamp)) continue;
    const subtotalCents = pricedIds.length > 0
      ? pricedIds.reduce((sum, id) => sum + ev.quotes.get(id)!.priceCents, 0) : null;
    byDay.set(day, {
      ev, pricedIds,
      build: {
        id: `thp-${team.id}-${day}`, day, valuationAt: `${ev.nativeTimestamp}Z`,
        seasonId: day < HISTORY_SEASON_TWO_FROM ? "2025" : "2026",
        rosterRef: rosterRef(ev.roster), rosterStatus: "replayed", rosterCount: ev.roster.length,
        priced: pricedIds.length, subtotalCents,
        priceKind: pricedIds.length > 0 ? "recorded" : "unavailable",
        continuityId: pricedIds.length > 0 ? setId("seg", pricedIds) : null,
        pricedSetId: pricedIds.length > 0 ? setId("ps", pricedIds) : null,
        standalone: false,
      },
    });
  }
  const builds = [...byDay.values()].sort((a, b) => a.build.day.localeCompare(b.build.day));
  const points = builds.map(entry => entry.build);
  const firstPointDay = points[0]?.day ?? null;
  const lastPointDay = points.at(-1)?.day ?? null;

  // The current quote values the CURRENT membership — the anchor
  // roster, observed independently of the replay — at the latest
  // admitted instant that prices at least one current player. The last
  // historical observation is never relabeled as current: when a move
  // lands after the last quote instant, the replayed roster at that
  // instant is a historical roster, not today's.
  let currentQuote: TeamValueHistoryEnvelope["currentQuote"] = null;
  for (let i = instantList.length - 1; i >= 0; i--) {
    const [nativeTimestamp, at] = instantList[i];
    const pricedIds = anchorRoster.filter(id => at.has(id));
    if (pricedIds.length === 0) continue;
    currentQuote = {
      at: `${nativeTimestamp}Z`,
      subtotalCents: pricedIds.reduce((sum, id) => sum + at.get(id)!.priceCents, 0),
      priced: pricedIds.length, rosterCount: anchorRoster.length,
    };
    break;
  }

  // Generation fingerprint: binds the anchor roster, this team's
  // completed-move set, the admitted quote set (ids, exact native
  // timestamps, integer cents) and the roster/source bounds. Any
  // add/revise/prune of an admitted quote changes the generation.
  const admittedDays = quotes.map(quote => dayOf(quote.nativeTimestamp)).sort();
  const generation = `th1-${sha(JSON.stringify({
    v: 1, teamId: team.id, anchor: anchorRoster,
    moves: moves.map(move => [move.id, move.effectiveMs, move.type,
      move.adds.map(entry => [entry.playerId, entry.rosterId]), move.drops.map(entry => [entry.playerId, entry.rosterId])]),
    bounds: {
      players: [...new Set([...anchorRoster, ...moves.flatMap(move => [...move.adds, ...move.drops]
        .filter(entry => entry.rosterId === rosterId).map(entry => entry.playerId))])].sort(),
      fromDay: admittedDays[0] ?? null, toDay: admittedDays.at(-1) ?? null,
    },
    quotes: quotes.map(quote => [quote.quoteId, quote.playerId, quote.nativeTimestamp, quote.priceCents])
      .sort((a, b) => String(a[2]).localeCompare(String(b[2])) || String(a[0]).localeCompare(String(b[0]))),
  })).slice(0, 24)}`;

  // asOf is exactly the validated cutoff. Admitted evidence is bounded
  // by it, so no quote or move can pull asOf into the future.
  const asOf = args.now.toISOString();
  const leagueRange: TeamHistoryRange = { from: HISTORY_LEAGUE_FROM, toExclusive: shiftHistoryDay(asOf.slice(0, 10), 1) };
  const seasons: TeamValueHistoryEnvelope["seasons"] = [
    { id: "2025", label: "2025 season", leagueId: SEASON_ONE_LEAGUE_ID, range: { from: HISTORY_LEAGUE_FROM, toExclusive: HISTORY_SEASON_TWO_FROM } },
    { id: "2026", label: "2026 season", leagueId: LEAGUE_ID, range: { from: HISTORY_SEASON_TWO_FROM, toExclusive: leagueRange.toExclusive } },
  ];

  const coverage: TeamValueHistoryEnvelope["coverage"] = { roster: [], valuation: [] };
  coverage.roster.push({
    from: HISTORY_LEAGUE_FROM, toExclusive: HISTORY_SEASON_TWO_FROM, status: "ambiguous",
    reason: "Offseason keeper cuts between the 2025 and 2026 seasons appear in neither league's transaction feed, and this release carries no dated 2025 roster anchor; 2025 membership is not asserted.",
  });
  if (firstPointDay) {
    if (firstPointDay > HISTORY_SEASON_TWO_FROM) coverage.roster.push({
      from: HISTORY_SEASON_TWO_FROM, toExclusive: firstPointDay, status: "ambiguous",
      reason: "Roster proof in this release is asserted only across the retained recorded window; membership before the first retained recorded quote is not independently dated.",
    });
    coverage.roster.push({
      from: firstPointDay, toExclusive: leagueRange.toExclusive, status: "replayed",
      reason: "Membership replayed deterministically from the dated current-roster anchor through completed Sleeper moves in frozen order (status_updated, then transaction_id). Replayed is not independently verified.",
    });
    const spanDays = Math.round((Date.parse(`${lastPointDay}T00:00:00Z`) - Date.parse(`${firstPointDay}T00:00:00Z`)) / DAY_MS) + 1;
    coverage.valuation.push({
      from: HISTORY_LEAGUE_FROM, toExclusive: firstPointDay, status: "unavailable",
      reason: `No recorded modeled quotes are retained before ${firstPointDay}. The recorded source reaches back only that far; no price is reconstructed for earlier days.`,
    });
    coverage.valuation.push({
      from: firstPointDay, toExclusive: shiftHistoryDay(lastPointDay!, 1),
      status: points.length === spanDays ? "recorded" : "partial",
      reason: points.length === spanDays
        ? "Recorded modeled quotes captured contemporaneously in stock_snapshots; one point per day with a retained snapshot."
        : `Recorded modeled quotes exist on ${points.length} of ${spanDays} days in this span. Days without a retained snapshot have no point; no value is carried or inferred.`,
    });
    if (shiftHistoryDay(lastPointDay!, 1) < leagueRange.toExclusive) coverage.valuation.push({
      from: shiftHistoryDay(lastPointDay!, 1), toExclusive: leagueRange.toExclusive, status: "unavailable",
      reason: `No retained recorded quote after ${lastPointDay} yet.`,
    });
  } else {
    coverage.roster.push({
      from: HISTORY_SEASON_TWO_FROM, toExclusive: leagueRange.toExclusive, status: "ambiguous",
      reason: "No retained recorded quotes, so no supported roster band is asserted in this release.",
    });
    coverage.valuation.push({
      from: HISTORY_LEAGUE_FROM, toExclusive: leagueRange.toExclusive, status: "unavailable",
      reason: "No recorded modeled quotes are currently retained for this team.",
    });
  }

  const sourceNotes = [
    "Retained-source limitation: recorded points are read live from stock_snapshots, which keeps only the most recent 30 days. Until recorded points are persisted separately, recorded days fall out of this history as that window slides — this is not yet a permanent archive.",
    "Every point is a recorded modeled FAAB quote captured at the instant shown. Modeled quotes are not sale prices or team performance.",
    "Rosters are replayed from today's dated roster anchor through completed Sleeper moves; days outside the proven recorded window show no value rather than an assumed roster.",
    "Unknown prices are shown as unavailable, never as $0, and no line is drawn across days without a recorded point.",
  ];

  const base = {
    version: 1 as const, team: { id: team.id, name: team.name }, generation, asOf,
    resolution: "day" as const, timeZone: "UTC" as const, recordedTimestampConvention: "UTC-assumed" as const,
    leagueRange, seasons, coverage, currentQuote, sourceNotes,
  };

  function envelope(range: TeamHistoryRange): TeamValueHistoryEnvelope {
    if (!validHistoryRange(range) || range.from < leagueRange.from || range.toExclusive > leagueRange.toExclusive) {
      throw new TeamHistoryError("Requested range is outside the league's recorded bounds", 400);
    }
    return {
      ...base, requestedRange: range, loadedRange: range,
      points: points.filter(point => point.day >= range.from && point.day < range.toExclusive),
      page: { nextCursor: null },
    };
  }

  function toMove(move: HistoryMove, names: Record<string, RawPlayerEntry>): TeamHistoryMove {
    return {
      id: `move-${move.id}`, sourceId: move.id, sourceRef: `Sleeper transaction ${move.id}`,
      origin: "transaction", type: move.type, status: "complete",
      effectiveAt: instantIso(move.effectiveMs), day: null, precision: "instant",
      adds: move.adds.map(entry => ({ id: entry.playerId, name: playerName(names, entry.playerId) })),
      drops: move.drops.map(entry => ({ id: entry.playerId, name: playerName(names, entry.playerId) })),
      note: null,
    };
  }

  function detail(day: string, names: Record<string, RawPlayerEntry>): TeamValueHistoryDetail {
    const movesRange: TeamHistoryRange = {
      from: day > HISTORY_LEAGUE_FROM ? shiftHistoryDay(day, -1) : day,
      toExclusive: shiftHistoryDay(day, 1),
    };
    const inRange = moves.filter(move => {
      const moveDay = instantIso(move.effectiveMs).slice(0, 10);
      return moveDay >= movesRange.from && moveDay < movesRange.toExclusive;
    });
    const nearby = inRange.slice(0, TEAM_HISTORY_MAX_MOVES);
    const nearbyTruncated = inRange.length > TEAM_HISTORY_MAX_MOVES;
    const shared = { version: 1 as const, teamId: team.id, generation, day, movesRange, movesTruncated: nearbyTruncated };

    const found = byDay.get(day);
    if (found) {
      const { build, ev } = found;
      return {
        ...shared, valuationAt: build.valuationAt, pointId: build.id, rosterRef: build.rosterRef,
        rosterStatus: "replayed", rosterCount: build.rosterCount, priced: build.priced, subtotalCents: build.subtotalCents,
        rosterEvidence: [
          `Roster replayed from the dated anchor (current rosters observed ${anchor.observedAt}) through completed moves in frozen order (status_updated, then transaction_id).`,
          `${moves.filter(move => moveMicros(move) > ev.micros).length} completed move(s) involving this team are effective after this valuation instant and were inverted to derive this roster.`,
        ],
        players: ev.roster.map(id => {
          const quote = ev.quotes.get(id);
          return quote ? {
            id, name: playerName(names, id), priceCents: quote.priceCents,
            price: {
              kind: "recorded" as const, quoteId: quote.quoteId,
              recordedAt: `${quote.nativeTimestamp}Z`, nativeTimestamp: quote.nativeTimestamp,
              availableFrom: `${quote.nativeTimestamp}Z`, validUntil: null,
            },
            missingReason: null,
          } : {
            id, name: playerName(names, id), priceCents: null, price: null,
            missingReason: "No recorded quote for this player at this day's retained snapshot instant.",
          };
        }),
        moves: nearby.map(move => toMove(move, names)),
      };
    }

    if (firstPointDay && day >= firstPointDay && day <= asOf.slice(0, 10)) {
      // Proven band, no retained snapshot this day: roster stays
      // inspectable at the day's cutoff; no price is invented. The
      // cutoff is the earlier of end-of-day and the validated as-of
      // instant — for today, replay is claimed only through the cutoff,
      // never through an end-of-day that has not happened yet.
      const endOfDayMicros = instantMicros(`${day}T23:59:59.999999`);
      const capped = cutoffMicros < endOfDayMicros;
      const roster = rosterAt(Math.min(endOfDayMicros, cutoffMicros));
      if (roster) {
        return {
          ...shared, valuationAt: capped ? instantIso(cutoffMs) : `${day}T23:59:59.999999Z`, pointId: null, rosterRef: rosterRef(roster),
          rosterStatus: "replayed", rosterCount: roster.length, priced: 0, subtotalCents: null,
          rosterEvidence: [capped
            ? "Roster replayed as of the validated as-of cutoff on this UTC day; the rest of the day has not been observed. No retained recorded snapshot exists for this day, so no player is priced."
            : "Roster replayed as of the end of this UTC day. No retained recorded snapshot exists for this day, so no player is priced."],
          players: roster.map(id => ({
            id, name: playerName(names, id), priceCents: null, price: null,
            missingReason: "No retained recorded snapshot on this day.",
          })),
          moves: nearby.map(move => toMove(move, names)),
        };
      }
    }

    return {
      ...shared, valuationAt: `${day}T00:00:00.000000Z`, pointId: null, rosterRef: `unproven-${team.id}`,
      rosterStatus: "ambiguous", rosterCount: null, priced: 0, subtotalCents: null,
      rosterEvidence: [day < HISTORY_SEASON_TWO_FROM
        ? "The 2025 season is separated from the 2026 anchor by undated offseason keeper cuts; membership for this day cannot be established in this release."
        : "Membership for this day is outside the proven recorded window in this release."],
      players: [],
      moves: day >= HISTORY_SEASON_TWO_FROM ? nearby.map(move => toMove(move, names)) : [],
    };
  }

  function receipt(): TeamHistoryReceipt {
    return {
      teamId: team.id, generation, anchor: { observedAt: anchor.observedAt, roster: anchorRoster },
      points: builds.map(({ build, ev, pricedIds }) => ({
        pointId: build.id, day: build.day, valuationAt: build.valuationAt, roster: ev.roster,
        pricedPlayerIds: pricedIds, subtotalCents: build.subtotalCents,
        generationMoves: moves.filter(move => moveMicros(move) > ev.micros)
          .map(move => ({ id: move.id, type: move.type, effectiveAt: instantIso(move.effectiveMs) })),
      })),
    };
  }

  return {
    team: { id: team.id, name: team.name }, generation, asOf, leagueRange, seasons, coverage,
    sourceNotes, points, currentQuote, envelope, detail, receipt,
  };
}

function playerName(names: Record<string, RawPlayerEntry>, id: string): string {
  const entry = names[id];
  if (!entry) return `Player ${id}`;
  return entry.full_name ?? ([entry.first_name, entry.last_name].filter(Boolean).join(" ") || `Player ${id}`);
}

/* ------------------------------ loading ------------------------------ */

function validQuote(quote: RecordedQuote): boolean {
  return typeof quote.quoteId === "string" && quote.quoteId.length > 0
    && typeof quote.playerId === "string" && quote.playerId.length > 0
    && Number.isSafeInteger(quote.priceCents) && quote.priceCents >= 0
    && typeof quote.nativeTimestamp === "string" && historyInstantKey(`${quote.nativeTimestamp}Z`) !== null;
}

/**
 * Load and build one team's producer state. Throws TeamHistoryError:
 * 503 when a source is unavailable or fails closed, 404 for an unknown
 * team. The quote read is bounded to the team's lifetime player scope
 * (anchor roster plus its move counterparties) over the full league
 * window; a truncated read is an incomplete admitted set → 503.
 */
export async function loadTeamHistoryState(teamId: string, deps: TeamHistoryDeps = {}): Promise<TeamHistoryState> {
  const store = deps.quotes === undefined ? getRecordedQuoteStore() : deps.quotes;
  if (!store) throw new TeamHistoryError("Recorded quote source is unavailable", 503);
  let anchor: HistoryAnchor, moves: HistoryMove[];
  try {
    [anchor, moves] = await Promise.all([
      (deps.fetchAnchor ?? defaultAnchor)(), (deps.fetchMoves ?? defaultMoves)(),
    ]);
  } catch {
    throw new TeamHistoryError("League sources are unavailable", 503);
  }
  const team = anchor.teams.find(entry => entry.id === teamId);
  if (!team) throw new TeamHistoryError("Unknown team", 404);
  const now = (deps.now ?? (() => new Date()))();
  const scope = [...new Set([...team.players, ...moves.flatMap(move => [...move.adds, ...move.drops]
    .filter(entry => entry.rosterId === Number(teamId)).map(entry => entry.playerId))])].sort();
  let rows;
  try {
    rows = await store.readWindow({
      playerIds: scope, fromDay: HISTORY_LEAGUE_FROM, toDay: shiftHistoryDay(now.toISOString().slice(0, 10), 1),
    });
  } catch {
    throw new TeamHistoryError("Recorded quote source is unavailable", 503);
  }
  if (rows.truncated) throw new TeamHistoryError("Recorded quote window exceeds its bound; refusing a partial admitted set", 503);
  if (!rows.quotes.every(validQuote)) throw new TeamHistoryError("Recorded quote source returned a malformed row", 503);
  return buildState({ anchor, team, moves, quotes: rows.quotes, now });
}

/**
 * Homepage loader: the full league-window envelope for the viewer's
 * team, or null when any source is unavailable (the section then keeps
 * its existing fallback — the site renders with partial data, never
 * crashes, and never substitutes an invented series).
 */
export async function getTeamValueHistory(teamId: string, deps: TeamHistoryDeps = {}): Promise<TeamValueHistoryEnvelope | null> {
  try {
    const state = await loadTeamHistoryState(teamId, deps);
    const envelope = state.envelope(state.leagueRange);
    return isTeamValueHistoryEnvelope(envelope) ? envelope : null;
  } catch {
    return null;
  }
}

/* --------------------------- route responses --------------------------- */

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function boundedJson(body: unknown): Response {
  if (new TextEncoder().encode(JSON.stringify(body)).byteLength > MAX_RESPONSE_BYTES) {
    return json({ error: "History response exceeds its bound" }, 503);
  }
  return json(body, 200);
}

function requiredParam(url: URL, name: string): string {
  const value = url.searchParams.get(name);
  if (!value) throw new TeamHistoryError(`Missing ${name} parameter`, 400);
  return value;
}

function dayParam(url: URL, name: string): string {
  const value = requiredParam(url, name);
  if (!validHistoryDay(value)) throw new TeamHistoryError(`Invalid ${name} day`, 400);
  return value;
}

/** Summary route: GET /api/team-value-history/summary?teamId&generation&from&toExclusive */
export async function teamHistorySummaryResponse(url: URL, deps: TeamHistoryDeps = {}): Promise<Response> {
  try {
    const teamId = requiredParam(url, "teamId");
    const generation = requiredParam(url, "generation");
    const range = { from: dayParam(url, "from"), toExclusive: dayParam(url, "toExclusive") };
    if (url.searchParams.has("cursor")) {
      throw new TeamHistoryError("This producer serves the full requested range in one page; cursors are not issued", 400);
    }
    if (!validHistoryRange(range)) throw new TeamHistoryError("Expected from < toExclusive", 400);
    const spanDays = Math.round((Date.parse(`${range.toExclusive}T00:00:00Z`) - Date.parse(`${range.from}T00:00:00Z`)) / DAY_MS);
    if (spanDays > TEAM_HISTORY_MAX_POINTS) throw new TeamHistoryError(`Range exceeds the ${TEAM_HISTORY_MAX_POINTS}-point summary cap`, 400);
    const state = await loadTeamHistoryState(teamId, deps);
    if (generation !== state.generation) throw new TeamHistoryError("History has changed; refresh for the new generation", 409);
    const envelope = state.envelope(range);
    if (!isTeamValueHistoryEnvelope(envelope)) return json({ error: "History envelope failed validation" }, 503);
    return boundedJson(envelope);
  } catch (error) {
    if (error instanceof TeamHistoryError) return json({ error: error.message }, error.status);
    return json({ error: "History unavailable" }, 503);
  }
}

/** Detail route: GET /api/team-value-history/detail?teamId&generation&day */
export async function teamHistoryDetailResponse(url: URL, deps: TeamHistoryDeps = {}): Promise<Response> {
  try {
    const teamId = requiredParam(url, "teamId");
    const generation = requiredParam(url, "generation");
    const day = dayParam(url, "day");
    const state = await loadTeamHistoryState(teamId, deps);
    if (generation !== state.generation) throw new TeamHistoryError("History has changed; refresh for the new generation", 409);
    if (day < state.leagueRange.from || day >= state.leagueRange.toExclusive) {
      throw new TeamHistoryError("Day is outside the league's recorded bounds", 400);
    }
    let names: Record<string, RawPlayerEntry> = {};
    try {
      names = await (deps.fetchNames ?? fetchPlayerDirectory)();
    } catch {
      names = {}; // Names degrade to "Player <id>" stubs; evidence is unaffected.
    }
    const detail = state.detail(day, names);
    if (!isTeamValueHistoryDetail(detail)) return json({ error: "History detail failed validation" }, 503);
    return boundedJson(detail);
  } catch (error) {
    if (error instanceof TeamHistoryError) return json({ error: error.message }, error.status);
    return json({ error: "History unavailable" }, 503);
  }
}
