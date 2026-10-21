/**
 * roster-replay.ts — the forward roster replay producer (issues
 * #224/#217). Contract: `src/domain/roster-replay.ts`.
 *
 * Where `team-value-history.ts` proves 2026 membership by inverting
 * completed moves from today's roster anchor (and asserts nothing
 * about 2025), this producer replays membership FORWARD from pinned
 * anchors:
 *
 * - 2025 season: the completed startup draft's assignments are the
 *   anchor; the league's complete transaction feed (weeks 1–24,
 *   strict — a failed week rejects the load) replays forward in the
 *   frozen order the history producer froze (effective instant =
 *   `status_updated`, fallback `created`; tie-break `transaction_id`;
 *   complete-only). Moves effective at or before the anchor instant
 *   are pre-anchor evidence and are never applied. The replay is
 *   verified against Sleeper's observed final 2025 rosters: any
 *   mismatch rejects the load rather than serving a roster Sleeper
 *   disagrees with.
 * - 2026 season: no draft anchor exists for the keeper core — the
 *   offseason gap (2026-04-02 → 2026-08-12) has no rows in either
 *   feed. The boundary roster is derived by inverting the 2026 feed
 *   from the observed current rosters, segmented at the 2026 draft:
 *   post-draft moves invert first, the draft's additions are
 *   stripped, then pre-draft moves invert. The per-slot silent delta
 *   against the 2025 final rosters is exposed as an explicit
 *   reconciliation (cuts/additions, never dressed up as
 *   transactions); the 2026 draft is then applied forward as a dated
 *   draft event, and the full forward chain is verified against the
 *   observed current rosters before anything is served.
 *
 * Every application is fail-closed: a drop of a player the roster
 * does not own, an add of a player owned anywhere, or a draft add of
 * an owned player contradicts the feed and rejects the load
 * (`RosterReplayError`). Trades are atomic per record: all drops
 * apply before any adds, so a swap validates against the state its
 * own drops produced. Pick-only records carry no player legs and
 * apply as no-ops. Team identity is the roster SLOT, never the owner.
 *
 * Source admission is bounded and proven, not assumed:
 *
 * - A draft receipt must prove it is complete before it anchors a
 *   segment or derives the boundary, and its dimensions are proven
 *   against an independent witness — the draft object's own declared
 *   metadata (`settings.rounds`, `settings.teams`, and the
 *   `draft_order` slot set) — never inferred from the picks
 *   themselves: a receipt truncated at a whole round is a smaller
 *   self-consistent grid and would prove itself. Against that
 *   witness the receipt must be exact: pick numbers form the
 *   contiguous sequence 1..N, N equals declared rounds × slots, and
 *   every declared round carries exactly the declared slot set.
 *   Missing draft metadata rejects the load too. The witness must
 *   also be the segment's own draft: the draft's declared
 *   `league_id` is bound to the league being loaded before any of
 *   its metadata is used — a draft declaring a foreign league, or
 *   no league at all, rejects rather than having its evidence
 *   relabelled with the requested league. A missing,
 *   truncated, or gapped receipt rejects the load: inversion and
 *   replay consume the same draft, so neither can detect an omission
 *   the receipt itself does not rule out, and an omitted pick would
 *   otherwise resurface as backdated boundary membership.
 * - The loader captures an explicit as-of instant (injectable, for
 *   tests). A completed source event effective after it — or a draft
 *   completing after it — rejects the load with
 *   `RosterReplayAdvanceError` (the §4 source-advance signal the
 *   history wiring maps to 409 under a pinned generation token), and
 *   membership is never asserted for an instant past it: an
 *   end-of-day is only claimed for a day the cutoff has fully
 *   covered.
 * - Repeated transaction records are admitted once per league:
 *   identical repeats (after normalization) are deduplicated; the
 *   same transaction id carrying different contents rejects.
 * - The draft/transaction tie rule is one rule in both directions:
 *   forward replay applies the draft before a move at the same
 *   instant, so inversion treats an equal-instant move as post-draft
 *   — it is undone BEFORE the draft's additions are stripped.
 *
 * Membership only: no prices are read, derived, or asserted here.
 * This module performs no writes of any kind.
 */
import { validHistoryDay } from "@/domain/team-value-history";
import type {
  RosterMembership, RosterMembershipProvenance, RosterReconciliationEntry,
  RosterReplayAnchorKind,
} from "@/domain/roster-replay";
import { fetchTransactionsByWeekCompleteForLeague, validSeasonWeeks } from "./league";
import {
  fetchDraftPicks, fetchDraftsForLeague, fetchNbaState, fetchRostersForLeague,
  LEAGUE_ID, type RawDraft, type RawDraftPick, type RawRoster,
} from "./sleeper";
import {
  HISTORY_SEASON_TWO_FROM, SEASON_ONE_LEAGUE_ID, SEASON_ONE_WEEKS,
  toHistoryMoves, type HistoryMove,
} from "./team-value-history";

export class RosterReplayError extends Error {}

/**
 * Source-advance rejection (wiring contract §4 on #224): the load
 * failed ONLY because a source event sits after the caller's as-of
 * cutoff — a completed move effective after it, or a draft completing
 * after it. Under a fresh load this is a source fault like any other;
 * under a generation token that PINS the cutoff it is the advance
 * signal — the world moved past the pinned view — and the history
 * helpers map it to 409/refresh instead of 503. Fetch failures and
 * malformed or contradictory evidence stay plain `RosterReplayError`
 * in both modes.
 */
export class RosterReplayAdvanceError extends RosterReplayError {}

/** A completed draft, applied as one dated membership event. */
export type RosterDraftEvent = {
  draftId: string;
  /** The draft's completion instant (epoch ms). */
  effectiveMs: number;
  adds: { playerId: string; rosterId: number }[];
};

/* ------------------------------ engine ------------------------------ */

type RosterState = Map<number, string[]>;

type Snapshot = { atMs: number; rosters: RosterState; movesApplied: number };

export type RosterTimeline = {
  /** Epoch ms of the anchor instant; the anchor roster describes it. */
  anchorAtMs: number;
  /** Completed moves effective at or before the anchor — never applied. */
  preAnchorMoves: HistoryMove[];
  /** Completed moves applied, in frozen order. */
  appliedMoves: HistoryMove[];
  /** Draft events applied, in instant order. */
  appliedDraftEvents: RosterDraftEvent[];
  /** Sorted roster for one slot after every event effective at or before the instant. */
  rosterAt: (rosterId: number, instantMs: number) => string[];
  /** Every slot's sorted roster at the instant. */
  rostersAt: (instantMs: number) => RosterState;
  /** Transaction moves applied at or before the instant. */
  movesAppliedAt: (instantMs: number) => number;
  /** Roster state after the final event. */
  finalRosters: () => RosterState;
};

/** The frozen replay order — identical to the history producer's. */
const byFrozenOrder = (a: HistoryMove, b: HistoryMove): number =>
  a.effectiveMs - b.effectiveMs || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

function sortedCopy(state: Map<number, Set<string>>): RosterState {
  return new Map([...state.entries()].map(([rosterId, players]) => [rosterId, [...players].sort()]));
}

function ownerIndex(state: Map<number, Set<string>>): Map<string, number> {
  const owner = new Map<string, number>();
  for (const [rosterId, players] of state) {
    for (const playerId of players) {
      if (owner.has(playerId)) {
        throw new RosterReplayError(`Player ${playerId} is rostered by both slot ${owner.get(playerId)} and slot ${rosterId}`);
      }
      owner.set(playerId, rosterId);
    }
  }
  return owner;
}

/**
 * Build a forward replay timeline from a pinned anchor. Pure: the
 * anchor rosters and moves are inputs; nothing is fetched here.
 * Contradictions reject the build — a timeline that cannot be proven
 * from its anchor and feed is never served partially.
 */
export function buildRosterTimeline(args: {
  anchorAtMs: number;
  anchorRosters: ReadonlyMap<number, readonly string[]>;
  moves: readonly HistoryMove[];
  draftEvents?: readonly RosterDraftEvent[];
}): RosterTimeline {
  const state = new Map<number, Set<string>>();
  for (const [rosterId, players] of args.anchorRosters) {
    if (!Number.isSafeInteger(rosterId) || rosterId < 1) {
      throw new RosterReplayError(`Anchor carries an invalid roster id ${rosterId}`);
    }
    if (state.has(rosterId)) throw new RosterReplayError(`Anchor carries roster slot ${rosterId} twice`);
    state.set(rosterId, new Set(players));
  }
  if (state.size === 0) throw new RosterReplayError("Anchor carries no rosters");
  const owner = ownerIndex(state);

  const ordered = [...args.moves].sort(byFrozenOrder);
  const preAnchorMoves = ordered.filter(move => move.effectiveMs <= args.anchorAtMs);
  const appliedMoves = ordered.filter(move => move.effectiveMs > args.anchorAtMs);
  const draftEvents = [...(args.draftEvents ?? [])].sort((a, b) => a.effectiveMs - b.effectiveMs);
  for (const event of draftEvents) {
    if (event.effectiveMs <= args.anchorAtMs) {
      throw new RosterReplayError(`Draft event ${event.draftId} is effective at or before the segment anchor`);
    }
  }

  const snapshots: Snapshot[] = [{ atMs: args.anchorAtMs, rosters: sortedCopy(state), movesApplied: 0 }];
  const appliedDraftEvents: RosterDraftEvent[] = [];
  let movesApplied = 0;

  const applyMove = (move: HistoryMove) => {
    for (const drop of move.drops) {
      if (owner.get(drop.playerId) !== drop.rosterId) {
        throw new RosterReplayError(
          `Move ${move.id} drops player ${drop.playerId} from slot ${drop.rosterId}, which does not own them`);
      }
    }
    for (const drop of move.drops) {
      state.get(drop.rosterId)!.delete(drop.playerId);
      owner.delete(drop.playerId);
    }
    for (const add of move.adds) {
      if (owner.has(add.playerId)) {
        throw new RosterReplayError(
          `Move ${move.id} adds player ${add.playerId} to slot ${add.rosterId}, but slot ${owner.get(add.playerId)} already owns them`);
      }
      if (!state.has(add.rosterId)) {
        throw new RosterReplayError(`Move ${move.id} adds player ${add.playerId} to unknown slot ${add.rosterId}`);
      }
    }
    for (const add of move.adds) {
      state.get(add.rosterId)!.add(add.playerId);
      owner.set(add.playerId, add.rosterId);
    }
    movesApplied += 1;
    snapshots.push({ atMs: move.effectiveMs, rosters: sortedCopy(state), movesApplied });
  };

  const applyDraft = (event: RosterDraftEvent) => {
    for (const add of event.adds) {
      if (owner.has(add.playerId)) {
        throw new RosterReplayError(
          `Draft ${event.draftId} adds player ${add.playerId} to slot ${add.rosterId}, but slot ${owner.get(add.playerId)} already owns them`);
      }
      if (!state.has(add.rosterId)) {
        throw new RosterReplayError(`Draft ${event.draftId} adds player ${add.playerId} to unknown slot ${add.rosterId}`);
      }
    }
    for (const add of event.adds) {
      state.get(add.rosterId)!.add(add.playerId);
      owner.set(add.playerId, add.rosterId);
    }
    appliedDraftEvents.push(event);
    snapshots.push({ atMs: event.effectiveMs, rosters: sortedCopy(state), movesApplied });
  };

  // Merge moves and draft events by instant; a draft event at the
  // same instant as a move applies first (the draft completes, then
  // the move acts on its outcome).
  let mi = 0, di = 0;
  while (mi < appliedMoves.length || di < draftEvents.length) {
    const move = appliedMoves[mi];
    const draft = draftEvents[di];
    if (draft && (!move || draft.effectiveMs <= move.effectiveMs)) { applyDraft(draft); di += 1; }
    else if (move) { applyMove(move); mi += 1; }
  }

  const snapshotAt = (instantMs: number): Snapshot => {
    if (instantMs < args.anchorAtMs) {
      throw new RosterReplayError(`Instant ${new Date(instantMs).toISOString()} precedes the segment anchor`);
    }
    let current = snapshots[0];
    for (const snapshot of snapshots) {
      if (snapshot.atMs > instantMs) break;
      current = snapshot;
    }
    return current;
  };

  return {
    anchorAtMs: args.anchorAtMs,
    preAnchorMoves, appliedMoves, appliedDraftEvents,
    rosterAt: (rosterId, instantMs) => {
      const roster = snapshotAt(instantMs).rosters.get(rosterId);
      if (!roster) throw new RosterReplayError(`Unknown roster slot ${rosterId}`);
      return [...roster];
    },
    rostersAt: instantMs => new Map([...snapshotAt(instantMs).rosters].map(([id, players]) => [id, [...players]])),
    movesAppliedAt: instantMs => snapshotAt(instantMs).movesApplied,
    finalRosters: () => new Map([...snapshots[snapshots.length - 1].rosters].map(([id, players]) => [id, [...players]])),
  };
}

/* --------------------- boundary reconciliation --------------------- */

export type BoundaryDerivation = {
  /** The derived boundary roster: the state the current league's first move acted on. */
  boundaryRosters: RosterState;
  /** Per-slot silent deltas vs the prior season's final rosters. */
  reconciliation: RosterReconciliationEntry[];
  /** Roster state at the draft's completion instant (boundary + pre-draft moves + draft). */
  atDraftCompletion: RosterState;
  preDraftMoves: HistoryMove[];
  postDraftMoves: HistoryMove[];
};

function toSets(rosters: ReadonlyMap<number, readonly string[]>): Map<number, Set<string>> {
  return new Map([...rosters.entries()].map(([rosterId, players]) => [rosterId, new Set(players)]));
}

/** Undo one move against a working state, fail-closed (see header). */
function invertMove(state: Map<number, Set<string>>, owner: Map<string, number>, move: HistoryMove) {
  for (const add of move.adds) {
    if (owner.get(add.playerId) !== add.rosterId) {
      throw new RosterReplayError(
        `Cannot invert move ${move.id}: its add of player ${add.playerId} is not on slot ${add.rosterId}`);
    }
  }
  for (const add of move.adds) {
    state.get(add.rosterId)!.delete(add.playerId);
    owner.delete(add.playerId);
  }
  for (const drop of move.drops) {
    if (owner.has(drop.playerId)) {
      throw new RosterReplayError(
        `Cannot invert move ${move.id}: its drop of player ${drop.playerId} is already owned by slot ${owner.get(drop.playerId)}`);
    }
    if (!state.has(drop.rosterId)) {
      throw new RosterReplayError(`Cannot invert move ${move.id}: unknown slot ${drop.rosterId}`);
    }
  }
  for (const drop of move.drops) {
    state.get(drop.rosterId)!.add(drop.playerId);
    owner.set(drop.playerId, drop.rosterId);
  }
}

/**
 * Derive the current league's boundary roster by segmented inversion
 * (see the module header). Pure and fail-closed: any contradiction
 * between the observed current rosters, the feed, and the draft
 * rejects the derivation instead of producing a plausible boundary.
 */
export function deriveBoundaryReconciliation(args: {
  priorFinalRosters: ReadonlyMap<number, readonly string[]>;
  currentRosters: ReadonlyMap<number, readonly string[]>;
  moves: readonly HistoryMove[];
  draft: RosterDraftEvent;
}): BoundaryDerivation {
  const ordered = [...args.moves].sort(byFrozenOrder);
  // The tie rule mirrors forward replay, which applies the draft
  // before a move at the same instant: an equal-instant move acted
  // on the draft's outcome, so it is post-draft here and inverts
  // BEFORE the draft's additions are stripped. Partitioning it as
  // pre-draft would strip the draft out from under the move and the
  // round-trip would contradict itself.
  const preDraftMoves = ordered.filter(move => move.effectiveMs < args.draft.effectiveMs);
  const postDraftMoves = ordered.filter(move => move.effectiveMs >= args.draft.effectiveMs);

  const draftedBy = new Map<string, number>();
  for (const add of args.draft.adds) {
    if (draftedBy.has(add.playerId)) {
      throw new RosterReplayError(`Draft ${args.draft.draftId} assigns player ${add.playerId} twice`);
    }
    draftedBy.set(add.playerId, add.rosterId);
  }
  for (const [rosterId, players] of args.priorFinalRosters) {
    for (const playerId of players) {
      if (draftedBy.has(playerId)) {
        throw new RosterReplayError(
          `Drafted player ${playerId} already sits on the prior season's final roster for slot ${rosterId}`);
      }
    }
  }

  // Invert post-draft moves from the observed current rosters → the
  // state at the draft's completion instant.
  const state = toSets(args.currentRosters);
  const owner = ownerIndex(state);
  for (let i = postDraftMoves.length - 1; i >= 0; i--) invertMove(state, owner, postDraftMoves[i]);
  const atDraftCompletion = sortedCopy(state);

  // Every drafted player must be present on their drafting slot at
  // that instant — inversion restored anyone the post-draft feed
  // moved or dropped, so an absence contradicts the sources.
  for (const add of args.draft.adds) {
    if (!state.get(add.rosterId)?.has(add.playerId)) {
      throw new RosterReplayError(
        `Drafted player ${add.playerId} is absent from slot ${add.rosterId} at the draft's completion`);
    }
    state.get(add.rosterId)!.delete(add.playerId);
    owner.delete(add.playerId);
  }

  // Invert pre-draft moves → the boundary roster.
  for (let i = preDraftMoves.length - 1; i >= 0; i--) invertMove(state, owner, preDraftMoves[i]);
  const boundaryRosters = sortedCopy(state);

  const reconciliation: RosterReconciliationEntry[] = [];
  const slotIds = [...new Set([...args.priorFinalRosters.keys(), ...boundaryRosters.keys()])].sort((a, b) => a - b);
  for (const rosterId of slotIds) {
    const prior = new Set(args.priorFinalRosters.get(rosterId) ?? []);
    const boundary = new Set(boundaryRosters.get(rosterId) ?? []);
    reconciliation.push({
      rosterId,
      cuts: [...prior].filter(playerId => !boundary.has(playerId)).sort(),
      additions: [...boundary].filter(playerId => !prior.has(playerId)).sort(),
    });
  }

  return { boundaryRosters, reconciliation, atDraftCompletion, preDraftMoves, postDraftMoves };
}

/* ------------------------------ loading ------------------------------ */

export type RosterReplayDeps = {
  fetchDrafts?: (leagueId: string) => Promise<RawDraft[]>;
  fetchDraftPicks?: (draftId: string) => Promise<RawDraftPick[]>;
  fetchRosters?: (leagueId: string) => Promise<RawRoster[]>;
  /** One league's completed moves, normalized — the strict feed. */
  fetchMoves?: (leagueId: string, weeks: number[]) => Promise<HistoryMove[]>;
  /** The current league's provable transaction week range. */
  seasonTwoWeeks?: () => Promise<number[]>;
  /** The observation instant bounding source admission; defaults to the load instant. */
  now?: () => Date;
};

async function defaultFetchMoves(leagueId: string, weeks: number[]): Promise<HistoryMove[]> {
  const perWeek = await fetchTransactionsByWeekCompleteForLeague(leagueId, weeks);
  return toHistoryMoves(perWeek.flat(), leagueId);
}

async function defaultSeasonTwoWeeks(): Promise<number[]> {
  const state = await fetchNbaState();
  const weeks = validSeasonWeeks(state);
  if (weeks.length === 0) {
    throw new RosterReplayError("Sleeper season state does not establish a provable transaction week range");
  }
  return weeks;
}

/**
 * The grid a complete draft must fill, derived from the draft
 * object's own declared metadata — the independent witness a pick
 * receipt is proven against. Nothing here reads the picks: the
 * round count is the draft's configured `settings.rounds`, and the
 * slot set is the `draft_order` the draft itself declares, cross-
 * checked against `settings.teams`. Absent or unreadable metadata
 * rejects: an unwitnessed receipt proves nothing.
 */
export type DraftGridExpectation = {
  /** Rounds the draft was configured to run (`settings.rounds`). */
  rounds: number;
  /** Draft slots the draft order declares, ascending. */
  slots: number[];
};

function draftGridExpectation(draft: RawDraft): DraftGridExpectation {
  const fail = (reason: string): RosterReplayError =>
    new RosterReplayError(`Draft ${draft.draft_id} declares no proven grid: ${reason}`);
  const settings = draft.settings;
  if (!settings || typeof settings !== "object") throw fail("its settings are absent");
  const { rounds, teams } = settings;
  if (!Number.isSafeInteger(rounds) || (rounds as number) < 1) throw fail("settings.rounds is unreadable");
  if (!Number.isSafeInteger(teams) || (teams as number) < 1) throw fail("settings.teams is unreadable");
  const order = draft.draft_order;
  if (!order || typeof order !== "object" || Array.isArray(order)) throw fail("its draft order is absent");
  const slots = Object.values(order);
  if (slots.length !== teams) {
    throw fail(`its draft order names ${slots.length} slots for ${teams} declared teams`);
  }
  if (!slots.every(slot => Number.isSafeInteger(slot) && slot >= 1)) {
    throw fail("its draft order carries an unreadable slot");
  }
  if (new Set(slots).size !== slots.length) throw fail("its draft order repeats a slot");
  return { rounds: rounds as number, slots: [...slots].sort((a, b) => a - b) };
}

function completedDraft(drafts: RawDraft[], leagueId: string): {
  draft: RawDraft; completedMs: number; grid: DraftGridExpectation;
} {
  const completed = drafts.filter(entry => entry.status === "complete");
  if (completed.length !== 1) {
    throw new RosterReplayError(`League ${leagueId} must carry exactly one completed draft; found ${completed.length}`);
  }
  const draft = completed[0];
  // The witness must be the segment's own draft: its declared league
  // identity is checked against the league being loaded BEFORE its
  // metadata is used as the completeness witness. A foreign draft's
  // grid proves nothing about this league's receipt, and a draft
  // declaring no league at all is unproven provenance — both reject
  // rather than being relabelled with the requested league.
  if (typeof draft.league_id !== "string" || draft.league_id.length === 0) {
    throw new RosterReplayError(`Completed draft ${draft.draft_id} declares no league identity`);
  }
  if (draft.league_id !== leagueId) {
    throw new RosterReplayError(
      `Completed draft ${draft.draft_id} declares league ${draft.league_id}, not the league being loaded (${leagueId})`);
  }
  if (typeof draft.last_picked !== "number" || !Number.isFinite(draft.last_picked)) {
    throw new RosterReplayError(`Completed draft ${draft.draft_id} carries no completion instant`);
  }
  return { draft, completedMs: draft.last_picked, grid: draftGridExpectation(draft) };
}

/**
 * Prove a draft receipt complete before anything derives from it.
 * The receipt is the only evidence of the draft's assignments —
 * inversion and replay both consume it, so an omission neither can
 * detect must be ruled out structurally. The grid it must fill is
 * NOT inferred from the picks: a receipt truncated at a whole round
 * is a smaller, self-consistent grid and would prove itself, its
 * omitted players resurfacing as backdated boundary additions.
 * The dimensions come from the independent witness in `expected`
 * (the draft's own declared settings and draft order): pick numbers
 * are exactly 1..N with no gaps or repeats, N is exactly declared
 * rounds × declared slots, and every declared round carries exactly
 * the declared slot set. A completed draft has made every pick;
 * anything less — or anything more — is a missing, truncated, or
 * unproven receipt and rejects the load.
 */
function validateDraftReceipt(picks: RawDraftPick[], draftId: string, expected: DraftGridExpectation): void {
  if (!Array.isArray(picks) || picks.length === 0) {
    throw new RosterReplayError(`Draft ${draftId} carries no draft-pick receipt`);
  }
  const pickNos = new Set<number>();
  const cells = new Set<string>();
  const slotsByRound = new Map<number, Set<number>>();
  for (const pick of picks) {
    if (!pick || typeof pick !== "object"
      || typeof pick.player_id !== "string" || pick.player_id.length === 0
      || !Number.isSafeInteger(pick.roster_id) || pick.roster_id < 1
      || !Number.isSafeInteger(pick.pick_no) || pick.pick_no < 1
      || !Number.isSafeInteger(pick.round) || pick.round < 1
      || !Number.isSafeInteger(pick.draft_slot) || pick.draft_slot < 1) {
      throw new RosterReplayError(`Draft ${draftId} carries an unreadable pick`);
    }
    if (pickNos.has(pick.pick_no)) {
      throw new RosterReplayError(`Draft ${draftId} repeats pick number ${pick.pick_no}`);
    }
    pickNos.add(pick.pick_no);
    const cell = `${pick.round}:${pick.draft_slot}`;
    if (cells.has(cell)) {
      throw new RosterReplayError(`Draft ${draftId} repeats round ${pick.round} slot ${pick.draft_slot}`);
    }
    cells.add(cell);
    const slots = slotsByRound.get(pick.round) ?? new Set<number>();
    slots.add(pick.draft_slot);
    slotsByRound.set(pick.round, slots);
  }
  for (let pickNo = 1; pickNo <= picks.length; pickNo++) {
    if (!pickNos.has(pickNo)) {
      throw new RosterReplayError(`Draft ${draftId} receipt is incomplete: pick number ${pickNo} is missing`);
    }
  }
  // The dimensions are the witness's, not the receipt's: the count,
  // the round range, and every round's slot set must match the grid
  // the draft itself declared, exactly.
  const declaredSlots = new Set(expected.slots);
  if (picks.length !== expected.rounds * expected.slots.length) {
    throw new RosterReplayError(
      `Draft ${draftId} receipt is incomplete: ${picks.length} picks against the draft's declared `
      + `${expected.rounds} rounds × ${expected.slots.length} slots`);
  }
  const rounds = [...slotsByRound.keys()].sort((a, b) => a - b);
  if (rounds.length !== expected.rounds) {
    throw new RosterReplayError(
      `Draft ${draftId} receipt is incomplete: it covers ${rounds.length} rounds `
      + `against the draft's declared ${expected.rounds}`);
  }
  for (let round = 1; round <= expected.rounds; round++) {
    const slots = slotsByRound.get(round);
    if (!slots) {
      throw new RosterReplayError(`Draft ${draftId} receipt is incomplete: round ${round} is missing`);
    }
    if (slots.size !== declaredSlots.size || [...slots].some(slot => !declaredSlots.has(slot))) {
      throw new RosterReplayError(
        `Draft ${draftId} receipt is incomplete: round ${round} does not carry the declared draft slots`);
    }
  }
}

function draftAssignments(picks: RawDraftPick[], draftId: string, expected: DraftGridExpectation): Map<number, string[]> {
  validateDraftReceipt(picks, draftId, expected);
  const rosters = new Map<number, string[]>();
  const seen = new Set<string>();
  for (const pick of picks) {
    if (seen.has(pick.player_id)) {
      throw new RosterReplayError(`Draft ${draftId} assigns player ${pick.player_id} twice`);
    }
    seen.add(pick.player_id);
    const roster = rosters.get(pick.roster_id) ?? [];
    roster.push(pick.player_id);
    rosters.set(pick.roster_id, roster);
  }
  return new Map([...rosters.entries()].map(([id, players]) => [id, [...players].sort()]));
}

function observedRosters(rosters: RawRoster[], leagueId: string): RosterState {
  const map = new Map<number, string[]>();
  const seen = new Set<string>();
  for (const roster of rosters) {
    if (!Number.isSafeInteger(roster.roster_id) || roster.roster_id < 1 || !Array.isArray(roster.players)
      || !roster.players.every(playerId => typeof playerId === "string" && playerId.length > 0)) {
      throw new RosterReplayError(`League ${leagueId} carries an unreadable roster`);
    }
    if (map.has(roster.roster_id)) {
      throw new RosterReplayError(`League ${leagueId} carries roster slot ${roster.roster_id} twice`);
    }
    for (const playerId of roster.players) {
      if (seen.has(playerId)) {
        throw new RosterReplayError(`League ${leagueId} rosters player ${playerId} on two slots`);
      }
      seen.add(playerId);
    }
    map.set(roster.roster_id, [...roster.players].sort());
  }
  if (map.size === 0) throw new RosterReplayError(`League ${leagueId} carries no rosters`);
  return map;
}

function assertRostersEqual(actual: RosterState, expected: RosterState, label: string) {
  const slotIds = [...new Set([...actual.keys(), ...expected.keys()])].sort((a, b) => a - b);
  for (const rosterId of slotIds) {
    const a = new Set(actual.get(rosterId) ?? []);
    const e = new Set(expected.get(rosterId) ?? []);
    const onlyActual = [...a].filter(playerId => !e.has(playerId));
    const onlyExpected = [...e].filter(playerId => !a.has(playerId));
    if (onlyActual.length > 0 || onlyExpected.length > 0) {
      throw new RosterReplayError(
        `${label}: slot ${rosterId} disagrees (only replayed: ${onlyActual.join(", ") || "none"}; only observed: ${onlyExpected.join(", ") || "none"})`);
    }
  }
}

export type SeasonRosterReplay = {
  leagueId: string;
  draftId: string;
  /**
   * The draft-metadata witness the segment's receipt was proven
   * against (declared rounds × the draft order's slot set). Exposed
   * so the history wiring's generation fingerprint can bind the
   * witness itself, not just the assignments it validated.
   */
  grid: DraftGridExpectation;
  /** ISO instant of the segment anchor. */
  anchorAt: string;
  timeline: RosterTimeline;
  /** The replayed final rosters — verified equal to Sleeper's observed rosters. */
  finalRosters: RosterState;
};

export type ChainRosterReplay = {
  /** ISO as-of cutoff: no source evidence after it was admitted, and no membership is asserted past it. */
  asOf: string;
  seasonOne: SeasonRosterReplay;
  seasonTwo: SeasonRosterReplay & {
    /** Per-slot silent boundary deltas (empty arrays on the proven boundary). */
    reconciliation: RosterReconciliationEntry[];
  };
  /** The offseason gap: days in [from, toExclusive) assert no membership. */
  gapRange: { from: string; toExclusive: string };
  /** Membership at an instant, or null in the gap / before the founding draft completed / past the as-of cutoff. */
  membershipAt: (rosterId: number, instantMs: number) => RosterMembership | null;
  /** Membership at the end of a UTC day (`YYYY-MM-DD`), or null on gap days and days the as-of cutoff has not fully covered. */
  membershipOnDay: (rosterId: number, day: string) => RosterMembership | null;
};

const DAY_MS = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();

/** Canonical content fingerprint of one normalized move. */
function moveFingerprint(move: HistoryMove): string {
  const legs = (entries: { playerId: string; rosterId: number }[]) =>
    entries.map(entry => `${entry.playerId}@${entry.rosterId}`).sort();
  return JSON.stringify({
    leagueId: move.leagueId, type: move.type, effectiveMs: move.effectiveMs, leg: move.leg,
    rosterIds: [...move.rosterIds].sort((a, b) => a - b),
    adds: legs(move.adds), drops: legs(move.drops),
    waiverBid: move.waiverBid, draftPicks: move.draftPicks,
  });
}

/**
 * Admit one league's completed moves for replay, bounded by the
 * as-of cutoff. A record effective after the cutoff is unobserved
 * evidence and rejects the load — it is never replayed, inverted, or
 * counted. A repeated transaction id is admitted once when the
 * repeats are identical after normalization (a strict per-week feed
 * can surface the same record twice); the same id with different
 * contents is a contradiction and rejects.
 */
function admitFeedMoves(moves: HistoryMove[], leagueId: string, asOfMs: number): HistoryMove[] {
  const seen = new Map<string, string>();
  const admitted: HistoryMove[] = [];
  for (const move of moves) {
    if (move.effectiveMs > asOfMs) {
      throw new RosterReplayAdvanceError(
        `League ${leagueId} feed carries completed move ${move.id} effective ${iso(move.effectiveMs)}, after the as-of cutoff ${iso(asOfMs)}`);
    }
    const fingerprint = moveFingerprint(move);
    const prior = seen.get(move.id);
    if (prior !== undefined) {
      if (prior !== fingerprint) {
        throw new RosterReplayError(
          `League ${leagueId} feed carries transaction ${move.id} twice with different contents`);
      }
      continue;
    }
    seen.set(move.id, fingerprint);
    admitted.push(move);
  }
  return admitted;
}

/**
 * Load the full chain replay from Sleeper (or injected fakes). Both
 * segments are verified against Sleeper's observed rosters before
 * anything is returned — a chain that disagrees with its sources
 * rejects wholesale.
 */
export async function loadChainRosterReplay(deps: RosterReplayDeps = {}): Promise<ChainRosterReplay> {
  const fetchDrafts = deps.fetchDrafts ?? fetchDraftsForLeague;
  const fetchPicks = deps.fetchDraftPicks ?? fetchDraftPicks;
  const fetchRostersDep = deps.fetchRosters ?? fetchRostersForLeague;
  const fetchMoves = deps.fetchMoves ?? defaultFetchMoves;
  const seasonTwoWeeks = deps.seasonTwoWeeks ?? defaultSeasonTwoWeeks;

  // The as-of cutoff: the instant this load observes its sources.
  // Nothing effective after it is admitted as evidence, and no
  // membership is asserted past it.
  const asOfMs = (deps.now ?? (() => new Date()))().getTime();
  if (!Number.isFinite(asOfMs)) throw new RosterReplayError("The as-of cutoff is not a finite instant");

  /* Season one: draft anchor, forward replay, verified final. */
  const { draft: draftOne, completedMs: draftOneMs, grid: gridOne } =
    completedDraft(await fetchDrafts(SEASON_ONE_LEAGUE_ID), SEASON_ONE_LEAGUE_ID);
  if (draftOneMs > asOfMs) {
    throw new RosterReplayAdvanceError(`League ${SEASON_ONE_LEAGUE_ID} draft completes after the as-of cutoff`);
  }
  const [picksOne, movesOne, observedFinalOne] = await Promise.all([
    fetchPicks(draftOne.draft_id),
    fetchMoves(SEASON_ONE_LEAGUE_ID, SEASON_ONE_WEEKS),
    fetchRostersDep(SEASON_ONE_LEAGUE_ID),
  ]);
  const anchorOne = draftAssignments(picksOne, draftOne.draft_id, gridOne);
  const timelineOne = buildRosterTimeline({
    anchorAtMs: draftOneMs, anchorRosters: anchorOne,
    moves: admitFeedMoves(movesOne, SEASON_ONE_LEAGUE_ID, asOfMs),
  });
  const observedOne = observedRosters(observedFinalOne, SEASON_ONE_LEAGUE_ID);
  assertRostersEqual(timelineOne.finalRosters(), observedOne, "Season-one replay does not reproduce Sleeper's final 2025 rosters");

  /* Season two: derive the boundary, replay forward, verify current. */
  const { draft: draftTwo, completedMs: draftTwoMs, grid: gridTwo } =
    completedDraft(await fetchDrafts(LEAGUE_ID), LEAGUE_ID);
  if (draftTwoMs > asOfMs) {
    throw new RosterReplayAdvanceError(`League ${LEAGUE_ID} draft completes after the as-of cutoff`);
  }
  const weeksTwo = await seasonTwoWeeks();
  const [picksTwo, movesTwo, observedCurrent] = await Promise.all([
    fetchPicks(draftTwo.draft_id),
    fetchMoves(LEAGUE_ID, weeksTwo),
    fetchRostersDep(LEAGUE_ID),
  ]);
  // The 2026 draft event is built from the VALIDATED receipt: the
  // boundary derivation consumes these assignments, and an omitted
  // pick would otherwise pass through it silently into backdated
  // boundary membership.
  const assignmentsTwo = draftAssignments(picksTwo, draftTwo.draft_id, gridTwo);
  const draftEventTwo: RosterDraftEvent = {
    draftId: draftTwo.draft_id, effectiveMs: draftTwoMs,
    adds: [...assignmentsTwo.entries()].flatMap(([rosterId, players]) =>
      players.map(playerId => ({ playerId, rosterId }))),
  };
  const admittedMovesTwo = admitFeedMoves(movesTwo, LEAGUE_ID, asOfMs);
  const observedTwo = observedRosters(observedCurrent, LEAGUE_ID);
  const derivation = deriveBoundaryReconciliation({
    priorFinalRosters: observedOne, currentRosters: observedTwo, moves: admittedMovesTwo, draft: draftEventTwo,
  });
  const boundaryAtMs = Date.parse(`${HISTORY_SEASON_TWO_FROM}T00:00:00Z`);
  const timelineTwo = buildRosterTimeline({
    anchorAtMs: boundaryAtMs, anchorRosters: derivation.boundaryRosters,
    moves: admittedMovesTwo, draftEvents: [draftEventTwo],
  });
  assertRostersEqual(timelineTwo.finalRosters(), observedTwo, "Season-two replay does not reproduce Sleeper's current rosters");

  /* Chain assembly: the gap asserts nothing. */
  const lastMoveOne = timelineOne.appliedMoves[timelineOne.appliedMoves.length - 1];
  const seasonOneLastDay = lastMoveOne ? iso(lastMoveOne.effectiveMs).slice(0, 10) : iso(draftOneMs).slice(0, 10);
  const gapStartMs = Date.parse(`${seasonOneLastDay}T00:00:00Z`) + DAY_MS;

  const membership = (
    rosterId: number, instantMs: number, segment: "one" | "two",
  ): RosterMembership => {
    const timeline = segment === "one" ? timelineOne : timelineTwo;
    const anchorKind: RosterReplayAnchorKind = segment === "one" ? "draft" : "boundary-reconciliation";
    const provenance: RosterMembershipProvenance = {
      anchorKind,
      anchorLeagueId: segment === "one" ? SEASON_ONE_LEAGUE_ID : LEAGUE_ID,
      anchorAt: iso(timeline.anchorAtMs),
      movesApplied: timeline.movesAppliedAt(instantMs),
      reconciliation: segment === "two"
        ? derivation.reconciliation.find(entry => entry.rosterId === rosterId) ?? null : null,
    };
    return {
      rosterId, at: iso(instantMs),
      playerIds: timeline.rosterAt(rosterId, instantMs), provenance,
    };
  };

  const membershipAt = (rosterId: number, instantMs: number): RosterMembership | null => {
    if (instantMs > asOfMs) return null;
    if (instantMs >= timelineOne.anchorAtMs && instantMs < gapStartMs) return membership(rosterId, instantMs, "one");
    if (instantMs >= timelineTwo.anchorAtMs) return membership(rosterId, instantMs, "two");
    return null;
  };

  return {
    asOf: iso(asOfMs),
    seasonOne: {
      leagueId: SEASON_ONE_LEAGUE_ID, draftId: draftOne.draft_id, grid: gridOne,
      anchorAt: iso(draftOneMs), timeline: timelineOne, finalRosters: timelineOne.finalRosters(),
    },
    seasonTwo: {
      leagueId: LEAGUE_ID, draftId: draftTwo.draft_id, grid: gridTwo,
      anchorAt: iso(boundaryAtMs), timeline: timelineTwo, finalRosters: timelineTwo.finalRosters(),
      reconciliation: derivation.reconciliation,
    },
    gapRange: {
      from: new Date(gapStartMs).toISOString().slice(0, 10), toExclusive: HISTORY_SEASON_TWO_FROM,
    },
    membershipAt,
    membershipOnDay: (rosterId, day) => {
      if (!validHistoryDay(day)) throw new RosterReplayError(`Invalid day ${day}`);
      return membershipAt(rosterId, Date.parse(`${day}T00:00:00Z`) + DAY_MS - 1);
    },
  };
}
