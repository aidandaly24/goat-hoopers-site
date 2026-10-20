import { expect, test } from "vitest";
import { teamValueHistoryDetailFixture, teamValueHistoryFixture } from "../test/team-value-history-fixture";
import { historyDetailMatchesPoint, historyInstantKey, historyPresetRange, historySegments, isTeamValueHistoryDetail, isTeamValueHistoryEnvelope } from "./team-value-history";

test("the shared fixtures satisfy one envelope/detail contract, including a price gap", () => {
  const envelope = teamValueHistoryFixture();
  expect(isTeamValueHistoryEnvelope(envelope)).toBe(true);
  for (const point of envelope.points) {
    const detail = teamValueHistoryDetailFixture(point.day);
    expect(isTeamValueHistoryDetail(detail), point.day).toBe(true);
    expect(historyDetailMatchesPoint(detail, point), point.day).toBe(true);
  }
  expect(isTeamValueHistoryDetail(teamValueHistoryDetailFixture("2025-11-01"))).toBe(true);
});
test("All time and season ranges preserve source bounds; last30 includes the as-of day", () => {
  const envelope = teamValueHistoryFixture();
  expect(historyPresetRange(envelope, "all")).toEqual(envelope.leagueRange);
  expect(historyPresetRange(envelope, "season:2025")).toEqual(envelope.seasons[0].range);
  expect(historyPresetRange(envelope, "recent")).toEqual({ from: "2026-09-21", toExclusive: "2026-10-21" });
});
test("lines break at annual points, source changes, missing days, seasons and differing partial sets", () => {
  const envelope = teamValueHistoryFixture();
  expect(historySegments(envelope.points).map(group => group.map(point => point.day))).toEqual([
    ["2026-06-30"], ["2026-10-08", "2026-10-09"], ["2026-10-11", "2026-10-12"],
    ["2026-10-13"], ["2026-10-14", "2026-10-15", "2026-10-16"], ["2026-10-18", "2026-10-19"],
  ]);
  const points = structuredClone(envelope.points.slice(-2));
  points[1].seasonId = "2025";
  expect(historySegments(points)).toHaveLength(2);
  points[1].seasonId = points[0].seasonId; points[1].continuityId = null;
  expect(historySegments(points)).toHaveLength(2);
});
test("microsecond timestamps are ordered without date rounding and impossible dates fail", () => {
  expect(historyInstantKey("2026-10-19T12:00:00.000001Z")! < historyInstantKey("2026-10-19T12:00:00.000002Z")!).toBe(true);
  expect(historyInstantKey("2026-02-30T12:00:00Z")).toBeNull();
  expect(historyInstantKey("2026-10-19T24:00:00Z")).toBeNull();
});
test("unknown is not zero; partial sums, future points and duplicate dates cannot masquerade as complete history", () => {
  for (const mode of ["unknown-zero", "future", "duplicate", "too-many", "unknown-roster"]) {
    const input = teamValueHistoryFixture();
    if (mode === "unknown-zero") input.points[0].subtotalCents = 0;
    if (mode === "future") input.points.at(-1)!.valuationAt = "2026-10-21T12:00:00Z";
    if (mode === "duplicate") input.points.push({ ...input.points[1], id: "duplicate-date" });
    if (mode === "too-many") input.points = Array(801).fill(input.points[1]);
    if (mode === "unknown-roster") input.points.at(-1)!.rosterStatus = "ambiguous";
    expect(isTeamValueHistoryEnvelope(input), mode).toBe(false);
  }
});
test("detail rejects future/expired/unbounded prices, wrong sums and forged recorded timestamps", () => {
  for (const mode of ["future", "expired", "unbounded", "sum", "native", "failed-move", "unknown-boundary-time"]) {
    const detail = teamValueHistoryDetailFixture("2026-10-19"), proof = detail.players[0].price!;
    if (mode === "future") proof.availableFrom = "2026-10-19T12:00:00.000001Z";
    if (mode === "expired") proof.validUntil = detail.valuationAt;
    if (mode === "unbounded") { proof.availableFrom = "2026-10-18T12:00:00Z"; if (proof.kind === "recorded") { proof.recordedAt = proof.availableFrom; proof.nativeTimestamp = proof.availableFrom.slice(0, -1); } }
    if (mode === "sum") detail.subtotalCents!++;
    if (mode === "native" && proof.kind === "recorded") proof.nativeTimestamp = "2026-10-18T12:00:00";
    if (mode === "failed-move") (detail.moves[0] as unknown as { status: string }).status = "failed";
    if (mode === "unknown-boundary-time") detail.moves[1].effectiveAt = "2026-10-19T00:00:00Z";
    expect(isTeamValueHistoryDetail(detail), mode).toBe(false);
  }
});
test("detail rejects unscoped move legs, negative FAAB and fractional legs (#224 move shape)", () => {
  for (const mode of ["unscoped-leg", "negative-faab", "fractional-leg", "forged-pick"]) {
    const detail = teamValueHistoryDetailFixture("2026-10-19");
    if (mode === "unscoped-leg") (detail.moves[0].adds[0] as { rosterId?: number }).rosterId = undefined;
    if (mode === "negative-faab") detail.moves[0].waiverBid = -1;
    if (mode === "fractional-leg") detail.moves[0].leg = 1.5;
    if (mode === "forged-pick") detail.moves[0].draftPicks = [{ season: "2026", round: 0, rosterId: 1, ownerId: 2, previousOwnerId: 1 }];
    expect(isTeamValueHistoryDetail(detail), mode).toBe(false);
  }
  // The honest nulls stay valid: not-read picks and no-FAAB are data, not errors.
  const detail = teamValueHistoryDetailFixture("2026-10-19");
  detail.moves[0].draftPicks = null; detail.moves[0].waiverBid = null;
  expect(isTeamValueHistoryDetail(detail)).toBe(true);
});
