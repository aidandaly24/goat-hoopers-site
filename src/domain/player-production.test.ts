import { expect, test } from "vitest";
import { summarizeProduction } from "./player-production";

const YAXEL_LINE = {
  ast: 2.0, dreb: 1.0, fga: 11.0, fgm: 5.0, fta: 3.0, ftm: 1.0,
  gp: 1.0, gs: 1.0, min: 29.0, oreb: 2.0, pts: 12.0, reb: 3.0,
  stl: 1.0, tpa: 4.0, tpm: 1.0,
};

test("projects a real stat line to dated per-game evidence with known gp/gs", () => {
  const summary = summarizeProduction("2026", YAXEL_LINE);
  expect(summary.state).toBe("available");
  if (summary.state !== "available") throw new Error("expected available");
  const p = summary.production;
  expect(p.season).toBe("2026");
  expect(p.source).toBe("sleeper-stats");
  expect(p.gp).toBe(1);
  expect(p.gs).toBe(1);
  expect(p.averages).toMatchObject({
    pts: 12.0, reb: 3.0, ast: 2.0, stl: 1.0, blk: 0.0, tpm: 1.0, min: 29.0,
    fgPct: 45.5, ftPct: 33.3,
  });
});

test("divides season totals by gp for multi-game samples", () => {
  const summary = summarizeProduction("2026", {
    ...YAXEL_LINE, gp: 2, gs: 2, pts: 24, reb: 8, min: 58, fga: 22, fgm: 10,
  });
  expect(summary.state).toBe("available");
  if (summary.state !== "available") throw new Error("expected available");
  expect(summary.production.averages).toMatchObject({ pts: 12.0, reb: 4.0, min: 29.0, fgPct: 45.5 });
});

test("missing, null and empty entries are no-recorded-stats — never zeros", () => {
  expect(summarizeProduction("2026", null)).toMatchObject({
    state: "unavailable", reason: "no-recorded-stats",
  });
  expect(summarizeProduction("2026", undefined)).toMatchObject({
    state: "unavailable", reason: "no-recorded-stats",
  });
  expect(summarizeProduction("2026", {})).toMatchObject({
    state: "unavailable", reason: "no-recorded-stats",
  });
  expect(summarizeProduction("2026", { gp: 0 })).toMatchObject({
    state: "unavailable", reason: "no-recorded-stats",
  });
});

test("legitimate played zeros stay zeros — a 0.0 steal with gp>0 is evidence, not absence", () => {
  const summary = summarizeProduction("2026", { ...YAXEL_LINE, stl: 0, blk: 0 });
  expect(summary.state).toBe("available");
  if (summary.state !== "available") throw new Error("expected available");
  expect(summary.production.averages.stl).toBe(0.0);
  expect(summary.production.averages.blk).toBe(0.0);
});

test("zero attempts yield null percentages — never a fabricated 0%", () => {
  const summary = summarizeProduction("2026", {
    ...YAXEL_LINE, fga: 0, fgm: 0, fta: 0, ftm: 0,
  });
  expect(summary.state).toBe("available");
  if (summary.state !== "available") throw new Error("expected available");
  expect(summary.production.averages.fgPct).toBeNull();
  expect(summary.production.averages.ftPct).toBeNull();
});

test("impossible lines are invalid-record, not projected", () => {
  expect(summarizeProduction("2026", { ...YAXEL_LINE, gs: 2 })).toMatchObject({
    state: "unavailable", reason: "invalid-record",
  });
  expect(summarizeProduction("2026", { ...YAXEL_LINE, pts: -5 })).toMatchObject({
    state: "unavailable", reason: "invalid-record",
  });
  expect(summarizeProduction("2026", { ...YAXEL_LINE, min: Number.NaN })).toMatchObject({
    state: "unavailable", reason: "invalid-record",
  });
  expect(summarizeProduction("2026", { ...YAXEL_LINE, gp: 1.5 })).toMatchObject({
    state: "unavailable", reason: "invalid-record",
  });
});

test("unavailable results preserve the season context", () => {
  expect(summarizeProduction("2026", null)).toMatchObject({
    state: "unavailable", reason: "no-recorded-stats", season: "2026",
  });
  expect(summarizeProduction("2025", {})).toMatchObject({
    state: "unavailable", reason: "no-recorded-stats", season: "2025",
  });
  expect(summarizeProduction("2026", { ...YAXEL_LINE, gs: 2 })).toMatchObject({
    state: "unavailable", reason: "invalid-record", season: "2026",
  });
});

test("the season travels with the evidence — never attributed elsewhere", () => {
  const a = summarizeProduction("2026", YAXEL_LINE);
  const b = summarizeProduction("2025", YAXEL_LINE);
  expect(a.state).toBe("available");
  expect(b.state).toBe("available");
  if (a.state !== "available" || b.state !== "available") throw new Error("expected available");
  expect(a.production.season).toBe("2026");
  expect(b.production.season).toBe("2025");
});
