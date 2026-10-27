import "server-only";
import type { AiForecastInputFreshness } from "@/domain/ai-decider";
import { fetchLeague, fetchMatchups, fetchNbaState, fetchPlayerDirectory, fetchSeasonStats, type RawLeague, type RawMatchupEntry, type RawNbaState, type RawPlayerEntry } from "../sleeper";
import { fppgUnderScoring } from "../transform";
import { aiMatchupPairs } from "./inputs";
import { GOAT_LEAGUE_ID } from "./weekly";
import type { AiForecastInput, AiForecastPlayedGame, AiForecastStarterEvidence } from "./forecast";
import espnIdMap from "../espn-id-map.json";

/**
 * Live evidence for the in-season forecast (issue #149). Assembled only
 * from sources the server already reads, plus ESPN's public scoreboard /
 * summary feeds and Sleeper's public `scores` GraphQL feed — the same
 * feeds the reviewed week calendar and the weekly-evidence receipts
 * pipeline use. The authenticated matchup leg is not available to this
 * service (Sleeper rejects it without credentials, and no new
 * credentials are authorized), so lock identity is proven by
 * reconciliation against the public leg instead: the counted value is
 * matched to a scored box-score game, and a counted game that is not
 * the starter's latest played game is only possible under a lock.
 *
 * Any source failure aborts the refresh: partial evidence is never
 * dressed up as a forecast input.
 */

export type AiForecastContext = {
  leagueId: string;
  season: string;
  phase: "regular";
  leg: number;
  /** The in-season target is the source leg's own live week. */
  week: number;
  statsSeason: string;
};

export type AiForecastEvidenceDeps = {
  league: typeof fetchLeague;
  state: typeof fetchNbaState;
  matchups: typeof fetchMatchups;
  stats: typeof fetchSeasonStats;
  players: typeof fetchPlayerDirectory;
  scores: (week: number, season: string) => Promise<unknown>;
  scoreboard: (yyyymmdd: string) => Promise<unknown>;
  summary: (eventId: string) => Promise<unknown>;
  now: () => number;
};

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
async function espnJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 300 } });
  if (!response.ok) throw new Error("forecast_evidence");
  return response.json();
}

/** Sleeper's public scores feed: game identity, status and schedule. No credentials are sent. */
async function sleeperScores(week: number, season: string): Promise<unknown> {
  const query = `{ scores(week: ${week}, season: "${season}", season_type: "regular", sport: "nba") { game_id status start_time metadata } }`;
  const response = await fetch("https://api.sleeper.app/graphql", {
    method: "POST", headers: { "Content-Type": "application/json", "X-Platform": "web" },
    body: JSON.stringify({ query }), next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error("forecast_evidence");
  return response.json();
}

export const forecastEvidenceDeps: AiForecastEvidenceDeps = {
  league: fetchLeague, state: fetchNbaState, matchups: fetchMatchups, stats: fetchSeasonStats, players: fetchPlayerDirectory,
  scores: sleeperScores,
  scoreboard: yyyymmdd => espnJson(`${ESPN_BASE}/scoreboard?dates=${yyyymmdd}`),
  summary: eventId => espnJson(`${ESPN_BASE}/summary?event=${eventId}`),
  now: Date.now,
};

/** The forecast targets the source leg's own week, regular phase only. */
export async function loadAiForecastContext(deps: Pick<AiForecastEvidenceDeps, "league" | "state"> = forecastEvidenceDeps): Promise<AiForecastContext> {
  const [league, state] = await Promise.all([deps.league(), deps.state()]);
  if (league.season !== state.season || !/^20\d{2}$/.test(league.season) || state.season_type !== "regular"
    || !Number.isSafeInteger(state.leg) || state.leg! < 1 || state.leg! > 29
    || !state.previous_season || !/^20\d{2}$/.test(state.previous_season) || Number(state.previous_season) >= Number(state.season)) {
    throw new Error("forecast_context");
  }
  return { leagueId: GOAT_LEAGUE_ID, season: league.season, phase: "regular", leg: state.leg!, week: state.leg!, statsSeason: state.previous_season };
}

/* ---------------------------- Sleeper scores ---------------------------- */

export type SleeperWeekGame = { gameId: string; status: string; startMs: number; teams: [string, string] };

export function parseSleeperScores(raw: unknown): SleeperWeekGame[] {
  const scores = (raw as { data?: { scores?: unknown } })?.data?.scores;
  if (!Array.isArray(scores) || scores.length === 0) throw new Error("forecast_evidence");
  return scores.map(g => {
    const game = g as { game_id?: unknown; status?: unknown; start_time?: unknown; metadata?: { home_team?: { team?: unknown }; away_team?: { team?: unknown } } };
    const home = game.metadata?.home_team?.team, away = game.metadata?.away_team?.team;
    if (typeof game.game_id !== "string" || !/^\d{1,20}$/.test(game.game_id) || typeof game.status !== "string"
      || typeof game.start_time !== "number" || !Number.isFinite(game.start_time) || typeof home !== "string" || typeof away !== "string") {
      throw new Error("forecast_evidence");
    }
    return { gameId: game.game_id, status: game.status, startMs: game.start_time, teams: [away, home] as [string, string] };
  });
}

const etDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" });
const etYyyymmdd = (ms: number) => etDate.format(new Date(ms)).replaceAll("-", "");

/* ------------------------------ ESPN shapes ------------------------------ */

const ESPN_ABBR_ALIAS: Record<string, string> = { GS: "GSW", NO: "NOP", NY: "NYK", SA: "SAS", UTAH: "UTA", WSH: "WAS" };
const sleeperAbbr = (abbr: string) => ESPN_ABBR_ALIAS[abbr] ?? abbr;

type EspnEvent = { id: string; completed: boolean; teams: string[] };

function parseScoreboard(raw: unknown): EspnEvent[] {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { events?: unknown }).events)) throw new Error("forecast_evidence");
  return ((raw as { events: unknown[] }).events).map(e => {
    const event = e as { id?: unknown; status?: { type?: { completed?: unknown } }; competitions?: { competitors?: { team?: { abbreviation?: unknown } }[] }[] };
    const competitors = event.competitions?.[0]?.competitors ?? [];
    const teams = competitors.map(c => typeof c.team?.abbreviation === "string" ? sleeperAbbr(c.team.abbreviation) : null);
    if (typeof event.id !== "string" || teams.length !== 2 || teams.some(t => t === null)) throw new Error("forecast_evidence");
    return { id: event.id, completed: event.status?.type?.completed === true, teams: teams as string[] };
  });
}

type StatLine = { min: number; pts: number; reb: number; ast: number; stl: number; blk: number; to: number; tpm: number };
const REQUIRED_KEYS = ["minutes", "points", "rebounds", "assists", "steals", "blocks", "turnovers", "threePointFieldGoalsMade-threePointFieldGoalsAttempted"];
const num = (v: unknown): number => { const n = typeof v === "string" ? Number(v) : NaN; if (!Number.isFinite(n)) throw new Error("forecast_evidence"); return n; };

function parseStatLine(keys: string[], stats: unknown[]): StatLine | null {
  if (!keys.length || stats.length < keys.length || !REQUIRED_KEYS.every(k => keys.includes(k))) return null;
  const raw = Object.fromEntries(keys.map((k, i) => [k, stats[i]]));
  try {
    const made = typeof raw["threePointFieldGoalsMade-threePointFieldGoalsAttempted"] === "string" ? raw["threePointFieldGoalsMade-threePointFieldGoalsAttempted"].split("-")[0] : "";
    return {
      min: num(raw.minutes), pts: num(raw.points), reb: num(raw.rebounds), ast: num(raw.assists),
      stl: num(raw.steals), blk: num(raw.blocks), to: num(raw.turnovers), tpm: num(made),
    };
  } catch { return null; }
}

/**
 * One game's evidence, mirroring the receipts parser: lines hold validated
 * appearances (minutes > 0); `rejected` holds mapped athletes the box
 * score recorded but whose stats were absent/truncated. A team container
 * without statistics or athletes fails the whole read closed.
 */
export function parseEspnBoxScore(raw: unknown, espnToSleeper: Record<string, string>): { lines: Map<string, StatLine>; rejected: Set<string> } {
  const boxes = (raw as { boxscore?: { players?: unknown[] } })?.boxscore?.players;
  if (!Array.isArray(boxes) || boxes.length < 2) throw new Error("forecast_evidence");
  const lines = new Map<string, StatLine>(), present = new Set<string>(), seen = new Set<string>();
  for (const box of boxes) {
    const statistics = (box as { statistics?: unknown[] })?.statistics;
    if (!Array.isArray(statistics) || statistics.length === 0) throw new Error("forecast_evidence");
    let athletesSeen = 0;
    for (const stat of statistics) {
      const entry = stat as { keys?: unknown; athletes?: unknown[] };
      const keys = Array.isArray(entry.keys) ? entry.keys.filter((k): k is string => typeof k === "string") : [];
      for (const athlete of entry.athletes ?? []) {
        athletesSeen++;
        const a = athlete as { athlete?: { id?: unknown }; didNotPlay?: unknown; stats?: unknown[] };
        const sleeperId = typeof a.athlete?.id === "string" || typeof a.athlete?.id === "number" ? espnToSleeper[String(a.athlete.id)] : undefined;
        if (!sleeperId) continue;
        seen.add(sleeperId);
        if (a.didNotPlay) { present.add(sleeperId); continue; }
        const line = Array.isArray(a.stats) ? parseStatLine(keys, a.stats) : null;
        if (!line) continue;
        present.add(sleeperId);
        if (line.min > 0) lines.set(sleeperId, line);
      }
    }
    if (athletesSeen === 0) throw new Error("forecast_evidence");
  }
  return { lines, rejected: new Set([...seen].filter(id => !present.has(id))) };
}

/**
 * Fantasy points for one played game under league scoring — the receipts
 * pipeline's rules: linear stats plus double-double/triple-double and
 * threshold bonuses (a triple-double earns both, the 50-point bonus
 * stacks on the 40). tf/ff are not itemised by ESPN and never applied.
 */
export function gamePointsUnderScoring(line: StatLine, scoring: Record<string, number>): number {
  let value = (["pts", "reb", "ast", "stl", "blk", "to", "tpm"] as const).reduce((sum, k) => sum + line[k] * (scoring[k] ?? 0), 0);
  const cats = (["pts", "reb", "ast", "stl", "blk"] as const).filter(k => line[k] >= 10).length;
  if (cats >= 3) value += (scoring.dd ?? 0) + (scoring.td ?? 0);
  else if (cats === 2) value += scoring.dd ?? 0;
  if (line.pts >= 50) value += (scoring.bonus_pt_40p ?? 0) + (scoring.bonus_pt_50p ?? 0);
  else if (line.pts >= 40) value += scoring.bonus_pt_40p ?? 0;
  if (line.ast >= 15) value += scoring.bonus_ast_15p ?? 0;
  if (line.reb >= 20) value += scoring.bonus_reb_20p ?? 0;
  return Math.round(value * 100) / 100;
}

/* ------------------------------ week window ------------------------------ */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The fantasy week's seven ET calendar dates (Mon–Sun) containing `now`. */
export function forecastWeekDates(nowMs: number): string[] {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(new Date(nowMs));
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "";
  const y = Number(get("year")), m = Number(get("month")), d = Number(get("day"));
  const sinceMonday = (WEEKDAYS.indexOf(get("weekday")) + 6) % 7;
  const monday = Date.UTC(y, m - 1, d) - sinceMonday * 86400000;
  return Array.from({ length: 7 }, (_, i) => {
    const t = new Date(monday + i * 86400000);
    return `${t.getUTCFullYear()}${String(t.getUTCMonth() + 1).padStart(2, "0")}${String(t.getUTCDate()).padStart(2, "0")}`;
  });
}

/* ------------------------------ the loader ------------------------------ */

export async function loadAiForecastInput(context: AiForecastContext, deps: AiForecastEvidenceDeps = forecastEvidenceDeps): Promise<AiForecastInput> {
  const freshness: AiForecastInputFreshness[] = [];
  const stamp = (source: string) => freshness.push({ source, observedAt: new Date(deps.now()).toISOString() });
  const [league, state, matchups, weekGames] = await Promise.all([deps.league(), deps.state(), deps.matchups(context.week), deps.scores(context.week, context.season).then(parseSleeperScores)]);
  if (league.season !== context.season || state.season !== context.season || state.season_type !== "regular" || state.leg !== context.leg) throw new Error("forecast_context");
  stamp("sleeper-league"); stamp("sleeper-matchups"); stamp("sleeper-scores");
  const scoring = { ...league.scoring_settings };
  const pairs = aiMatchupPairs(matchups);
  if (pairs.length !== 5) throw new Error("forecast_evidence");

  const espnToSleeper: Record<string, string> = {};
  for (const [sleeperId, espnId] of Object.entries(espnIdMap as Record<string, string | null>)) if (espnId) espnToSleeper[espnId] = sleeperId;

  // Completed Sleeper games are matched to ESPN events by ET date + team
  // pair (the receipts pipeline's method); each box score loads once.
  const completed = weekGames.filter(g => g.status === "complete").sort((a, b) => a.startMs - b.startMs);
  const eventsByDate = new Map<string, EspnEvent[]>();
  for (const date of new Set(completed.map(g => etYyyymmdd(g.startMs)))) {
    eventsByDate.set(date, parseScoreboard(await deps.scoreboard(date)));
  }
  stamp("espn-scoreboard");
  const boxByGame = new Map<string, { lines: Map<string, StatLine>; rejected: Set<string> }>();
  for (const game of completed) {
    const candidates = eventsByDate.get(etYyyymmdd(game.startMs)) ?? [];
    const event = candidates.find(e => e.completed && e.teams.includes(game.teams[0]) && e.teams.includes(game.teams[1]));
    if (!event) throw new Error("forecast_evidence");
    boxByGame.set(game.gameId, parseEspnBoxScore(await deps.summary(event.id), espnToSleeper));
  }
  stamp("espn-box-scores");

  const [directory, currentStats, priorStats] = await Promise.all([deps.players(), deps.stats(context.season), deps.stats(context.statsSeason)]);
  stamp("sleeper-players"); stamp("sleeper-stats");

  const teams = matchups.map((entry: RawMatchupEntry) => {
    const starters = entry.starters;
    if (!starters || starters.length === 0) throw new Error("forecast_evidence");
    return {
      rosterId: String(entry.roster_id),
      officialPoints: entry.points ?? null,
      starters: starters.filter(id => id !== "0").map((playerId): AiForecastStarterEvidence => {
        const team = directory[playerId]?.team ?? null;
        const teamGames = team ? weekGames.filter(g => g.teams.includes(team)) : null;
        const playedGames: AiForecastPlayedGame[] = [];
        let rejectedAppearance = false;
        if (teamGames) {
          for (const game of teamGames) {
            if (game.status !== "complete") continue;
            const box = boxByGame.get(game.gameId);
            if (!box) continue;
            const line = box.lines.get(playerId);
            if (line) playedGames.push({ gameId: game.gameId, points: gamePointsUnderScoring(line, scoring) });
            else if (box.rejected.has(playerId)) rejectedAppearance = true;
          }
        }
        const current = currentStats[playerId] ? fppgUnderScoring(currentStats[playerId], scoring) : null;
        const prior = !current && priorStats[playerId] ? fppgUnderScoring(priorStats[playerId], scoring) : null;
        const counted = entry.players_points?.[playerId];
        return {
          playerId,
          countedPoints: typeof counted === "number" && Number.isFinite(counted) ? counted : null,
          playedGames,
          rejectedAppearance,
          liveGameInProgress: teamGames?.some(g => g.status === "in_game") ?? false,
          gamesRemaining: teamGames ? teamGames.filter(g => g.status !== "complete").length : null,
          projectionPpg: current?.fppg ?? prior?.fppg ?? null,
          projectionBasis: current ? "current" : prior ? "prior" : null,
        };
      }),
    };
  });
  if (teams.length !== 10) throw new Error("forecast_evidence");
  return { leagueId: context.leagueId, season: context.season, week: context.week, capturedAt: new Date(deps.now()).toISOString(), scoring, matchups: pairs, teams, freshness };
}

export type { RawLeague, RawNbaState, RawPlayerEntry };
