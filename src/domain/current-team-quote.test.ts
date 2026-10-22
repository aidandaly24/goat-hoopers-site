import { expect, test } from "vitest";
import { buildPersonalizedHome } from "@/data/personalized-home";
import { personalizedFixture } from "@/test/personalized-home-fixture";
import { currentTeamQuote, isCurrentTeamQuote } from "./current-team-quote";

function summary() {
  const f = personalizedFixture();
  const data = buildPersonalizedHome({ kind: "member", teamId: "1" }, f.home, f.weekly, f.market);
  if (data.kind !== "member" || !data.summary) throw Error("Missing synthetic member summary");
  return data.summary;
}
test("projects the same headline cents and roster with a stable calculation identity, without changing input", () => {
  const s = summary(), original = structuredClone(s), q = currentTeamQuote(s)!;
  expect(isCurrentTeamQuote(q)).toBe(true); expect(q.kind).toBe("current-modeled");
  expect(q.subtotalCents).toBe(Math.round(s.valuation.total! * 100));
  expect(q.priced).toBe(s.valuation.priced); expect(q.rosterCount).toBe(s.valuation.players.length);
  expect(q.calculatedAt).toBe(new Date(s.market!.updatedAt).toISOString());
  s.rosterValues.reverse(); s.valuation.players.reverse();
  expect(currentTeamQuote(s)?.calculationId).toBe(q.calculationId);
  expect({ ...s, rosterValues: [...s.rosterValues].reverse(), valuation: { ...s.valuation, players: [...s.valuation.players].reverse() } }).toEqual(original);
});
test("partial, entirely unpriced, empty and unknown rosters are distinct", () => {
  const s = summary();
  s.valuation.players[0].value = null; s.rosterValues[0].value = null;
  s.valuation.priced--; s.valuation.unpriced++; s.valuation.complete = false;
  // Derive the fixture's actual remaining sum; no unknown is valued as zero.
  s.valuation.total = s.valuation.players.reduce((n,p) => n + (p.value ?? 0), 0);
  expect(currentTeamQuote(s)).toMatchObject({ complete: false, priced: 3, rosterCount: 4, subtotalCents: s.valuation.total * 100 });
  for (const p of s.valuation.players) p.value = null;
  for (const p of s.rosterValues) p.value = null;
  Object.assign(s.valuation, { total: null, priced: 0, unpriced: 4 });
  expect(currentTeamQuote(s)).toMatchObject({ knownRoster: true, subtotalCents: null, rosterCount: 4 });
  s.rosterValues = []; Object.assign(s.valuation, { players: [], total: 0, priced: 0, unpriced: 0, complete: true });
  expect(currentTeamQuote(s)).toMatchObject({ subtotalCents: 0, rosterCount: 0, complete: true });
  Object.assign(s.valuation, { knownRoster: false, total: null, complete: false });
  expect(currentTeamQuote(s)).toMatchObject({ subtotalCents: null, rosterCount: null, knownRoster: false });
});
test("same timestamp and total do not disguise a changed roster or changed quote allocation", () => {
  const s = summary(), first = currentTeamQuote(s)!;
  s.valuation.players[0].value! += 1; s.rosterValues[0].value! += 1;
  s.valuation.players[1].value! -= 1; s.rosterValues[1].value! -= 1;
  expect(currentTeamQuote(s)?.calculationId).not.toBe(first.calculationId);
  const next = currentTeamQuote(s)!;
  s.rosterValues[0].id = s.valuation.players[0].id = "synthetic-replacement";
  expect(currentTeamQuote(s)?.calculationId).not.toBe(next.calculationId);
});
test("calculation time/basis/team changes invalidate identity; cosmetic names do not invent price versions", () => {
  const s = summary(), first = currentTeamQuote(s)!;
  s.rosterValues[0].name += " renamed"; expect(currentTeamQuote(s)?.calculationId).toBe(first.calculationId);
  s.market!.updatedAt++; expect(currentTeamQuote(s)?.calculationId).not.toBe(first.calculationId);
  const second = currentTeamQuote(s)!;
  s.market!.pricingBasis = s.market!.pricingBasis === "preseason" ? "in-season" : "preseason";
  expect(currentTeamQuote(s)?.calculationId).not.toBe(second.calculationId);
  s.team.id = "different-team"; expect(currentTeamQuote(s)?.teamId).toBe("different-team");
});
test("inconsistent sums, missing prices, duplicate identities and invalid clocks fail closed", () => {
  const s = summary(); s.valuation.total! += 1; expect(currentTeamQuote(s)).toBeNull();
  const mismatched = summary(); mismatched.rosterValues[0].value! += 1; expect(currentTeamQuote(mismatched)).toBeNull();
  const duplicate = summary(); duplicate.rosterValues[1].id = duplicate.rosterValues[0].id; expect(currentTeamQuote(duplicate)).toBeNull();
  const clock = summary(); clock.market!.updatedAt = Infinity; expect(currentTeamQuote(clock)).toBeNull();
  clock.market = null; expect(currentTeamQuote(clock)).toBeNull();
  for (const bad of [null, {}, { ...currentTeamQuote(summary()), calculationId: "old" }]) expect(isCurrentTeamQuote(bad)).toBe(false);
});
