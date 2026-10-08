/* Calibration + sanity test for valuation v2. Run: npx tsx scripts/calibrate-stocks.ts */
import {
  computeStockMarket,
  futureSeasonValue,
  prospectWeight,
  pedigreeFppg,
  emaUpdate,
  emaAlpha,
} from "../src/data/transform";
import { buildStatProfiles } from "../src/data/nba-stats";
import type { RawPlayerEntry } from "../src/data/sleeper";
import * as fs from "fs";

const scoring: Record<string, number> = {
  ast: 1.0, blk: 2.0, bonus_ast_15p: 2.0, bonus_pt_40p: 2.0, bonus_pt_50p: 2.0,
  bonus_reb_20p: 2.0, dd: 1.0, ff: -2.0, pts: 0.5, reb: 1.0, stl: 2.0,
  td: 2.0, tf: -2.0, to: -1.0, tpm: 0.5,
};

const last = JSON.parse(fs.readFileSync("/tmp/s2025.json", "utf8"));
const prev = JSON.parse(fs.readFileSync("/tmp/sleeper-stats.json", "utf8"));
const pdir = JSON.parse(fs.readFileSync("/tmp/pdir.json", "utf8"));

// League picks (from the real drafts — hardcode the known ones for the test)
const leaguePicks: Record<string, number> = {};
const want: Record<string, number> = {
  "AJ Dybantsa": 1, "Darryn Peterson": 4, "Yaxel Lendeborg": 7,
  "Keaton Wagler": 8, "Dailyn Swain": 11,
};
for (const [pid, e] of Object.entries<any>(pdir)) {
  if (want[e.full_name] != null) leaguePicks[pid] = want[e.full_name];
}
// Edgecombe was a 2025 league pick (~3); give him pedigree for realism
for (const [pid, e] of Object.entries<any>(pdir)) {
  if (e.full_name === "VJ Edgecombe") leaguePicks[pid] = 3;
}

const profiles = buildStatProfiles({ seasons: [last, prev], scoring, leaguePicks });

const names = ["Nikola Jokić", "Giannis Antetokounmpo", "VJ Edgecombe", "Yaxel Lendeborg", "AJ Dybantsa", "Luka Dončić"];
const ids: Record<string, string> = {};
for (const [pid, e] of Object.entries<any>(pdir)) {
  if (names.includes(e.full_name)) ids[e.full_name] = pid;
}

const players: Record<string, RawPlayerEntry> = {};
const rosteredCount: Record<string, number> = {};
for (const n of names) {
  const pid = ids[n];
  players[pid] = pdir[pid];
  rosteredCount[pid] = 10; // all rostered
}

const market = computeStockMarket({
  players,
  rosteredCount,
  totalRosters: 10,
  faabSpent: {},
  faabBudget: 200,
  flow: {},
  tradeCount: {},
  draftPick: leaguePicks,
  statProfiles: profiles,
  history: null,
  now: Date.now(),
});

console.log("pricingBasis:", market.pricingBasis);
for (const s of market.stocks) {
  const p = profiles[s.playerId];
  console.log(
    `${s.playerName}: $${s.price} (trailing=${p?.fppg ?? "n/a"}, w=${prospectWeight(p?.careerMinutes ?? 0, (players[s.playerId] as any).years_exp).toFixed(2)}, fs=${futureSeasonValue((players[s.playerId] as any).age)})`
  );
  for (const f of s.factors.slice(0, 4)) {
    console.log(`    ${f.label}: ${f.delta >= 0 ? "+" : ""}${f.delta} — ${f.note}`);
  }
}

// Acceptance: one 5-fppg game moves a veteran <5% and a rookie <2%
function priceWith(prof: any, pid: string) {
  const m = computeStockMarket({
    players, rosteredCount, totalRosters: 10, faabSpent: {}, faabBudget: 200,
    flow: {}, tradeCount: {}, draftPick: leaguePicks,
    statProfiles: { ...profiles, [pid]: prof },
    history: null, now: Date.now(),
  });
  return m.stocks.find(s => s.playerId === pid)!.price;
}
const vetPid = ids["Giannis Antetokounmpo"];
const vetProf = { ...profiles[vetPid], emaFppg: 30, emaGames: 40 };
const vetBefore = priceWith(vetProf, vetPid);
const vetEma = emaUpdate(30, 40, 5, emaAlpha(31, 20000));
const vetAfter = priceWith({ ...vetProf, emaFppg: vetEma.ema, emaGames: 41 }, vetPid);
console.log(`\nvet 5-fppg game: $${vetBefore} → $${vetAfter} (${(((vetAfter-vetBefore)/vetBefore)*100).toFixed(2)}%)`);

const rookPid = ids["AJ Dybantsa"];
const rookProf = { ...profiles[rookPid], emaFppg: 12, emaGames: 10 };
const rookBefore = priceWith(rookProf, rookPid);
const rookEma = emaUpdate(12, 10, 5, emaAlpha(19, 300));
const rookAfter = priceWith({ ...rookProf, emaFppg: rookEma.ema, emaGames: 11 }, rookPid);
console.log(`rookie 5-fppg game: $${rookBefore} → $${rookAfter} (${(((rookAfter-rookBefore)/rookBefore)*100).toFixed(2)}%)`);
