import { test } from "vitest";
import assert from "node:assert/strict";
import {
  ARCHETYPES,
  METRIC_INFO,
  assignArchetype,
  buildArchetypeProfiles,
  currentArchetype,
  percentileRank,
  type ArchetypeId,
  type ArchetypeSignals,
  type MetricId,
  type RawGmMetrics2025,
} from "./manager-archetype";
import { GM_METRICS_2025 } from "@/data/gm-archetypes-2025";

test("percentileRank: basic ranks and top/bottom bounds", () => {
  assert.equal(percentileRank([10, 20, 30], 20), 50);
  assert.equal(percentileRank([10, 20, 30], 10), 0);
  assert.equal(percentileRank([10, 20, 30], 30), 100);
  assert.equal(percentileRank([1, 2, 3, 4, 5], 5), 100);
});

test("percentileRank: ties share the value (strictly-below counting)", () => {
  assert.equal(percentileRank([10, 10, 10, 10], 10), 0);
  assert.equal(percentileRank([5, 5, 20, 20], 20), 67); // 2 of 3 strictly below
});

test("percentileRank: one or fewer values is the neutral 50", () => {
  assert.equal(percentileRank([5], 5), 50);
  assert.equal(percentileRank([], 7), 50);
});

test("METRIC_INFO covers all five metrics with honest definitions", () => {
  const ids: MetricId[] = [
    "draftCapital",
    "tradeFrequency",
    "wireAggression",
    "youthPreference",
    "patience",
  ];
  assert.deepEqual(Object.keys(METRIC_INFO).sort(), ids.sort());
  assert.match(
    METRIC_INFO.wireAggression.definition,
    /no FAAB bids exist in the transaction data/,
  );
});

const MID: Record<MetricId, number> = {
  draftCapital: 50,
  tradeFrequency: 50,
  wireAggression: 50,
  youthPreference: 50,
  patience: 50,
};

function sig(over: {
  metrics?: Partial<Record<MetricId, number | null>>;
  fixhimAdds?: number;
  homerHerfindahl?: number;
}): ArchetypeSignals {
  return {
    metrics: { ...MID, ...over.metrics },
    fixhimAdds: over.fixhimAdds ?? 0,
    homerHerfindahl: over.homerHerfindahl ?? 0.07,
  };
}

test("assignArchetype reaches every archetype", () => {
  const cases: Array<[ArchetypeId, ArchetypeSignals]> = [
    ["trade-addict", sig({ metrics: { tradeFrequency: 95 } })],
    [
      "dynasty-terrorist",
      sig({ metrics: { wireAggression: 90, patience: 10 } }),
    ],
    [
      "win-now",
      sig({
        metrics: { youthPreference: 30, draftCapital: 30, wireAggression: 60 },
      }),
    ],
    ["win-now", sig({ metrics: { draftCapital: 5, wireAggression: 40 } })],
    ["hoarder", sig({ metrics: { draftCapital: 80, wireAggression: 20 } })],
    [
      "prospect-goblin",
      sig({ metrics: { youthPreference: 90, draftCapital: 50 } }),
    ],
    [
      "rebuilder",
      sig({ metrics: { youthPreference: 70, patience: 70 } }),
    ],
    ["fix-him", sig({ fixhimAdds: 8 })],
    ["homer", sig({ homerHerfindahl: 0.09 })],
    ["chaotic-neutral", sig({})],
  ];
  for (const [expected, s] of cases) {
    assert.equal(
      assignArchetype(s),
      expected,
      `expected ${expected} for ${JSON.stringify(s)}`,
    );
  }
  // Every archetype has a name and tagline.
  assert.equal(Object.keys(ARCHETYPES).length, 9);
});

test("archetype taglines carry no unsupported numbers", () => {
  // Reusable tagline copy must not embed standalone numeric claims:
  // drops/survivors are not in the raw schema, so no injected manager
  // or future season may inherit one season's numbers from shared copy.
  // (Age descriptors like "19-year-old" are generic copy, not stat
  // claims, so hyphen-adjacent digits are excluded.)
  const statNumber = /(?:^|[^\d\w-])\d+(?:[^\d\w-]|$)/;
  for (const [id, a] of Object.entries(ARCHETYPES)) {
    assert.ok(
      !statNumber.test(a.tagline),
      `${id} tagline embeds a numeric claim: ${a.tagline}`,
    );
  }
});

test("decision table: first match wins when several gates fire", () => {
  // Gate 1 beats the homer and hoarder gates.
  assert.equal(
    assignArchetype(
      sig({
        metrics: { tradeFrequency: 95, draftCapital: 80, wireAggression: 20 },
        homerHerfindahl: 0.09,
      }),
    ),
    "trade-addict",
  );
  // Gate 3 (win-now) beats gate 8 (fix-him).
  assert.equal(
    assignArchetype(
      sig({
        metrics: { youthPreference: 30, draftCapital: 30, wireAggression: 60 },
        fixhimAdds: 10,
      }),
    ),
    "win-now",
  );
  // Gate 8 (fix-him) beats gate 9 (homer).
  assert.equal(
    assignArchetype(sig({ fixhimAdds: 11, homerHerfindahl: 0.09 })),
    "fix-him",
  );
});

test("assignArchetype: a null metric never satisfies a gate", () => {
  assert.equal(
    assignArchetype(sig({ metrics: { tradeFrequency: null } })),
    "chaotic-neutral",
  );
  assert.equal(
    assignArchetype(sig({ metrics: { patience: null, wireAggression: 90 } })),
    "chaotic-neutral",
  );
});

function rawFixture(
  over: Partial<RawGmMetrics2025>,
): Record<string, RawGmMetrics2025> {
  const base: RawGmMetrics2025 = {
    managerName: "x",
    teamName: null,
    draftCapital: 0,
    trades: 0,
    adds: 0,
    avgAgeYears: 25,
    medianTenureDays: 10,
    homerHerfindahl: 0.07,
    fixhimAdds: 0,
  };
  return { "1": { ...base, ...over } };
}

test("buildArchetypeProfiles: null tenure stays null; measured tenures rank within the measured cohort", () => {
  const base: RawGmMetrics2025 = {
    managerName: "x",
    teamName: null,
    draftCapital: 0,
    trades: 0,
    adds: 0,
    avgAgeYears: 25,
    medianTenureDays: 10,
    homerHerfindahl: 0.07,
    fixhimAdds: 0,
  };
  const profiles = buildArchetypeProfiles({
    "1": { ...base, managerName: "quick", medianTenureDays: 10 },
    "2": { ...base, managerName: "slow", medianTenureDays: 20 },
    "3": { ...base, managerName: "unknown", medianTenureDays: null },
  });
  const byName = Object.fromEntries(
    profiles.map((p) => [p.seasons[0].managerName, p.seasons[0].metrics]),
  );
  // Unmeasured stays unmeasured: never a percentile, never a gate input.
  assert.equal(byName.unknown.patience, null);
  // Measured managers rank against the measured-only cohort.
  assert.equal(byName.slow.patience, 100);
  assert.equal(byName.quick.patience, 0);
});

test("buildArchetypeProfiles: an all-null tenure cohort cannot satisfy a measured-patience gate", () => {
  const base: RawGmMetrics2025 = {
    managerName: "x",
    teamName: null,
    draftCapital: 0,
    trades: 0,
    adds: 0,
    avgAgeYears: 25,
    medianTenureDays: null,
    homerHerfindahl: 0.07,
    fixhimAdds: 0,
  };
  // Extreme wire volume would have fallen back to patience 0 (and the
  // dynasty-terrorist gate) under the old imputation.
  const profiles = buildArchetypeProfiles({
    "1": { ...base, managerName: "wirefiend", adds: 100, draftCapital: 5 },
    "2": { ...base, managerName: "quiet", adds: 10, draftCapital: 0 },
  });
  for (const p of profiles) {
    assert.equal(p.seasons[0].metrics.patience, null);
  }
  const fiend = profiles.find(
    (p) => p.seasons[0].managerName === "wirefiend",
  );
  assert.ok(fiend);
  assert.equal(fiend.seasons[0].metrics.wireAggression, 100);
  assert.notEqual(fiend.seasons[0].archetype, "dynasty-terrorist");
});

test("2025 frozen managers with unmeasured tenure show patience as null", () => {
  const profiles = buildArchetypeProfiles(GM_METRICS_2025);
  const byId = Object.fromEntries(profiles.map((p) => [p.rosterId, p]));
  // Rosters 8 and 9 have no timed stints in the baked artifact.
  assert.equal(byId["8"].seasons[0].metrics.patience, null);
  assert.equal(byId["9"].seasons[0].metrics.patience, null);
});

test("buildArchetypeProfiles: one entry per roster, sorted by roster id", () => {
  const profiles = buildArchetypeProfiles({
    ...rawFixture({}),
    "2": { ...rawFixture({})["1"], managerName: "y" },
  });
  assert.deepEqual(
    profiles.map((p) => p.rosterId),
    ["1", "2"],
  );
  for (const p of profiles) {
    assert.equal(p.seasons.length, 1);
    assert.equal(p.seasons[0].season, "2025");
  }
});

test("2025 assignments from the real artifact", () => {
  const expected: Record<string, ArchetypeId> = {
    TommyDieselfuel: "trade-addict",
    GriffinHealy: "dynasty-terrorist",
    vannweinkauf: "win-now",
    lordlx: "win-now",
    slennox: "hoarder",
    Aedan23: "prospect-goblin",
    philbiag: "rebuilder",
    papichooter: "fix-him",
    TyreseHalibooty: "homer",
    aidandaly20: "chaotic-neutral",
  };
  const profiles = buildArchetypeProfiles(GM_METRICS_2025);
  assert.equal(profiles.length, 10);
  for (const p of profiles) {
    const season = p.seasons[0];
    assert.equal(
      currentArchetype(p),
      expected[season.managerName],
      `${season.managerName}: expected ${expected[season.managerName]}`,
    );
  }
});

test("roster 8 carries the prior-manager note; nobody else does", () => {
  const profiles = buildArchetypeProfiles(GM_METRICS_2025);
  const byId = Object.fromEntries(profiles.map((p) => [p.rosterId, p]));
  assert.equal(
    byId["8"].seasons[0].priorManagerNote,
    "2025 \u00b7 managed then by slennox (QBs Gremlins) \u2014 not the current manager.",
  );
  assert.equal(byId["8"].seasons[0].managerName, "slennox");
  for (const p of profiles) {
    if (p.rosterId === "8") continue;
    assert.equal(p.seasons[0].priorManagerNote, null);
  }
});

test("currentArchetype returns the last season entry", () => {
  const [p] = buildArchetypeProfiles(rawFixture({}));
  assert.equal(currentArchetype(p), p.seasons[0].archetype);
  assert.equal(currentArchetype({ rosterId: "1", seasons: [] }), null);
});
