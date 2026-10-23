import { createHash } from "node:crypto";
import type { PriceHistoryArtifact, ReconstructedPoint } from "../domain/price-history-import";
import type {
  ModeledValuationTimeline,
  ModelValuationUpdate,
  RetainedStockSnapshot,
  TimelineCoverage,
  ValuationCalendarPeriod,
} from "../domain/modeled-valuation-timeline";
import { buildModeledValuationTimeline, valuationAt } from "./modeled-valuation-timeline";
import type { TeamHistoryPoint } from "../domain/team-value-history";
import {
  MODELED_BACKFILL_PACKAGE_VERSION,
  MODELED_BACKFILL_PRODUCER_VERSION,
  MODELED_CARRY_POLICY_ID,
  type ModeledBackfillDiagnostics,
  type ModeledBackfillPackage,
  type ModeledPriceProof,
  type ModeledTeamPointPackage,
} from "../domain/modeled-backfill";
import type { ChainRosterReplay } from "./roster-replay";

/**
 * The #217 Stage 2 modeled backfill producer. Pure and offline: it
 * turns a frozen reconstruction artifact into per-player modeled
 * valuation timelines (the domain machinery in
 * modeled-valuation-timeline.ts) and composes team-day points from
 * roster-replay membership. It never reads or writes a database, never
 * fetches, and never touches the recorded lane's points — recorded
 * admission is an injected predicate, and composition keeps the two
 * provenance classes in separate points with separate continuity ids.
 *
 * Carry contract (issue #217 §4, policy `gamelog-carry-v1`): a gamelog
 * point dated D is an end-of-day estimate for D; the latest same-season
 * point on or before a day prices that day; there is no cross-season
 * carry; a roster with no priced players emits no point (gaps stay
 * gaps, never zero).
 */

const DAY_MS = 86_400_000;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
/** Defensive bound so a mistyped range cannot iterate for years. */
const MAX_RANGE_DAYS = 1100;

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");
const hash12 = (parts: readonly string[]) => sha256(parts.join(",")).slice(0, 12);

/** The end-of-day instant a gamelog point dated `day` prices at. */
export const endOfDay = (day: string) => `${day}T23:59:59.999999Z`;

/** True exactly for canonical `YYYY-MM-DD` strings that name a real
 *  calendar day. An ISO instant such as `2025-10-22T00:00:00Z` is NOT
 *  a calendar day here: it can never equal a composition day key, so
 *  accepting it would silently drop whatever it was meant to assert. */
const isCalendarDay = (day: string): boolean => {
  if (!DAY_PATTERN.test(day)) return false;
  const ms = Date.parse(`${day}T00:00:00.000Z`);
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === day;
};

function assertDay(day: string, label: string): void {
  if (!isCalendarDay(day)) {
    throw new Error(`${label} is not a calendar day: ${day}`);
  }
}

const dayMs = (day: string) => Date.parse(`${day}T00:00:00.000Z`);
const dayAfter = (day: string) => new Date(dayMs(day) + DAY_MS).toISOString().slice(0, 10);
const wholeDaysBetween = (fromDay: string, toDay: string) => Math.round((dayMs(toDay) - dayMs(fromDay)) / DAY_MS);

/** NBA season start year containing a UTC day (seasons span Jul 1 – Jun 30). */
const nbaSeasonStartYear = (day: string) => {
  const year = Number(day.slice(0, 4));
  return Number(day.slice(5, 7)) >= 7 ? year : year - 1;
};

/** Fail closed when the artifact is not the dataset the run was pinned to. */
export function assertModeledDataset(artifact: PriceHistoryArtifact, expectedDatasetId: string): void {
  if (artifact.manifest.datasetId !== expectedDatasetId) {
    throw new Error(
      `Reconstruction dataset mismatch: expected ${expectedDatasetId}, artifact carries ${artifact.manifest.datasetId}. `
      + "Regenerate the pinned inputs (npm run price-history:inputs) or re-pin the manifest deliberately.");
  }
}

export type ModeledPlayerTimelines = {
  timelines: ReadonlyMap<string, ModeledValuationTimeline>;
  /** Model update id → the gamelog point it was built from. */
  anchors: ReadonlyMap<string, ReconstructedPoint>;
  /** The valuation window the timelines were built over. */
  window: { from: string; asOf: string };
  calibrationVersion: string;
};

/**
 * Build one modeled timeline per player from the artifact's gamelog
 * points. Backtest (annual) points are excluded here, at the producer
 * boundary, whatever the artifact contains: only `source: "gamelog"`
 * points become model updates, each effective at end of its own day.
 * Retained recorded snapshots pass through to the timeline untouched
 * and stay a separate lane in its output — they are never converted
 * into model updates and never priced by this producer.
 */
export function buildModeledPlayerTimelines(
  artifact: PriceHistoryArtifact,
  options: {
    from: string;
    asOf: string;
    recordedSnapshotsByPlayer?: ReadonlyMap<string, readonly RetainedStockSnapshot[]>;
  }
): ModeledPlayerTimelines {
  const { manifest } = artifact;
  const calibrationVersion = `reconstruction-${manifest.reconstructionVersion}`;
  const gamelogPoints = artifact.points.filter(p => p.source === "gamelog");

  // Season calendar derived from the gamelog points themselves: each
  // season's in-season span is its first..last game day; the span
  // between two seasons is the offseason. Reproducible from the
  // artifact alone — no external schedule is consulted. (Artifact
  // point dates are ISO midnights; the calendar works in days.)
  const seasonSpan = new Map<string, { first: string; last: string }>();
  for (const point of gamelogPoints) {
    const day = point.date.slice(0, 10);
    const span = seasonSpan.get(point.season);
    if (!span) seasonSpan.set(point.season, { first: day, last: day });
    else {
      if (day < span.first) span.first = day;
      if (day > span.last) span.last = day;
    }
  }
  const seasons = [...seasonSpan.keys()].sort();
  const calendar: ValuationCalendarPeriod[] = [];
  seasons.forEach((season, i) => {
    const span = seasonSpan.get(season)!;
    calendar.push({
      phase: "in-season",
      from: `${span.first}T00:00:00.000000Z`, to: `${dayAfter(span.last)}T00:00:00.000000Z`,
      knownAt: `${season.slice(0, 4)}-07-01T00:00:00.000000Z`, source: "committed gamelog season span",
    });
    const next = seasons[i + 1];
    if (next) {
      const from = `${dayAfter(span.last)}T00:00:00.000000Z`;
      const to = `${seasonSpan.get(next)!.first}T00:00:00.000000Z`;
      if (from < to) {
        calendar.push({
          phase: "offseason", from, to,
          knownAt: from, source: "committed gamelog season span",
        });
      }
    }
  });
  const coverage: TimelineCoverage = {
    knownAt: options.from, status: "partial",
    sourceRevision: manifest.source.revision, limitations: [...manifest.source.limitations],
  };

  const byPlayer = new Map<string, ReconstructedPoint[]>();
  for (const point of gamelogPoints) {
    const list = byPlayer.get(point.playerId) ?? [];
    list.push(point);
    byPlayer.set(point.playerId, list);
  }
  const timelines = new Map<string, ModeledValuationTimeline>();
  const anchors = new Map<string, ReconstructedPoint>();
  for (const [playerId, points] of byPlayer) {
    const updates: ModelValuationUpdate[] = points.map(point => {
      const day = point.date.slice(0, 10);
      const id = `mv2:${point.playerId}:${point.season}:${day}`;
      anchors.set(id, point);
      return {
        id, effectiveAt: endOfDay(day), evidenceAsOf: endOfDay(day),
        reason: "game", priceCents: point.priceCents,
        modelVersion: manifest.modelVersion, calibrationVersion,
      };
    });
    timelines.set(playerId, buildModeledValuationTimeline({
      playerId, from: options.from, asOf: options.asOf,
      modelVersion: manifest.modelVersion, calibrationVersion, updates,
      recordedSnapshots: options.recordedSnapshotsByPlayer?.get(playerId) ?? [],
      calendar, coverage,
    }));
  }
  return { timelines, anchors, window: { from: options.from, asOf: options.asOf }, calibrationVersion };
}

/** Membership lookup the composition needs — the roster replay's
 *  membershipOnDay, narrowed to the player list. */
export type MembershipOnDay = (rosterId: number, day: string) => { playerIds: readonly string[] } | null;

export type BuildModeledTeamPointsInput = {
  built: ModeledPlayerTimelines;
  datasetId: string;
  modelVersion: string;
  membershipOnDay: MembershipOnDay;
  /** True exactly on team-days the recorded lane admits a point for. */
  recordedAdmits: (teamId: number, day: string) => boolean;
  teamIds: readonly number[];
  range: { fromDay: string; throughDay: string };
  /** First day of the second fantasy season's segment (the chain's
   *  season-two anchor day; HISTORY_SEASON_TWO_FROM in
   *  team-value-history.ts). Points before it carry seasonId "2025",
   *  points on/after it "2026". */
  seasonTwoFromDay: string;
};

export type BuildModeledTeamPointsResult = {
  points: ModeledTeamPointPackage[];
  diagnostics: ModeledBackfillDiagnostics;
};

/**
 * Compose the modeled team-day series. A point is emitted exactly when
 * membership is proven, the recorded lane admits nothing that day, and
 * at least one rostered player carries a same-season anchor. Unpriced
 * players stay on the point's lines with a named reason — they never
 * reduce the subtotal silently and never turn it into a zero.
 */
export function buildModeledTeamPoints(input: BuildModeledTeamPointsInput): BuildModeledTeamPointsResult {
  const { built, datasetId, modelVersion } = input;
  const { fromDay, throughDay } = input.range;
  assertDay(fromDay, "range.fromDay");
  assertDay(throughDay, "range.throughDay");
  assertDay(input.seasonTwoFromDay, "seasonTwoFromDay");
  if (fromDay > throughDay) throw new Error(`Range is inverted: ${fromDay} > ${throughDay}`);
  const spanDays = wholeDaysBetween(fromDay, throughDay) + 1;
  if (spanDays > MAX_RANGE_DAYS) throw new Error(`Range spans ${spanDays} days; the bound is ${MAX_RANGE_DAYS}`);
  if (endOfDay(fromDay) < built.window.from || endOfDay(throughDay) > built.window.asOf) {
    throw new Error(`Range ${fromDay}..${throughDay} escapes the timelines window ${built.window.from}..${built.window.asOf}`);
  }

  const points: ModeledTeamPointPackage[] = [];
  const diagnostics: ModeledBackfillDiagnostics = {
    membershipTeamDays: 0, suppressedRecordedTeamDays: 0, unpricedTeamDays: 0, pointsEmitted: 0,
  };

  for (const teamId of [...input.teamIds].sort((a, b) => a - b)) {
    for (let cursor = fromDay; cursor <= throughDay; cursor = dayAfter(cursor)) {
      const membership = input.membershipOnDay(teamId, cursor);
      if (!membership) continue; // No membership asserted: the day stays a gap.
      diagnostics.membershipTeamDays += 1;
      if (input.recordedAdmits(teamId, cursor)) {
        // The recorded lane owns this team-day; modeled never competes.
        diagnostics.suppressedRecordedTeamDays += 1;
        continue;
      }
      const at = endOfDay(cursor);
      const season = String(nbaSeasonStartYear(cursor));
      const memberIds = [...membership.playerIds].sort((a, b) => Number(a) - Number(b));
      if (new Set(memberIds).size !== memberIds.length) {
        // A duplicated member would be priced once per listing and
        // silently double its contribution to the subtotal. Membership
        // is evidence: reject the duplication, never absorb it.
        throw new Error(
          `Membership for team ${teamId} on ${cursor} lists a player more than once; refusing to price a duplicated roster`);
      }
      const lines: ModeledTeamPointPackage["players"] = [];
      const pricedIds: string[] = [];
      let subtotal = 0;
      for (const playerId of memberIds) {
        const timeline = built.timelines.get(playerId);
        if (!timeline) {
          lines.push({ playerId, priceCents: null, missingReason: "no-modeled-timeline", proof: null, anchorDate: null, anchorAgeDays: null });
          continue;
        }
        const valuation = valuationAt(timeline, at);
        const anchor = valuation.anchor ? built.anchors.get(valuation.anchor.id) : undefined;
        if (!valuation.anchor || !anchor || valuation.priceCents == null) {
          lines.push({ playerId, priceCents: null, missingReason: "no-modeled-anchor", proof: null, anchorDate: null, anchorAgeDays: null });
          continue;
        }
        if (anchor.season.slice(0, 4) !== season) {
          // Cross-season carry is prohibited: a prior season's last
          // point never prices a day in a later season.
          lines.push({ playerId, priceCents: null, missingReason: "no-same-season-anchor", proof: null, anchorDate: null, anchorAgeDays: null });
          continue;
        }
        const anchorDate = anchor.date.slice(0, 10);
        const proof: ModeledPriceProof = {
          kind: "reconstructed", source: "gamelog", datasetId, modelVersion,
          inputCutoff: endOfDay(anchorDate), availableFrom: at, validUntil: null,
        };
        lines.push({
          playerId, priceCents: anchor.priceCents, missingReason: null, proof,
          anchorDate, anchorAgeDays: wholeDaysBetween(anchorDate, cursor),
        });
        pricedIds.push(playerId);
        subtotal += anchor.priceCents;
      }
      if (pricedIds.length === 0) {
        diagnostics.unpricedTeamDays += 1;
        continue; // No priced player: no point. The gap stays a gap.
      }
      const point: TeamHistoryPoint = {
        id: `thp-${teamId}-${cursor}`,
        day: cursor,
        valuationAt: at,
        seasonId: cursor < input.seasonTwoFromDay ? "2025" : "2026",
        rosterRef: `roster-${teamId}-${hash12(memberIds)}`,
        rosterStatus: "replayed",
        rosterCount: memberIds.length,
        priced: pricedIds.length,
        subtotalCents: subtotal,
        priceKind: "reconstructed",
        continuityId: `mseg-${hash12(pricedIds)}`,
        pricedSetId: `mps-${hash12(pricedIds)}`,
        standalone: false,
      };
      points.push({ teamId, point, players: lines });
      diagnostics.pointsEmitted += 1;
    }
  }
  return { points, diagnostics };
}

/** A recorded team-day point, tagged with the team it belongs to. */
export type RecordedTeamPoint = { teamId: number; point: TeamHistoryPoint };

/**
 * Merge the two lanes into one day-ordered series for a consumer that
 * wants both. Recorded points pass through untouched (same object);
 * a modeled point for a team-day the recorded lane covers is dropped
 * and counted — never merged into, never overwriting, the recorded
 * point. The classes stay distinguishable by priceKind and by their
 * separate continuity ids.
 */
export function composeHistorySeries(
  recorded: readonly RecordedTeamPoint[],
  modeled: readonly ModeledTeamPointPackage[]
): { points: RecordedTeamPoint[]; droppedModeled: number } {
  const key = (teamId: number, day: string) => `${teamId}|${day}`;
  const recordedKeys = new Set(recorded.map(entry => key(entry.teamId, entry.point.day)));
  const out: RecordedTeamPoint[] = [...recorded];
  let droppedModeled = 0;
  for (const entry of modeled) {
    if (recordedKeys.has(key(entry.teamId, entry.point.day))) {
      droppedModeled += 1;
      continue;
    }
    out.push({ teamId: entry.teamId, point: entry.point });
  }
  out.sort((a, b) => a.teamId - b.teamId || a.point.day.localeCompare(b.point.day));
  return { points: out, droppedModeled };
}

/** Content fingerprint of the roster-replay evidence: both segments'
 *  verified final rosters, the gap, and the boundary reconciliation.
 *  A different replay truth produces a different generation. */
export function computeRosterEvidenceHash(chain: ChainRosterReplay): string {
  const finals = (rosters: ReadonlyMap<number, readonly string[]>) =>
    [...rosters.entries()].sort((a, b) => a[0] - b[0]).map(([id, players]) => [id, [...players].sort()]);
  return sha256(JSON.stringify({
    seasonOneFinals: finals(chain.seasonOne.finalRosters),
    seasonTwoFinals: finals(chain.seasonTwo.finalRosters),
    gap: [chain.gapRange.from, chain.gapRange.toExclusive],
    reconciliation: chain.seasonTwo.reconciliation.map(entry => [entry.rosterId, entry.cuts, entry.additions]),
  }));
}

/** A file-shaped export of the roster replay's membership, so the
 *  offline runner can compose without importing the replay's loader
 *  chain: teamId → day → rostered player ids, for exactly the days the
 *  replay asserts membership. Days absent from the map are gaps. */
export type MembershipSnapshot = {
  version: "membership-snapshot-v1";
  rosterEvidenceHash: string;
  /** Canonical hash of the snapshot's DATED membership content — the
   *  window, the season boundary, and every team-day's player list.
   *  Unlike the roster-evidence hash (final rosters, gap, boundary
   *  reconciliation), this binds historical membership truth itself:
   *  a corrected past trade date changes it even when the final
   *  rosters are untouched. Verified before any composition. */
  membershipHash: string;
  /** The chain's season-two anchor day (HISTORY_SEASON_TWO_FROM). */
  seasonTwoFromDay: string;
  range: { fromDay: string; throughDay: string };
  teamIds: number[];
  days: Record<string, Record<string, readonly string[]>>;
};

const PLAYER_ID_PATTERN = /^\d+$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
/** Total order for player ids: numeric, with a string tiebreak so ids
 *  beyond float precision still canonicalize deterministically. */
const comparePlayerIds = (a: string, b: string) => (Number(a) - Number(b)) || (a < b ? -1 : a > b ? 1 : 0);

/** Canonical content hash of a membership snapshot's dated truth:
 *  the window (range + season boundary) and, per team, each day's
 *  player list. Key order and per-day list order in the source JSON
 *  do not matter; the dated content does. */
export function computeMembershipSnapshotHash(snapshot: {
  seasonTwoFromDay: string;
  range: { fromDay: string; throughDay: string };
  teamIds: readonly number[];
  days: MembershipSnapshot["days"];
}): string {
  const teamIds = [...snapshot.teamIds].sort((a, b) => a - b);
  const days = teamIds.map(teamId => [
    teamId,
    Object.entries(snapshot.days[String(teamId)] ?? {})
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([day, playerIds]) => [day, [...playerIds].sort(comparePlayerIds)] as const),
  ]);
  return sha256(JSON.stringify({
    version: "membership-snapshot-v1",
    seasonTwoFromDay: snapshot.seasonTwoFromDay,
    range: [snapshot.range.fromDay, snapshot.range.throughDay],
    teamIds,
    days,
  }));
}

export function exportMembershipSnapshot(chain: ChainRosterReplay): MembershipSnapshot {
  const teamIds = [...chain.seasonOne.finalRosters.keys()].sort((a, b) => a - b);
  const fromDay = chain.seasonOne.anchorAt.slice(0, 10);
  const throughDay = chain.asOf.slice(0, 10);
  const days: MembershipSnapshot["days"] = {};
  for (const teamId of teamIds) {
    const perDay: Record<string, readonly string[]> = {};
    for (let cursor = fromDay; cursor <= throughDay; cursor = dayAfter(cursor)) {
      const membership = chain.membershipOnDay(teamId, cursor);
      if (membership) perDay[cursor] = [...membership.playerIds];
    }
    days[String(teamId)] = perDay;
  }
  const content = {
    seasonTwoFromDay: chain.seasonTwo.anchorAt.slice(0, 10),
    range: { fromDay, throughDay },
    teamIds,
    days,
  };
  return {
    version: "membership-snapshot-v1",
    rosterEvidenceHash: computeRosterEvidenceHash(chain),
    membershipHash: computeMembershipSnapshotHash(content),
    ...content,
  };
}

/**
 * Validate an offline membership snapshot before it is trusted, and
 * verify its claimed membership hash against its actual dated
 * content. Fails closed on anything malformed: non-canonical day
 * keys, unknown or missing teams, duplicated player ids in a
 * team-day (which composition would otherwise price twice), or a
 * hash that does not match the days it claims to bind (a corrected
 * historical membership reusing a stale generation is rejected, not
 * silently composed).
 */
export function assertMembershipSnapshot(snapshot: unknown): asserts snapshot is MembershipSnapshot {
  const fail = (why: string): never => {
    throw new Error(`Membership snapshot rejected: ${why}`);
  };
  if (typeof snapshot !== "object" || snapshot === null || Array.isArray(snapshot)) fail("not an object");
  const s = snapshot as Record<string, unknown>;
  if (s.version !== "membership-snapshot-v1") fail(`version is ${JSON.stringify(s.version)}, not "membership-snapshot-v1"`);
  if (typeof s.rosterEvidenceHash !== "string" || !SHA256_PATTERN.test(s.rosterEvidenceHash)) {
    fail("rosterEvidenceHash is not a sha256 hex string");
  }
  if (typeof s.membershipHash !== "string" || !SHA256_PATTERN.test(s.membershipHash)) {
    fail("membershipHash is not a sha256 hex string");
  }
  if (typeof s.seasonTwoFromDay !== "string" || !isCalendarDay(s.seasonTwoFromDay)) {
    fail(`seasonTwoFromDay is not a calendar day: ${JSON.stringify(s.seasonTwoFromDay)}`);
  }
  const rawRange = s.range as { fromDay?: unknown; throughDay?: unknown } | null;
  const rangeFromDay = rawRange?.fromDay;
  const rangeThroughDay = rawRange?.throughDay;
  if (typeof rangeFromDay !== "string" || !isCalendarDay(rangeFromDay)
    || typeof rangeThroughDay !== "string" || !isCalendarDay(rangeThroughDay)) {
    fail("range does not carry two canonical calendar days");
  }
  // The guard above threw unless both are canonical day strings.
  const range = { fromDay: rangeFromDay as string, throughDay: rangeThroughDay as string };
  if (range.fromDay > range.throughDay) fail("range is inverted");
  if (!Array.isArray(s.teamIds) || s.teamIds.length === 0
    || !s.teamIds.every(id => Number.isSafeInteger(id) && (id as number) > 0)) {
    fail("teamIds is not a non-empty list of positive integer team ids");
  }
  const teamIds = s.teamIds as number[];
  if (new Set(teamIds).size !== teamIds.length) fail("teamIds lists a team more than once");
  if (typeof s.days !== "object" || s.days === null || Array.isArray(s.days)) fail("days is not an object");
  const days = s.days as Record<string, unknown>;
  const expectedKeys = new Set(teamIds.map(id => String(id)));
  for (const key of Object.keys(days)) {
    if (!expectedKeys.has(key)) fail(`days carries team ${key}, which teamIds does not`);
  }
  for (const teamId of teamIds) {
    const perDay = days[String(teamId)];
    if (typeof perDay !== "object" || perDay === null || Array.isArray(perDay)) {
      fail(`days has no membership object for team ${teamId}`);
    }
    for (const [day, playerIds] of Object.entries(perDay as Record<string, unknown>)) {
      if (!isCalendarDay(day)) {
        fail(`team ${teamId} carries a non-canonical day key: ${JSON.stringify(day)}`);
      }
      if (day < range.fromDay || day > range.throughDay) {
        fail(`team ${teamId} carries day ${day}, outside the snapshot range`);
      }
      if (!Array.isArray(playerIds) || !playerIds.every(id => typeof id === "string" && PLAYER_ID_PATTERN.test(id))) {
        fail(`team ${teamId} on ${day} does not carry a list of player ids`);
      }
      if (new Set(playerIds as string[]).size !== (playerIds as string[]).length) {
        fail(`team ${teamId} on ${day} lists a player more than once; a duplicated member would be priced twice`);
      }
    }
  }
  const verified = snapshot as MembershipSnapshot;
  if (computeMembershipSnapshotHash(verified) !== verified.membershipHash) {
    fail("membershipHash does not match the snapshot's dated membership content — "
      + "the snapshot was altered after hashing or its hash is stale; regenerate it (modeled-backfill-export harness)");
  }
}

/**
 * Validate the runner's recorded-lane inventory and return the
 * admitted team-day key set. Fails closed: a non-canonical day (an
 * ISO instant can never match a composition day key, so its
 * suppression would be silently missed), a team the membership
 * snapshot does not carry, or a duplicated entry all reject the run
 * rather than normalizing uncertain evidence away.
 */
export function parseRecordedInventory(inventory: unknown, teamIds: readonly number[]): Set<string> {
  if (typeof inventory !== "object" || inventory === null
    || !Array.isArray((inventory as { admittedTeamDays?: unknown }).admittedTeamDays)) {
    throw new Error("Recorded inventory must carry an admittedTeamDays array");
  }
  const knownTeams = new Set(teamIds);
  const admitted = new Set<string>();
  for (const entry of (inventory as { admittedTeamDays: unknown[] }).admittedTeamDays) {
    const e = entry as { teamId?: unknown; day?: unknown } | null;
    if (typeof e !== "object" || e === null || !Number.isInteger(e.teamId)
      || typeof e.day !== "string" || !isCalendarDay(e.day)) {
      throw new Error(`Malformed recorded-inventory entry: ${JSON.stringify(entry)}`);
    }
    if (!knownTeams.has(e.teamId as number)) {
      throw new Error(
        `Recorded inventory names team ${e.teamId}, which the membership snapshot does not carry`);
    }
    const key = `${e.teamId}|${e.day}`;
    if (admitted.has(key)) {
      throw new Error(
        `Recorded inventory lists team-day ${key} more than once; refusing to guess which entry is authoritative`);
    }
    admitted.add(key);
  }
  return admitted;
}

/** The series generation: dataset + carry policy + roster evidence +
 *  dated membership. The membership hash binds historical membership
 *  truth itself, so two replays that agree on final rosters but
 *  differ on any past team-day are different generations. */
export const buildModeledGeneration = (datasetId: string, rosterEvidenceHash: string, membershipHash: string) =>
  `${MODELED_BACKFILL_PRODUCER_VERSION}:${datasetId}:${MODELED_CARRY_POLICY_ID}:${rosterEvidenceHash}:${membershipHash}`;

/** Assemble the runner's output package from a composition result. */
export function buildModeledBackfillPackage(input: {
  artifact: PriceHistoryArtifact;
  rosterEvidenceHash: string;
  membershipHash: string;
  range: { fromDay: string; throughDay: string };
  result: BuildModeledTeamPointsResult;
}): ModeledBackfillPackage {
  const { manifest } = input.artifact;
  return {
    packageVersion: MODELED_BACKFILL_PACKAGE_VERSION,
    producerVersion: MODELED_BACKFILL_PRODUCER_VERSION,
    policyId: MODELED_CARRY_POLICY_ID,
    datasetId: manifest.datasetId,
    modelVersion: manifest.modelVersion,
    reconstructionVersion: manifest.reconstructionVersion,
    rosterEvidenceHash: input.rosterEvidenceHash,
    membershipHash: input.membershipHash,
    generation: buildModeledGeneration(manifest.datasetId, input.rosterEvidenceHash, input.membershipHash),
    range: input.range,
    diagnostics: input.result.diagnostics,
    points: input.result.points,
  };
}
