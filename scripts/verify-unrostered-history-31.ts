/**
 * Regression test for issue #31: unrostered listings must recover history.
 *
 * Standalone tsx script (vitest foundation in PR #34 not yet merged).
 * Run: npx tsx scripts/verify-unrostered-history-31.ts
 *
 * Verifies:
 * 1. hasMarketFootprint: each signal type → true; no signals → false.
 * 2. marketCandidateIds: rostered + unrostered-drafted players included;
 *    no-footprint directory players excluded.
 * 3. Integration: computePlayerStocks gives the unrostered drafted player
 *    a non-null prevPrice/changePct when history is seeded for it.
 */
import {
  hasMarketFootprint,
  marketCandidateIds,
  computePlayerStocks,
  type StockMarketInput,
} from "../src/data/transform";

let failures = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    console.log(`  ok: ${name}`);
  } else {
    console.log(`  FAIL: ${name}`);
    failures++;
  }
}

console.log("1. hasMarketFootprint predicate");
check("owned → true", hasMarketFootprint({ owned: 1, spent: 0, trades: 0, adds: 0, drops: 0, pick: null }));
check("spent → true", hasMarketFootprint({ owned: 0, spent: 5, trades: 0, adds: 0, drops: 0, pick: undefined }));
check("trades → true", hasMarketFootprint({ owned: 0, spent: 0, trades: 2, adds: 0, drops: 0, pick: null }));
check("adds → true", hasMarketFootprint({ owned: 0, spent: 0, trades: 0, adds: 1, drops: 0, pick: null }));
check("drops → true", hasMarketFootprint({ owned: 0, spent: 0, trades: 0, adds: 0, drops: 1, pick: null }));
check("pick → true", hasMarketFootprint({ owned: 0, spent: 0, trades: 0, adds: 0, drops: 0, pick: 2 }));
check("pick 0 → true (pick 0 is a real pick)", hasMarketFootprint({ owned: 0, spent: 0, trades: 0, adds: 0, drops: 0, pick: 0 }));
check("no signals → false", !hasMarketFootprint({ owned: 0, spent: 0, trades: 0, adds: 0, drops: 0, pick: null }));
check("no signals (undefined pick) → false", !hasMarketFootprint({ owned: 0, spent: 0, trades: 0, adds: 0, drops: 0, pick: undefined }));

console.log("2. marketCandidateIds selection");
const players = {
  r1: { full_name: "Rostered One", age: 27, years_exp: 5 },
  u1: { full_name: "Unrostered Drafted", age: 20, years_exp: 0 },
  x1: { full_name: "No Footprint", age: 30, years_exp: 8 },
};
const candidateInput = {
  players,
  rosteredCount: { r1: 3 },
  faabSpent: {},
  flow: {},
  tradeCount: {},
  draftPick: { u1: 2 },
};
const ids = marketCandidateIds(candidateInput);
check("includes rostered r1", ids.includes("r1"));
check("includes unrostered drafted u1", ids.includes("u1"));
check("excludes no-footprint x1", !ids.includes("x1"));
check("exactly 2 candidates", ids.length === 2);

console.log("3. Integration: unrostered drafted player recovers baseline");
const now = Date.now();
const input: StockMarketInput = {
  players,
  rosteredCount: { r1: 3 },
  totalRosters: 10,
  faabSpent: {},
  faabBudget: 200,
  flow: {},
  tradeCount: {},
  draftPick: { u1: 2 },
  statProfiles: null,
  // Seeded history: r1 prior $20, u1 prior $42 (4200 cents → $42).
  history: {
    r1: [{ date: new Date(now - 86400000).toISOString(), price: 20, source: "live" }],
    u1: [{ date: new Date(now - 86400000).toISOString(), price: 42, source: "live" }],
  },
  now,
};
const stocks = computePlayerStocks(input);
const byId = Object.fromEntries(stocks.map((s) => [s.playerId, s]));
check("r1 listed", !!byId["r1"]);
check("u1 listed", !!byId["u1"]);
check("x1 not listed", !byId["x1"]);
check("r1 prevPrice is 20", byId["r1"]?.prevPrice === 20);
check("u1 prevPrice is 42 (baseline recovered)", byId["u1"]?.prevPrice === 42);
check("u1 changePct non-null", byId["u1"]?.changePct != null);
check("u1 spark has 2 points (history + live)", byId["u1"]?.spark.length === 2);
check("u1 spark preserves live source on newest", byId["u1"]?.spark[1]?.source === "live");

console.log("4. Genuinely absent history keeps nullable fields");
const noHistInput: StockMarketInput = { ...input, history: {} };
const noHistStocks = computePlayerStocks(noHistInput);
const noHistById = Object.fromEntries(noHistStocks.map((s) => [s.playerId, s]));
check("u1 prevPrice null when history absent", noHistById["u1"]?.prevPrice == null);
check("u1 changePct null when history absent", noHistById["u1"]?.changePct == null);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
