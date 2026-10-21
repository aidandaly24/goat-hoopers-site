/**
 * team-value-history.ts — the recorded-only producer for issue #217,
 * with forward-replay membership wired in under the #224 contract
 * (semantics confirmed on the issue: comments 6311714485, 6311832961,
 * 6312076373, 6312158306, 6312224861, 6312327589).
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
 *   at load time. The anchor still values the CURRENT quote (today's
 *   independently observed membership) and binds the generation.
 * - Dated membership from the forward roster replay
 *   (`loadChainRosterReplay` in `roster-replay.ts`): both segments
 *   replay FORWARD from pinned anchors (the 2025 startup draft; the
 *   derived 2026 season boundary) and verify against Sleeper's
 *   observed rosters at load. A team's roster at a quote instant is
 *   the replay's membership at that instant — priced days evaluate
 *   at the exact quote instant, unpriced completed days at UTC day
 *   end, today at the fixed as-of cutoff — never an inversion of the
 *   anchor. Days the replay does not prove (the offseason gap,
 *   pre-anchor, past the cutoff) stay unpriced and are reported
 *   ambiguous/unavailable, never stretched. The inventory of
 *   retained quotes / reconstruction inputs against this proven
 *   membership lives in `docs/team-value-history-inventory.md`.
 * - The completed-move generation over the public Sleeper transaction
 *   feeds of BOTH leagues in the chain — the current league, over the
 *   week range the live season state proves, and the inaugural 2025
 *   league, over its fixed, final week range 1–24 — in the frozen
 *   replay ordering (status_updated asc, tie-break transaction_id,
 *   complete-only, trades atomic). This stream is the day-detail
 *   EVENT evidence (2025 events included) and binds the generation;
 *   it no longer derives membership.
 *
 * 2025 EVENTS (#224 amendment to the #217 recorded-only contract,
 * agreed on-thread): the 2025 league's completed moves are emitted in
 * day detail as dated, sourced EVENTS — team-scoped legs (every add /
 * drop carries its roster id), declared participants, shaped draft
 * picks and waiver FAAB. Events assert only their own legs. Under
 * the wiring contract the 2025 roster band is `replayed` wherever
 * the forward replay proves membership, and 2025 day detail lists
 * the replayed roster with every price null — but 2025 valuation
 * stays `unavailable` and no 2025 point is emitted: no recorded
 * quote exists for any 2025 day in a retained source, and no price
 * is reconstructed (see the inventory doc). The offseason gap
 * (2026-04-02 → 2026-08-12) has no rows in either feed, gets no
 * events, and asserts no membership.
 *
 * LEAGUE PROVENANCE (dot P1 on PR #236): every normalized move carries
 * the league whose feed produced it, and the two feeds are normalized
 * separately before they merge — provenance can never be lost in the
 * merge. Only the CURRENT league's moves enter the receipt's
 * generation-move list: the anchor is the current league's roster,
 * so attributing another league's move to it is a category error
 * regardless of the move's timestamps (a 2025-feed trade whose
 * `status_updated` lands in Oct 2026 must never rewrite recorded
 * 2026 rosters). Prior-league moves are day-detail display events
 * only. Provenance is bound into the generation hash and emitted on
 * every DTO move (`leagueId`).
 *
 * TEAM RELEVANCE (dot P2 on PR #236): a move belongs to a team's
 * history when its player legs touch the team, its declared
 * participants (`roster_ids`) include the team, or its draft picks
 * name the team as pick roster / owner / previous owner. A pick-only
 * trade therefore emits as an event for both teams and rebinds their
 * generations even though it has no player legs at all.
 *
 * MALFORMED COMPLETED ROWS (dot P2 on PR #236): normalization
 * validates every completed record before the feed is accepted as
 * complete — a completed row with no usable timestamp, an unreadable
 * player leg, a malformed participant list, a malformed waiver bid or
 * a present-but-unreadable `draft_picks` field rejects the whole load
 * (503) instead of being silently dropped or flattened into the
 * absent-field shape. Non-complete rows remain non-evidence and are
 * skipped without validation: only completed records assert history.
 *
 * NO-WRITE BOUNDARY (amendment 1 on #217): this module performs zero
 * Neon writes — no migration apply, no population of the #219 tables
 * (sleeper_transactions / roster_snapshots_daily / roster_boundary_moves
 * / team_value_points), no backfill, and no reconstruction of
 * pre-Oct-2026 prices. Persisting recorded points against the 30-day
 * prune is a separate, separately reviewed PR.
 *
 * GENERATION (wiring contract §4 on #224, settled): a generation is
 * the opaque token `th2:<canonical-asOf>:<evidence-hash>` — canonical
 * ms UTC ISO with exact round-trip validation, colon-delimited. The
 * hash extends the retired th1 fingerprint (payload version 2): it
 * binds BOTH replay anchors (2025 draft assignments; 2026 derived
 * boundary rosters), BOTH drafts' metadata witnesses (draft ids,
 * declared rounds × teams, `draft_order` slot sets, league binding),
 * the chain's admitted moves for both leagues with provenance plus
 * its applied draft events, the boundary reconciliation, the source
 * bounds (incl. `gapRange`), the anchor roster, this team's
 * completed-move event set, the admitted recorded quote set (quote
 * ids + exact native timestamps + integer cents) and the shared
 * fixed cutoff. `HistoryAnchor.observedAt` is deliberately NOT
 * bound — a fetch timestamp is not evidence. Summary and detail
 * helpers parse the token before loading (see `pinnedCutoff`, the
 * one place the status mapping lives), inject its cutoff as one
 * constant clock into BOTH loaders, recompute bounded at it and
 * compare the whole recomputed generation: equality serves the view
 * with the envelope `asOf` fixed at the token cutoff; any mismatch —
 * drift, correction, or genuine source advance, including replay
 * admission rejections that only occur because sources moved past
 * the pinned cutoff — is HTTP 409/refresh instead of a silently
 * different day; malformed evidence and genuine source outage stay
 * 503. Legacy `th1-…` tokens take the refresh-409 path, never a
 * silent upgrade. Envelope `version` stays 1 and `generation`
 * remains an opaque string to the DTO validators, so no client
 * transport change is needed.
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
  type TeamHistoryDraftPick, type TeamHistoryMove, type TeamHistoryPoint, type TeamHistoryRange,
  type TeamValueHistoryDetail, type TeamValueHistoryEnvelope,
} from "@/domain/team-value-history";
import { getRecordedQuoteStore, type RecordedQuote, type RecordedQuoteStore } from "./recorded-quotes";
import type { RosterMembership } from "@/domain/roster-replay";
import {
  loadChainRosterReplay, RosterReplayAdvanceError,
  type ChainRosterReplay, type SeasonRosterReplay,
} from "./roster-replay";
import {
  fetchNbaState, fetchPlayerDirectory, fetchRosters, fetchUsers, LEAGUE_ID,
  type RawPlayerEntry, type RawTransaction,
} from "./sleeper";
import { fetchTransactionsByWeekComplete, fetchTransactionsByWeekCompleteForLeague, validSeasonWeeks } from "./league";
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
  /** The league whose transaction feed carried this record. */
  leagueId: string;
  type: TeamHistoryMove["type"];
  /** Effective instant: `status_updated`, falling back to `created`. */
  effectiveMs: number;
  /** Sleeper week ("leg"); null when the record carries no valid one. */
  leg: number | null;
  /** Declared participant roster ids (`roster_ids`). */
  rosterIds: number[];
  adds: { playerId: string; rosterId: number }[];
  drops: { playerId: string; rosterId: number }[];
  /** FAAB paid on a waiver claim (`settings.waiver_bid`); null when absent. */
  waiverBid: number | null;
  /**
   * Draft picks carried by the record, shaped; null when the record
   * does not carry the `draft_picks` field at all (not read), [] when
   * it carries none.
   */
  draftPicks: TeamHistoryDraftPick[] | null;
};

export type TeamHistoryDeps = {
  quotes?: RecordedQuoteStore | null;
  fetchAnchor?: () => Promise<HistoryAnchor>;
  fetchMoves?: () => Promise<HistoryMove[]>;
  fetchNames?: () => Promise<Record<string, RawPlayerEntry>>;
  /**
   * The forward-replay chain (dated membership for both seasons).
   * The default loads it from Sleeper with the SAME clock as the
   * history load, so chain `asOf` === envelope `asOf` for every
   * generation — fresh or pinned.
   */
  fetchChain?: () => Promise<ChainRosterReplay>;
  now?: () => Date;
};

/** Source-confirmed league start: the founding draft day, 2025-10-20. */
export const HISTORY_LEAGUE_FROM = "2025-10-20";
/** First day of the 2026 league's transaction feed (season boundary). */
export const HISTORY_SEASON_TWO_FROM = "2026-08-13";
export const SEASON_ONE_LEAGUE_ID = "1282883196567977984";
/**
 * The 2025 league's week range is fixed and final: its feed is
 * complete (weeks 1–24, audited on #217) and can never grow, so the
 * strict loader reads exactly that range rather than deriving weeks
 * from live season state that describes the current season only.
 */
export const SEASON_ONE_WEEKS = Array.from({ length: 24 }, (_, i) => i + 1);
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

const positiveInt = (value: unknown): number | null =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 1 ? value : null;

/**
 * Shape a record's carried `draft_picks` from their own identifiers.
 * Sleeper omits the field entirely on records that predate pick
 * trading, so absence is preserved as null — "not read" — instead of
 * being flattened into the [] that means "read, and the record
 * carried no picks". Entries that are not objects keep their place
 * with every field null: the pick was carried, its identifiers were
 * not. The caller has already established the field is an array; a
 * present non-array field is malformed and never reaches here.
 */
function shapeDraftPicks(raw: unknown[]): TeamHistoryDraftPick[] {
  return raw.map(entry => {
    if (!entry || typeof entry !== "object") {
      return { season: null, round: null, rosterId: null, ownerId: null, previousOwnerId: null };
    }
    const pick = entry as Record<string, unknown>;
    return {
      season: typeof pick.season === "string" && pick.season.length > 0 ? pick.season
        : typeof pick.season === "number" && Number.isSafeInteger(pick.season) ? String(pick.season) : null,
      round: positiveInt(pick.round),
      rosterId: positiveInt(pick.roster_id),
      ownerId: positiveInt(pick.owner_id),
      previousOwnerId: positiveInt(pick.previous_owner_id),
    };
  });
}

/** The frozen replay order: effective instant asc, transaction_id tie-break. */
const byFrozenOrder = (a: HistoryMove, b: HistoryMove): number =>
  a.effectiveMs - b.effectiveMs || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * Merge per-league move sets into one frozen-order stream. The sets
 * are normalized separately first (see `toHistoryMoves`), so every
 * move keeps its league provenance through the merge.
 */
export function mergeHistoryMoveSets(...sets: HistoryMove[][]): HistoryMove[] {
  return sets.flat().sort(byFrozenOrder);
}

function malformedCompleted(reason: string): Error {
  return new Error(`Sleeper transaction feed carries a malformed completed record: ${reason}`);
}

/** A present timestamp must be a finite number; absent stays absent. */
const finiteStamp = (value: unknown): number | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw malformedCompleted("a timestamp is present but not a finite number");
  }
  return value;
};

/** Validate one player-leg map of a completed record; absent is empty. */
function validLegs(
  record: Record<string, number> | null | undefined, field: "adds" | "drops", txId: string,
): { playerId: string; rosterId: number }[] {
  if (record === null || record === undefined) return [];
  if (typeof record !== "object" || Array.isArray(record)) {
    throw malformedCompleted(`completed record ${txId} carries ${field} that is not a player-to-roster map`);
  }
  return Object.entries(record).map(([playerId, rosterId]) => {
    if (playerId.length === 0 || !Number.isSafeInteger(rosterId) || rosterId < 1) {
      throw malformedCompleted(`completed record ${txId} carries an unreadable ${field} leg`);
    }
    return { playerId, rosterId };
  });
}

/**
 * Raw Sleeper transactions from ONE league's feed → that league's
 * completed moves in the frozen replay order, each stamped with the
 * league's provenance. Feeds are normalized separately and combined
 * with `mergeHistoryMoveSets`, never pooled raw — pooling would strip
 * the provenance the receipt boundary depends on.
 *
 * Completed records are validated before the feed is accepted as
 * complete: a completed row with no usable timestamp, an unreadable
 * leg, a malformed participant list, a malformed waiver bid, or a
 * present-but-unreadable `draft_picks` field throws, and the loader
 * fails closed (503) — silently dropping such a row would understate
 * the very evidence the feed's completeness is claimed from, and
 * flattening a present malformed `draft_picks` into the absent-field
 * null would misreport what the record carried. Non-complete rows are
 * skipped unvalidated: they assert no history.
 */
export function toHistoryMoves(raw: RawTransaction[], leagueId: string): HistoryMove[] {
  const moves: HistoryMove[] = [];
  for (const tx of raw) {
    if (!tx || typeof tx !== "object" || Array.isArray(tx)) {
      throw malformedCompleted("a row is not an object");
    }
    if (tx.status !== "complete") continue;
    if (typeof tx.transaction_id !== "string" || tx.transaction_id.length === 0) {
      throw malformedCompleted("a completed record carries no transaction_id");
    }
    const id = tx.transaction_id;
    const effectiveMs = finiteStamp(tx.status_updated) ?? finiteStamp(tx.created);
    if (effectiveMs === undefined) {
      throw malformedCompleted(`completed record ${id} carries no timestamp`);
    }
    let rosterIds: number[] = [];
    if (tx.roster_ids !== undefined) {
      if (!Array.isArray(tx.roster_ids) || !tx.roster_ids.every(entry => Number.isSafeInteger(entry) && entry >= 1)) {
        throw malformedCompleted(`completed record ${id} carries a malformed roster_ids list`);
      }
      rosterIds = [...tx.roster_ids];
    }
    let waiverBid: number | null = null;
    if (tx.settings !== undefined && tx.settings !== null) {
      if (typeof tx.settings !== "object" || Array.isArray(tx.settings)) {
        throw malformedCompleted(`completed record ${id} carries malformed settings`);
      }
      if (tx.settings.waiver_bid !== undefined) {
        const bid = tx.settings.waiver_bid;
        if (typeof bid !== "number" || !Number.isSafeInteger(bid) || bid < 0) {
          throw malformedCompleted(`completed record ${id} carries a malformed waiver_bid`);
        }
        waiverBid = bid;
      }
    }
    let draftPicks: TeamHistoryDraftPick[] | null;
    if (tx.draft_picks === undefined) draftPicks = null;
    else if (Array.isArray(tx.draft_picks)) draftPicks = shapeDraftPicks(tx.draft_picks);
    else throw malformedCompleted(`completed record ${id} carries a present but unreadable draft_picks field`);
    moves.push({
      id, leagueId, type: moveType(tx.type), effectiveMs,
      leg: Number.isSafeInteger(tx.leg) && tx.leg >= 0 ? tx.leg : null,
      rosterIds,
      adds: validLegs(tx.adds, "adds", id), drops: validLegs(tx.drops, "drops", id),
      waiverBid, draftPicks,
    });
  }
  return moves.sort(byFrozenOrder);
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
  // Both league feeds load through the strict fetcher, in parallel:
  // the current league over its state-proven week range, the 2025
  // league over its fixed final range. Either lane failing rejects
  // the whole load — a silent 2025 week would understate the sourced
  // events day detail asserts, exactly as a silent 2026 week would
  // invent roster membership.
  const [current, seasonOne] = await Promise.all([
    fetchTransactionsByWeekComplete(weeks),
    fetchTransactionsByWeekCompleteForLeague(SEASON_ONE_LEAGUE_ID, SEASON_ONE_WEEKS),
  ]);
  // Normalize each feed separately so every move keeps its league
  // provenance, then merge in frozen order. Pooling the raw rows and
  // normalizing once would strip the provenance the receipt
  // boundary (current league only) depends on.
  return mergeHistoryMoveSets(
    toHistoryMoves(seasonOne.flat(), SEASON_ONE_LEAGUE_ID),
    toHistoryMoves(current.flat(), LEAGUE_ID),
  );
}

/* --------------------------- producer state --------------------------- */

type InstantEval = {
  nativeTimestamp: string;
  /** The instant at native microsecond precision (epoch µs). */
  micros: number;
  roster: string[];
  /** The forward-replay membership snapshot this roster came from. */
  membership: RosterMembership;
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
    /** Completed current-league moves effective after this point — the delta to the anchor roster. */
    generationMoves: { id: string; type: string; effectiveAt: string }[];
  }[];
};

/* --------------------- generation evidence (§4) --------------------- */

const evidenceMove = (move: HistoryMove) => [
  move.leagueId, move.id, move.effectiveMs, move.type, move.leg, move.rosterIds, move.waiverBid, move.draftPicks,
  move.adds.map(entry => [entry.playerId, entry.rosterId]), move.drops.map(entry => [entry.playerId, entry.rosterId]),
];
const evidenceRosters = (rosters: Map<number, string[]>) =>
  [...rosters.entries()].sort((a, b) => a[0] - b[0]).map(([id, players]) => [id, [...players].sort()]);

/** One replay segment's full evidence, as the generation binds it. */
function segmentEvidence(segment: SeasonRosterReplay) {
  return {
    leagueId: segment.leagueId, draftId: segment.draftId,
    grid: { rounds: segment.grid.rounds, slots: segment.grid.slots },
    anchorAt: segment.anchorAt,
    anchorRosters: evidenceRosters(segment.timeline.rostersAt(segment.timeline.anchorAtMs)),
    finalRosters: evidenceRosters(segment.finalRosters),
    preAnchorMoves: segment.timeline.preAnchorMoves.map(evidenceMove),
    appliedMoves: segment.timeline.appliedMoves.map(evidenceMove),
    appliedDraftEvents: segment.timeline.appliedDraftEvents.map(event => [
      event.draftId, event.effectiveMs, event.adds.map(add => [add.playerId, add.rosterId]),
    ]),
  };
}

/**
 * The chain-level evidence the th2 hash binds: both anchors, both
 * drafts' metadata witnesses, both leagues' admitted moves (whole —
 * never team-filtered), the boundary reconciliation and the gap
 * bounds. Computed identically at envelope load and child recompute.
 */
function chainEvidence(chain: ChainRosterReplay) {
  return {
    asOf: chain.asOf,
    seasonOne: segmentEvidence(chain.seasonOne),
    seasonTwo: { ...segmentEvidence(chain.seasonTwo), reconciliation: chain.seasonTwo.reconciliation },
    gapRange: chain.gapRange,
  };
}

/**
 * Every player the forward replay PROVES was on this roster in
 * either segment: both segments' final rosters plus every add/drop
 * leg the timelines carry for the slot (pre-anchor evidence, applied
 * moves, draft-event additions). This is the membership-derived half
 * of the quote scope: a player the replay proves on the team can
 * hold a retained quote at a proven instant, and that quote is this
 * team's evidence even when neither today's anchor nor a
 * current-league move leg names them — the 2025-only player is the
 * canonical case (dot review note on #244). Membership alone still
 * mints no point: a point exists only where a retained quote was
 * actually read at a proven instant.
 */
function chainProvenPlayers(chain: ChainRosterReplay, rosterId: number): string[] {
  const proven = new Set<string>();
  for (const segment of [chain.seasonOne, chain.seasonTwo]) {
    for (const playerId of segment.finalRosters.get(rosterId) ?? []) proven.add(playerId);
    for (const move of [...segment.timeline.preAnchorMoves, ...segment.timeline.appliedMoves]) {
      for (const entry of [...move.adds, ...move.drops]) {
        if (entry.rosterId === rosterId) proven.add(entry.playerId);
      }
    }
    for (const event of segment.timeline.appliedDraftEvents) {
      for (const entry of event.adds) {
        if (entry.rosterId === rosterId) proven.add(entry.playerId);
      }
    }
  }
  return [...proven];
}

/* ------------------------- detail evidence ------------------------- */

const listIds = (ids: readonly string[]): string =>
  ids.length <= 20 ? ids.join(", ") : `${ids.slice(0, 20).join(", ")} +${ids.length - 20} more`;

/**
 * Render one membership snapshot's provenance into detail
 * `rosterEvidence` (prose, per the confirmed §3 mapping on #224):
 * the draft/boundary basis, league and anchor instant ride here; the
 * structured inspection instant stays `detail.valuationAt`.
 * `movesApplied` is league-wide replay depth, never a team count,
 * and the reconciliation is presented as the derivation it is —
 * never as a sourced trade.
 */
function membershipEvidence(membership: RosterMembership): string[] {
  const provenance = membership.provenance;
  const basis = provenance.anchorKind === "draft"
    ? `Membership replayed forward from the completed startup draft of league ${provenance.anchorLeagueId} `
      + `(anchor ${provenance.anchorAt}); the segment's final rosters are verified against Sleeper's observed rosters at load.`
    : `Membership replayed forward from the season-boundary reconciliation of league ${provenance.anchorLeagueId} `
      + `(anchor ${provenance.anchorAt}): the boundary roster is derived from the observed current rosters by inverting `
      + `the 2026 feed, segmented at the 2026 draft; the segment's final rosters are verified against Sleeper's observed rosters at load.`;
  const depth = `${provenance.movesApplied} completed move(s) applied league-wide between the anchor and this instant — `
    + "replay depth, not this team's move count. Intermediate instants are replay-asserted, not independently verified.";
  const evidence = [basis, depth];
  const reconciliation = provenance.reconciliation;
  if (reconciliation) {
    evidence.push(reconciliation.cuts.length === 0 && reconciliation.additions.length === 0
      ? "Boundary reconciliation for this slot is empty: the derived boundary roster equals the prior season's final roster, "
        + "so every departure is a recorded move. The reconciliation is a derivation, not a sourced transaction."
      : `Boundary reconciliation for this slot records ${reconciliation.cuts.length} silent cut(s) (${listIds(reconciliation.cuts)}) `
        + `and ${reconciliation.additions.length} silent addition(s) (${listIds(reconciliation.additions)}) across the offseason gap. `
        + "The reconciliation is a derivation from the two seasons' evidence, not a sourced transaction.");
  }
  return evidence;
}

function buildState(args: {
  anchor: HistoryAnchor;
  team: { id: string; name: string; players: string[] };
  moves: HistoryMove[];
  quotes: RecordedQuote[];
  chain: ChainRosterReplay;
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
  // A move belongs to this team's history when its player legs touch
  // the team, its declared participants include the team, or its draft
  // picks name the team — a pick-only trade is an event for both
  // participants even though it has no player legs.
  const touchesTeam = (move: HistoryMove) =>
    move.adds.some(entry => entry.rosterId === rosterId) || move.drops.some(entry => entry.rosterId === rosterId)
    || move.rosterIds.includes(rosterId)
    || (move.draftPicks ?? []).some(pick => pick.rosterId === rosterId
      || pick.ownerId === rosterId || pick.previousOwnerId === rosterId);
  const moves = args.moves.filter(move => moveMicros(move) <= cutoffMicros && touchesTeam(move));
  // The receipt's move stream: ONLY the current league's moves — a
  // prior league's move, whatever its timestamps, describes a
  // different roster universe, and prior-league moves in `moves` are
  // day-detail display events only. (Membership itself no longer
  // derives from this stream at all; it comes from the forward
  // replay below.)
  const receiptMoves = moves.filter(move => move.leagueId === LEAGUE_ID);

  /**
   * Membership at an instant (epoch µs), from the forward replay.
   * The cutoff comparison has already happened at µs precision in
   * the admission filter above; only admitted instants are converted
   * to the replay's millisecond granularity here (Sleeper move
   * instants are epoch ms, so flooring an admitted instant is exact
   * for move ordering). Returns null where the replay proves no
   * membership — the offseason gap, before the founding draft
   * completed, or past the cutoff — and the day stays unpriced.
   */
  const chain = args.chain;
  function membershipAtMicros(micros: number): RosterMembership | null {
    return chain.membershipAt(rosterId, Math.floor(micros / 1000));
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
    const membership = membershipAtMicros(micros);
    if (membership) {
      evals.push({ nativeTimestamp, micros, roster: membership.playerIds, membership, quotes: at });
    }
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
    // A proven-EMPTY roster is a real $0, never an unknown: the
    // domain contract's known-empty zero invariant — the same one
    // detail()'s unpriced-day branch enforces. A quote instant can
    // land on an empty roster day (a retained quote for a player the
    // replay has since proven off the team); subtotal null there
    // would violate both DTO validators and fail the whole envelope.
    const subtotalCents = ev.roster.length === 0 ? 0
      : pricedIds.length > 0
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

  // Generation (§4 on #224): `th2:<canonical-asOf>:<evidence-hash>`.
  // The hash payload (v2) binds the whole evidence view — the replay
  // chain's anchors, draft witnesses, admitted moves and
  // reconciliation enter WHOLE, not filtered to this team's legs, so
  // evidence drift anywhere in the chain invalidates every team's
  // token; this team's anchor roster, event-move set and admitted
  // quote set bind as before; the shared fixed cutoff binds the view
  // in time. `HistoryAnchor.observedAt` stays out: a fetch timestamp
  // is not evidence, and binding it would manufacture perpetual
  // 409s. The hash-input set is identical at envelope load and at
  // child recompute — both build state through this same function.
  const admittedDays = quotes.map(quote => dayOf(quote.nativeTimestamp)).sort();
  const generation = `th2:${args.now.toISOString()}:${sha(JSON.stringify({
    v: 2, teamId: team.id, cutoff: args.now.toISOString(), anchor: anchorRoster,
    chain: chainEvidence(chain),
    moves: moves.map(move => [move.leagueId, move.id, move.effectiveMs, move.type, move.leg, move.rosterIds, move.waiverBid, move.draftPicks,
      move.adds.map(entry => [entry.playerId, entry.rosterId]), move.drops.map(entry => [entry.playerId, entry.rosterId])]),
    bounds: {
      players: [...new Set([...anchorRoster, ...chainProvenPlayers(chain, rosterId), ...moves.flatMap(move => [...move.adds, ...move.drops]
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
  // Roster coverage is the forward replay's proof map (§§1–3 on
  // #224): both segments replayed from their pinned anchors, the
  // offseason gap — the chain's own returned range — asserted as
  // nothing. Day detail still lists the 2025 league's completed
  // moves as sourced events; each event asserts only its own legs,
  // and membership now comes from the replay, never from the events.
  coverage.roster.push({
    from: HISTORY_LEAGUE_FROM, toExclusive: chain.gapRange.from, status: "replayed",
    reason: "Membership replayed forward from the 2025 startup draft's own assignments through the season's completed moves in frozen order (status_updated, then transaction_id); the segment's final rosters are verified against Sleeper's observed rosters at load. Replayed is not independently verified at intermediate instants.",
  });
  // The gap band exists only when the gap is non-empty. When the
  // 2025 segment's last move lands on the boundary eve, the
  // day-rounded gap start equals the boundary itself and the gap is
  // the empty interval [boundary, boundary): no day sits inside it,
  // so there is nothing to be ambiguous about — the segments touch
  // and coverage is replayed | replayed. Emitting the empty interval
  // as a band would produce a zero-length range the DTO rejects,
  // nulling the whole envelope over a nonexistent gap.
  if (chain.gapRange.from < chain.gapRange.toExclusive) coverage.roster.push({
    from: chain.gapRange.from, toExclusive: chain.gapRange.toExclusive, status: "ambiguous",
    reason: "The offseason gap between the 2025 and 2026 seasons carries no rows in either league's transaction feed, so no day inside it asserts membership. The 2026 boundary roster is derived by an explicit reconciliation (see the day detail's roster evidence), never observed day by day.",
  });
  coverage.roster.push({
    from: HISTORY_SEASON_TWO_FROM, toExclusive: leagueRange.toExclusive, status: "replayed",
    reason: "Membership replayed forward from the derived season-boundary roster through the 2026 league's completed moves and its draft, in frozen order; the segment's final rosters are verified against Sleeper's observed current rosters at load. Replayed is not independently verified at intermediate instants.",
  });
  if (firstPointDay) {
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
    coverage.valuation.push({
      from: HISTORY_LEAGUE_FROM, toExclusive: leagueRange.toExclusive, status: "unavailable",
      reason: "No recorded modeled quotes are currently retained for this team.",
    });
  }

  const sourceNotes = [
    "Retained-source limitation: recorded points are read live from stock_snapshots, which keeps only the most recent 30 days. Until recorded points are persisted separately, recorded days fall out of this history as that window slides — this is not yet a permanent archive.",
    "Every point is a recorded modeled FAAB quote captured at the instant shown. Modeled quotes are not sale prices or team performance.",
    "Rosters are replayed forward from pinned anchors — the 2025 startup draft and the derived 2026 season boundary — through completed Sleeper moves; the offseason gap asserts no membership, and no day outside the proven replay shows an assumed roster.",
    "Unknown prices are shown as unavailable, never as $0, and no line is drawn across days without a recorded point.",
    "Moves shown for 2025 days are that season's completed Sleeper transactions, listed as sourced events with team-scoped legs, picks and waiver FAAB; each event asserts only its own legs. 2025 membership itself is asserted by the forward replay from the startup draft (see coverage); 2025 prices do not exist in any retained source.",
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
      leagueId: move.leagueId,
      origin: "transaction", type: move.type, status: "complete",
      effectiveAt: instantIso(move.effectiveMs), day: null, precision: "instant",
      leg: move.leg, rosterIds: move.rosterIds, waiverBid: move.waiverBid, draftPicks: move.draftPicks,
      // Every leg carries its roster id: for a two-sided trade these
      // arrays hold both teams' assets, and the roster id on each
      // entry is what scopes a leg to the team that received/sent it.
      adds: move.adds.map(entry => ({ id: entry.playerId, name: playerName(names, entry.playerId), rosterId: entry.rosterId })),
      drops: move.drops.map(entry => ({ id: entry.playerId, name: playerName(names, entry.playerId), rosterId: entry.rosterId })),
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
        rosterEvidence: membershipEvidence(ev.membership),
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

    if (day <= asOf.slice(0, 10)) {
      // No point this day, but the forward replay may still prove
      // the roster: evaluate at the earlier of UTC day end and the
      // validated as-of cutoff — for today, membership is claimed
      // only through the cutoff, never through an end-of-day that
      // has not happened yet (§1 on #224). No price is invented.
      const dayEndMs = Date.parse(`${day}T00:00:00Z`) + DAY_MS - 1;
      const capped = cutoffMs < dayEndMs;
      const membership = chain.membershipAt(rosterId, Math.min(dayEndMs, cutoffMs));
      if (membership) {
        const roster = membership.playerIds;
        const missingReason = day < HISTORY_SEASON_TWO_FROM
          ? "No recorded quote exists for the 2025 season; prices for this day are unavailable in every retained source."
          : "No retained recorded snapshot on this day.";
        return {
          ...shared, valuationAt: membership.at, pointId: null, rosterRef: rosterRef(roster),
          rosterStatus: "replayed", rosterCount: roster.length, priced: 0,
          subtotalCents: roster.length === 0 ? 0 : null,
          rosterEvidence: [...membershipEvidence(membership), capped
            ? "Roster replayed as of the validated as-of cutoff on this UTC day; the rest of the day has not been observed. No player is priced."
            : "Roster replayed as of the end of this UTC day. No player is priced from membership alone."],
          players: roster.map(id => ({
            id, name: playerName(names, id), priceCents: null, price: null, missingReason,
          })),
          moves: nearby.map(move => toMove(move, names)),
        };
      }
    }

    // Membership unproven for this day: the offseason gap (the
    // chain's own returned range), before the founding draft
    // completed, or a day the pinned cutoff has not reached. The
    // day's sourced events still display — they assert only their
    // own legs, never this roster.
    const inGap = day >= chain.gapRange.from && day < chain.gapRange.toExclusive;
    return {
      ...shared, valuationAt: `${day}T00:00:00.000000Z`, pointId: null, rosterRef: `unproven-${team.id}`,
      rosterStatus: "ambiguous", rosterCount: null, priced: 0, subtotalCents: null,
      rosterEvidence: [inGap
        ? `The offseason gap (${chain.gapRange.from} to ${chain.gapRange.toExclusive}) carries no transaction rows in either league's feed; membership for this day is not asserted. The 2026 boundary roster is derived by reconciliation at the season boundary, not observed day by day.`
          + (nearby.length > 0 ? " The moves below are sourced events from the adjacent days — they assert only their own legs, not this day's roster." : "")
        : day < HISTORY_SEASON_TWO_FROM
          ? `This day precedes the 2025 segment's draft anchor (${chain.seasonOne.anchorAt}); membership before the founding draft completed is not asserted.`
            + (nearby.length > 0 ? " The moves below are the 2025 league's completed transactions, shown as sourced events — they assert only their own legs, not this day's roster." : "")
          : "Membership for this day is outside the forward replay's proven range at the validated as-of cutoff."],
      players: [],
      moves: nearby.map(move => toMove(move, names)),
    };
  }

  function receipt(): TeamHistoryReceipt {
    return {
      teamId: team.id, generation, anchor: { observedAt: anchor.observedAt, roster: anchorRoster },
      points: builds.map(({ build, ev, pricedIds }) => ({
        pointId: build.id, day: build.day, valuationAt: build.valuationAt, roster: ev.roster,
        pricedPlayerIds: pricedIds, subtotalCents: build.subtotalCents,
        // The completed current-league moves involving this team that
        // are effective after the point's instant: the delta between
        // the point's replayed roster and today's anchor roster.
        generationMoves: receiptMoves.filter(move => moveMicros(move) > ev.micros)
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
 * (anchor roster, every player the chain replay proves on the team,
 * and its admitted move counterparties) over the full league window;
 * a truncated read is an incomplete admitted set → 503.
 */
export async function loadTeamHistoryState(
  teamId: string, deps: TeamHistoryDeps = {}, options: { pinned?: boolean } = {},
): Promise<TeamHistoryState> {
  const store = deps.quotes === undefined ? getRecordedQuoteStore() : deps.quotes;
  if (!store) throw new TeamHistoryError("Recorded quote source is unavailable", 503);
  // One clock capture per load, shared by every loader: the default
  // chain load receives the same instant, so chain `asOf` ===
  // envelope `asOf` === the generation token's cutoff, fresh or
  // pinned (§4 precision 1 on #224).
  const now = (deps.now ?? (() => new Date()))();
  const fetchChain = deps.fetchChain ?? (() => loadChainRosterReplay({ now: () => now }));
  let anchor: HistoryAnchor, moves: HistoryMove[], chain: ChainRosterReplay;
  try {
    [anchor, moves, chain] = await Promise.all([
      (deps.fetchAnchor ?? defaultAnchor)(), (deps.fetchMoves ?? defaultMoves)(), fetchChain(),
    ]);
  } catch (error) {
    // Advance-vs-outage (§4 precision 5): a replay admission
    // rejection under a PINNED load is the source-advance signal and
    // maps to 409/refresh; under a fresh load it is a source fault.
    // Fetch failures and malformed evidence stay 503 in both modes —
    // the catch-all must never flatten the advance into a 503.
    if (options.pinned && error instanceof RosterReplayAdvanceError) {
      throw new TeamHistoryError("History has advanced past the pinned generation; refresh for the new generation", 409);
    }
    throw new TeamHistoryError("League sources are unavailable", 503);
  }
  const team = anchor.teams.find(entry => entry.id === teamId);
  if (!team) throw new TeamHistoryError("Unknown team", 404);
  // Admission order matters: the as-of cutoff applies to moves BEFORE
  // the quote scope is derived from them. A future-dated move is not
  // evidence, so its counterparties must not widen the scope — otherwise
  // an earlier quote for a player only that future move names would be
  // admitted, inventing an unpriced day and moving the generation for a
  // move that is itself excluded. The scope is the union of three
  // proven sources: today's anchor roster; every player the chain
  // replay proves on this team in either segment (the chain's own
  // admission already rejected post-cutoff and cross-boundary
  // evidence, so this adds exactly the historically proven names —
  // e.g. a 2025-only player no current-league leg names); and the
  // cutoff-admissible current-league move legs.
  const admissibleMoves = moves.filter(move => move.leagueId === LEAGUE_ID
    && moveMicros(move) <= now.getTime() * 1000);
  const scope = [...new Set([
    ...team.players,
    ...chainProvenPlayers(chain, Number(teamId)),
    ...admissibleMoves.flatMap(move => [...move.adds, ...move.drops]
      .filter(entry => entry.rosterId === Number(teamId)).map(entry => entry.playerId)),
  ])].sort();
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
  return buildState({ anchor, team, moves, quotes: rows.quotes, chain, now });
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

/**
 * THE th2 token gate (§4 on #224) — the one place the status mapping
 * lives, so a counter on any single verdict is a one-line change:
 *
 * - missing or multiply supplied `generation` → 400, before any load;
 * - a well-formed legacy `th1-…` token → refresh-409, never parsed
 *   further and never silently upgraded;
 * - a `th2:` token that fails the shape or the canonical round-trip
 *   (ms UTC ISO, exactly as minted) → 400, before any load;
 * - a token whose cutoff is in the future versus the server clock
 *   captured here → 400, before any load;
 * - a token whose cutoff predates the supported view's founding
 *   bound (`HISTORY_LEAGUE_FROM`) → 400, before any load: no
 *   generation can ever have been minted below it, so the answer
 *   must not depend on source health after real reads.
 *
 * A token that passes returns its cutoff; the helpers inject it as
 * one constant clock into both loaders, recompute from current
 * sources bounded at it, and compare the WHOLE recomputed generation
 * — mismatch (drift, correction, or genuine advance) is the caller's
 * 409. The token authorizes nothing by itself: admission in both
 * loaders is bounded by the injected clock, which is set from the
 * token only after the validation above.
 */
const TH2_TOKEN = /^th2:(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z):([0-9a-f]{24})$/;

function pinnedCutoff(url: URL, nowMs: number): { token: string; cutoffMs: number } {
  const supplied = url.searchParams.getAll("generation");
  if (supplied.length === 0) throw new TeamHistoryError("Missing generation parameter", 400);
  if (supplied.length !== 1) throw new TeamHistoryError("Generation must be supplied exactly once", 400);
  const token = supplied[0];
  if (token.startsWith("th1-")) {
    throw new TeamHistoryError("History has changed; refresh for the new generation", 409);
  }
  const match = TH2_TOKEN.exec(token);
  if (!match) throw new TeamHistoryError("Malformed generation token", 400);
  const cutoffMs = Date.parse(match[1]);
  if (!Number.isFinite(cutoffMs) || new Date(cutoffMs).toISOString() !== match[1]) {
    throw new TeamHistoryError("Malformed generation token", 400);
  }
  // Future is judged against the load clock (deps.now — the same
  // clock the loaders will be pinned to), never a second time source.
  if (cutoffMs > nowMs) throw new TeamHistoryError("Generation cutoff is in the future", 400);
  // The supported view is bounded below by the league's founding
  // bound: a cutoff before it names a view that cannot exist, so it
  // is rejected here — deterministically, with zero source reads —
  // rather than surfacing as a source-health-dependent 409/503.
  if (cutoffMs < Date.parse(`${HISTORY_LEAGUE_FROM}T00:00:00.000Z`)) {
    throw new TeamHistoryError("Generation cutoff predates the supported history range", 400);
  }
  return { token, cutoffMs };
}

/** Summary route: GET /api/team-value-history/summary?teamId&generation&from&toExclusive */
export async function teamHistorySummaryResponse(url: URL, deps: TeamHistoryDeps = {}): Promise<Response> {
  try {
    const teamId = requiredParam(url, "teamId");
    const { token, cutoffMs } = pinnedCutoff(url, (deps.now ?? (() => new Date()))().getTime());
    const range = { from: dayParam(url, "from"), toExclusive: dayParam(url, "toExclusive") };
    if (url.searchParams.has("cursor")) {
      throw new TeamHistoryError("This producer serves the full requested range in one page; cursors are not issued", 400);
    }
    if (!validHistoryRange(range)) throw new TeamHistoryError("Expected from < toExclusive", 400);
    const spanDays = Math.round((Date.parse(`${range.toExclusive}T00:00:00Z`) - Date.parse(`${range.from}T00:00:00Z`)) / DAY_MS);
    if (spanDays > TEAM_HISTORY_MAX_POINTS) throw new TeamHistoryError(`Range exceeds the ${TEAM_HISTORY_MAX_POINTS}-point summary cap`, 400);
    const state = await loadTeamHistoryState(teamId, { ...deps, now: () => new Date(cutoffMs) }, { pinned: true });
    if (token !== state.generation) throw new TeamHistoryError("History has changed; refresh for the new generation", 409);
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
    const { token, cutoffMs } = pinnedCutoff(url, (deps.now ?? (() => new Date()))().getTime());
    const day = dayParam(url, "day");
    const state = await loadTeamHistoryState(teamId, { ...deps, now: () => new Date(cutoffMs) }, { pinned: true });
    if (token !== state.generation) throw new TeamHistoryError("History has changed; refresh for the new generation", 409);
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
