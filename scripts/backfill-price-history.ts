#!/usr/bin/env npx tsx
/**
 * Backfill reconstructed price history from real game logs.
 *
 * Reads per-game fantasy PPG prepared by scripts/prepare-gamelog.py,
 * walks each player's games chronologically, and reprices them after
 * every game using the v2 valuation formula with the player's age AT
 * THAT TIME (not current age) and only the production known at that
 * point. The result is a real price path — not a flat line.
 *
 * Also writes yearly `backtest` points for seasons without game-log
 * coverage, then prunes superseded/out-of-window rows.
 *
 * One-time / occasional use: run after prepare-gamelog.py, or when
 * refreshing the backfill. Requires DATABASE_URL.
 *
 *   python3 scripts/prepare-gamelog.py
 *   DATABASE_URL=... npx tsx scripts/backfill-price-history.ts
 */
import { readFileSync } from "node:fs";
import {
  emaAlpha,
  emaUpdate,
  futureSeasonValue,
  pedigreeFppg,
  prospectWeight,
} from "../src/data/transform";
import { getDb, playerStatCache } from "../src/data/db";
import {
  pruneSuperseded,
  saveReconstructedPoints,
} from "../src/data/stocks";

const LEAGUE_ID = "1387473752807190528";
const K_STOCK = 0.5;
const STOCK_FLOOR = 1;
const STOCK_CAP = 250;

type GameRow = { date: string; season: string; fppg: number; minutes: number };
type MappedData = { players: Record<string, { games: GameRow[] }> };

const round2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));
const seasonStartYear = (season: string) =>
  parseInt(season.split("-")[0], 10);

function ageAt(birthDate: string | null, dateStr: string): number | undefined {
  if (!birthDate) return undefined;
  const b = new Date(birthDate);
  const d = new Date(dateStr);
  let age = d.getFullYear() - b.getFullYear();
  const m = d.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && d.getDate() < b.getDate())) age--;
  return age;
}

/** v2 price with neutral sentiment/injury (no historical league data). */
function v2price(args: {
  trailing: number | null;
  careerMinutes: number;
  yearsExp: number;
  leaguePick: number | null;
  age: number | undefined;
}): number {
  const { trailing, careerMinutes, yearsExp, leaguePick, age } = args;
  const w = prospectWeight(careerMinutes, yearsExp);
  const pedigree = pedigreeFppg(leaguePick);
  const provenPart = trailing != null ? (1 - w) * trailing : 0;
  const ability = provenPart + w * pedigree;
  const fs = futureSeasonValue(age);
  return round2(clamp(K_STOCK * ability * fs, STOCK_FLOOR, STOCK_CAP));
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  return res.json();
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const db = dryRun ? null : getDb();
  console.log(dryRun ? "DRY RUN — no writes." : "Loading inputs…");

  const mapped: MappedData = JSON.parse(
    readFileSync(
      process.env.GAMELOG_JSON ?? "/tmp/gamelog_mapped.json",
      "utf8"
    )
  );
  const directory: Record<string, any> = JSON.parse(
    readFileSync(
      process.env.SLEEPER_PLAYERS_JSON ?? "/tmp/sleeper_players.json",
      "utf8"
    )
  );

  // Current season (for the pruning window).
  const league = await fetchJson(
    `https://api.sleeper.app/v1/league/${LEAGUE_ID}`
  );
  const currentStartYear = Number(league.season);
  console.log(`Current season start year: ${currentStartYear}`);

  // League rookie-draft picks: earliest overall pick per player.
  const draftPick: Record<string, number> = {};
  try {
    const drafts = await fetchJson(
      `https://api.sleeper.app/v1/league/${LEAGUE_ID}/drafts`
    );
    const ordered = [...drafts].sort(
      (a: any, b: any) => (a.start_time ?? 0) - (b.start_time ?? 0)
    );
    for (const d of ordered) {
      const picks = await fetchJson(
        `https://api.sleeper.app/v1/draft/${d.draft_id}/picks`
      ).catch(() => []);
      for (const p of picks) {
        if (p.player_id && p.player_id !== "0" && draftPick[p.player_id] == null) {
          draftPick[p.player_id] = p.pick_no;
        }
      }
    }
  } catch (e) {
    console.log("Draft fetch failed — rookies price on replacement prior.");
  }
  console.log(`Draft picks mapped: ${Object.keys(draftPick).length}`);

  // Season history from the stat cache (backtest fallback inputs).
  // Dry-run: synthesize from the gamelog mapping instead.
  const seasonHist: Record<
    string,
    Array<{ season: string; fppg: number; games: number }>
  > = {};
  if (!dryRun && db) {
    const cacheRows = await db.select().from(playerStatCache);
    for (const r of cacheRows) {
      seasonHist[r.playerId] =
        (r.seasonHistory as Array<{ season: string; fppg: number; games: number }>) ??
        [];
    }
  }

  type Point = {
    playerId: string;
    date: Date;
    priceCents: number;
    source: "gamelog" | "backtest";
    season: string;
  };
  const points: Point[] = [];
  // (player_id, season) with meaningful gamelog coverage.
  const covered = new Set<string>();

  let nPlayers = 0;
  for (const [pid, { games }] of Object.entries(mapped.players)) {
    if (games.length === 0) continue;
    const entry = directory[pid];
    if (!entry) continue;
    nPlayers++;

    const birthDate: string | null = entry.birth_date ?? null;
    const yearsExpNow: number = entry.years_exp ?? 0;
    const leaguePick: number | null = draftPick[pid] ?? null;

    // Per-season fppg (for the trailing blend of LATER seasons).
    const bySeason = new Map<string, { total: number; games: number }>();
    for (const g of games) {
      const s = bySeason.get(g.season) ?? { total: 0, games: 0 };
      s.total += g.fppg;
      s.games += 1;
      bySeason.set(g.season, s);
    }
    const seasonFppg = new Map<string, number>();
    for (const [s, { total, games: n }] of bySeason) {
      seasonFppg.set(s, total / n);
      if (n >= 10) covered.add(`${pid}|${s}`);
    }
    const seasonYear = (s: string) => seasonStartYear(s);
    const fppgOfYear = (y: number): number | null => {
      for (const [s, f] of seasonFppg) {
        if (seasonYear(s) === y) return f;
      }
      return null;
    };

    // Chronological walk.
    let ema: number | null = null;
    let emaGames = 0;
    let accMinutes = 0;
    for (const g of games) {
      const y = seasonStartYear(g.season);
      const yearsExp = Math.max(0, yearsExpNow - (currentStartYear - y));
      // Trailing production known BEFORE this season.
      const l = fppgOfYear(y - 1);
      const p = fppgOfYear(y - 2);
      let trailing: number | null =
        l != null && p != null
          ? round2(0.65 * l + 0.35 * p)
          : (l ?? null);
      // Blend toward the in-season EMA as games accumulate.
      if (emaGames > 0 && ema != null) {
        const sw = Math.min(emaGames / 20, 0.5);
        trailing =
          trailing != null ? round2((1 - sw) * trailing + sw * ema) : ema;
      }
      const age = ageAt(birthDate, g.date);
      const effectiveMinutes = Math.max(accMinutes, yearsExp * 1500);
      const price = v2price({
        trailing,
        careerMinutes: effectiveMinutes,
        yearsExp,
        leaguePick,
        age,
      });
      points.push({
        playerId: pid,
        date: new Date(g.date),
        priceCents: Math.round(price * 100),
        source: "gamelog",
        season: g.season,
      });
      // Fold this game into the EMA for the NEXT game.
      const upd = emaUpdate(ema, emaGames, g.fppg, emaAlpha(age, effectiveMinutes));
      ema = upd.ema;
      emaGames = upd.games;
      accMinutes += g.minutes;
    }
  }
  console.log(
    `Reconstructed ${points.length} gamelog points for ${nPlayers} players.`
  );

  // Yearly backtest for seasons without gamelog coverage.
  let nBacktest = 0;
  for (const [pid, hist] of Object.entries(seasonHist)) {
    const entry = directory[pid];
    if (!entry) continue;
    const birthDate: string | null = entry.birth_date ?? null;
    const yearsExpNow: number = entry.years_exp ?? 0;
    const leaguePick: number | null = draftPick[pid] ?? null;
    // Sleeper season "2025" ~= HF "2024-25".
    for (const h of hist) {
      const y = Number(h.season); // season start year
      const hfSeason = `${y - 1}-${String(y).slice(2)}`;
      if (covered.has(`${pid}|${hfSeason}`)) continue;
      const prev = hist.find((x) => Number(x.season) === y - 1);
      const trailing =
        prev != null
          ? round2(0.65 * h.fppg + 0.35 * prev.fppg)
          : h.fppg;
      const yearsExp = Math.max(0, yearsExpNow - (currentStartYear - y));
      // Rough career minutes at that point: 30 min × games in seasons ≤ y.
      const estMinutes = hist
        .filter((x) => Number(x.season) <= y)
        .reduce((sum, x) => sum + x.games * 30, 0);
      const age = ageAt(birthDate, `${y}-06-30`);
      const price = v2price({
        trailing,
        careerMinutes: Math.max(estMinutes, yearsExp * 1500),
        yearsExp,
        leaguePick,
        age,
      });
      points.push({
        playerId: pid,
        date: new Date(`${y}-06-30`),
        priceCents: Math.round(price * 100),
        source: "backtest",
        season: hfSeason,
      });
      nBacktest++;
    }
  }
  console.log(`Computed ${nBacktest} backtest points.`);

  if (dryRun) {
    // Sanity sample: Wembanyama's path (Sleeper id 2577).
    const wemby = points
      .filter((p) => p.playerId === "2577")
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    console.log(`Wembanyama points: ${wemby.length}`);
    if (wemby.length > 0) {
      const first = wemby[0];
      const last = wemby[wemby.length - 1];
      console.log(
        `  first: ${first.date.toISOString().slice(0, 10)} $${(first.priceCents / 100).toFixed(2)} (${first.source})`
      );
      console.log(
        `  last:  ${last.date.toISOString().slice(0, 10)} $${(last.priceCents / 100).toFixed(2)} (${last.source})`
      );
      const mid = wemby[Math.floor(wemby.length / 2)];
      console.log(
        `  mid:   ${mid.date.toISOString().slice(0, 10)} $${(mid.priceCents / 100).toFixed(2)} (${mid.source})`
      );
    }
    // Price distribution sanity.
    const prices = points.map((p) => p.priceCents / 100);
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
    console.log(
      `Points: ${points.length}, avg price $${avg.toFixed(2)}, ` +
        `min $${Math.min(...prices).toFixed(2)}, max $${Math.max(...prices).toFixed(2)}`
    );
    console.log("DRY RUN complete — no writes.");
    return;
  }

  console.log(`Writing ${points.length} points…`);
  await saveReconstructedPoints(points);

  const pruned = await pruneSuperseded(currentStartYear);
  console.log(
    `Pruned ${pruned.prunedBacktest} superseded backtest points, ` +
      `${pruned.prunedOld} out-of-window points.`
  );
  console.log("Done.");
}

main().catch((e) => {
  console.error("Backfill failed:", e);
  process.exit(1);
});
