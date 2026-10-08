import type { ReconstructionInput, ReconstructedPoint } from "../domain/price-history-import";
import { emaAlpha, emaUpdate, futureSeasonValue, pedigreeFppg, prospectWeight, K_STOCK, STOCK_FLOOR, STOCK_CAP } from "./transform";

const round2 = (n: number) => Math.round(n * 100) / 100;
const label = (y: number) => `${y}-${String(y + 1).slice(2)}`;

/** Normalize calendar dates explicitly; upstream dates contain no event time. */
export function calendarDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}(?:[ T]00:00:00(?:\.000)?Z?)?$/.test(value)) {
    throw new Error(`Expected a calendar date: ${value}`);
  }
  const day = value.slice(0, 10);
  const iso = `${day}T00:00:00.000Z`;
  if (new Date(iso).toISOString() !== iso) throw new Error(`Invalid date: ${value}`);
  return iso;
}

export function historicalAge(birthDate: string | null | undefined, date: string): number | undefined {
  if (!birthDate) return undefined;
  const b = calendarDate(birthDate).slice(0, 10);
  const d = calendarDate(date).slice(0, 10);
  return Number(d.slice(0, 4)) - Number(b.slice(0, 4)) - (d.slice(5) < b.slice(5) ? 1 : 0);
}

/** Pure reconstruction. Full prior seasons are used only on later dates. */
export function reconstructPriceHistory(input: ReconstructionInput): ReconstructedPoint[] {
  if (!Number.isInteger(input.directorySeason) || !Number.isInteger(input.currentSeasonStartYear) || input.directorySeason < input.currentSeasonStartYear) {
    throw new Error("Frozen directory/current season years are required");
  }
  const points: ReconstructedPoint[] = [];
  const coverage = new Map<string, number>();
  const pickAt = (id: string, date: string) => input.draftPicks
    .filter(p => p.playerId === id && calendarDate(p.availableOn) <= date)
    .sort((a, b) => a.availableOn.localeCompare(b.availableOn))[0]?.pick ?? null;
  const price = (id: string, date: string, y: number, trailing: number | null, minutes: number) => {
    const entry = input.directory[id];
    const yearsExp = Math.max(0, (entry.years_exp ?? 0) - (input.directorySeason - y));
    const w = prospectWeight(minutes, yearsExp);
    const ability = (trailing == null ? 0 : (1 - w) * trailing) + w * pedigreeFppg(pickAt(id, date));
    return Math.round(round2(Math.max(STOCK_FLOOR, Math.min(STOCK_CAP,
      K_STOCK * ability * futureSeasonValue(historicalAge(entry.birth_date, date))))) * 100);
  };
  for (const [id, { games }] of Object.entries(input.players).sort(([a], [b]) => a.localeCompare(b))) {
    if (!input.directory[id]) throw new Error(`Missing directory entry for ${id}`);
    const ordered = games.map(g => ({ ...g, date: calendarDate(g.date) }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const totals = new Map<number, { fppg: number; games: number }>();
    const seen = new Set<string>();
    for (const g of ordered) {
      const y = Number(g.season.slice(0, 4));
      if (g.season !== label(y) || !Number.isFinite(g.fppg) || !Number.isFinite(g.minutes) || g.minutes < 0) {
        throw new Error(`Invalid game for ${id}`);
      }
      if (g.date < calendarDate(`${y}-07-01`) || g.date >= calendarDate(`${y + 1}-07-01`)) throw new Error(`Game outside season for ${id}`);
      const key = `${id}|${g.date}`;
      if (seen.has(key)) throw new Error(`Duplicate game for ${id} at ${g.date}`);
      seen.add(key);
      const t = totals.get(y) ?? { fppg: 0, games: 0 };
      t.fppg += g.fppg; t.games++;
      totals.set(y, t);
      coverage.set(`${id}|${y}`, t.games);
    }
    const avg = (y: number) => {
      const t = totals.get(y);
      return t ? t.fppg / t.games : null;
    };
    let activeSeason: string | null = null;
    let ema: number | null = null;
    let emaGames = 0;
    let minutes = 0;
    for (const g of ordered) {
      const y = Number(g.season.slice(0, 4));
      if (activeSeason !== g.season) { ema = null; emaGames = 0; activeSeason = g.season; }
      const entry = input.directory[id];
      const yearsExp = Math.max(0, (entry.years_exp ?? 0) - (input.directorySeason - y));
      const updated = emaUpdate(ema, emaGames, g.fppg,
        emaAlpha(historicalAge(entry.birth_date, g.date), Math.max(minutes, yearsExp * 1500)));
      ema = updated.ema; emaGames = updated.games; minutes += g.minutes;
      const l = avg(y - 1), p = avg(y - 2);
      const trailing = l != null && p != null ? round2(0.65 * l + 0.35 * p) : l;
      const sw = Math.min(emaGames / 20, 0.5);
      const production = trailing == null ? ema : round2((1 - sw) * trailing + sw * ema);
      points.push({ playerId: id, date: g.date, priceCents: price(id, g.date, y, production, minutes), source: "gamelog", season: g.season });
    }
  }
  for (const [id, history] of Object.entries(input.seasonHistory)) {
    if (!input.directory[id]) throw new Error(`Missing directory entry for ${id}`);
    if (new Set(history.map(h => h.season)).size !== history.length) throw new Error(`Duplicate season for ${id}`);
    for (const h of history) {
      const y = Number(h.season);
      if (!/^\d{4}$/.test(h.season) || !Number.isInteger(y) || !Number.isInteger(h.games) || !(h.games > 0) || !Number.isFinite(h.fppg)) throw new Error(`Invalid season for ${id}`);
      // Sleeper 2023 is 2023-24. Only complete log coverage supersedes the yearly point.
      if ((coverage.get(`${id}|${y}`) ?? 0) >= h.games) continue;
      const date = calendarDate(`${y + 1}-06-30`);
      const previous = history.find(p => Number(p.season) === y - 1);
      const production = previous ? round2(0.65 * h.fppg + 0.35 * previous.fppg) : h.fppg;
      const minutes = history.filter(p => Number(p.season) <= y).reduce((n, p) => n + p.games * 30, 0);
      points.push({ playerId: id, date, priceCents: price(id, date, y, production, minutes), source: "backtest", season: label(y) });
    }
  }
  const oldest = input.currentSeasonStartYear - 4;
  const result = points.filter(p => Number(p.season.slice(0, 4)) >= oldest && Number(p.season.slice(0, 4)) < input.currentSeasonStartYear)
    .sort((a, b) => a.playerId.localeCompare(b.playerId) || a.date.localeCompare(b.date) || a.source.localeCompare(b.source));
  const keys = result.map(p => `${p.playerId}|${p.date}|${p.source}`);
  if (new Set(keys).size !== keys.length) throw new Error("Duplicate reconstructed points");
  if (!result.length) throw new Error("Reconstruction produced no completed-season points");
  return result;
}
