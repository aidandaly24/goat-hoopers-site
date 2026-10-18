import type { NbaRoster, NbaRosterPlayer, NbaSource, NbaTeam, NbaTeamDirectory } from "@/domain/arcade/nba-rosters";

export const NBA_TEAMS_SOURCE_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams?limit=30";
export const nbaRosterSourceUrl = (id: string) => `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${id}/roster`;

const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown, max = 120): string | null => typeof value === "string" && value.trim().length > 0 && value.length <= max ? value.trim() : null;
export const isNbaTeamId = (value: unknown): value is string => typeof value === "string" && /^[1-9]\d{0,2}$/.test(value);
const instant = (value: unknown): string | null => typeof value === "string" && value.length <= 40 && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;

/** Provider images only; no upstream arbitrary image or source URLs reach the browser. */
function espnImage(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 300) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "a.espncdn.com" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function toTeam(raw: unknown): NbaTeam | null {
  if (!record(raw) || !isNbaTeamId(raw.id)) return null;
  const city = text(raw.location), name = text(raw.name), abbreviation = text(raw.abbreviation, 6);
  if (!city || !name || !abbreviation) return null;
  const logos = Array.isArray(raw.logos) ? raw.logos : [];
  const logo = espnImage(raw.logo) ?? logos.reduce<string | null>((found, value) => found ?? (record(value) ? espnImage(value.href) : null), null);
  return { id: raw.id, city, name, abbreviation, logo };
}

function source(sourceUrl: string, observedAt: string, raw: Record<string, unknown>, season: unknown): NbaSource {
  if (!instant(observedAt)) throw new Error("Invalid roster observation date");
  return {
    provider: "ESPN", sourceUrl, observedAt: new Date(observedAt).toISOString(),
    sourceUpdatedAt: instant(raw.timestamp),
    seasonLabel: record(season) ? text(season.displayName, 30) : null,
  };
}

/** Reject a partial/duplicate directory; a random draw needs all 30 franchises. */
export function decodeNbaTeamDirectory(raw: unknown, observedAt: string): NbaTeamDirectory {
  if (!record(raw) || !Array.isArray(raw.sports)) throw new Error("NBA team directory is unavailable");
  const sport = raw.sports.find(s => record(s) && s.slug === "basketball");
  const league = record(sport) && Array.isArray(sport.leagues) ? sport.leagues.find(l => record(l) && l.slug === "nba") : null;
  if (!record(league) || !Array.isArray(league.teams) || league.teams.length !== 30) throw new Error("NBA team directory is incomplete");
  const teams = league.teams.map(entry => record(entry) ? toTeam(entry.team) : null);
  if (teams.some(team => !team) || new Set(teams.map(team => team?.id)).size !== 30) throw new Error("NBA team directory is incomplete");
  return { teams: teams as NbaTeam[], source: source(NBA_TEAMS_SOURCE_URL, observedAt, raw, league.season) };
}

function toPlayer(raw: unknown): NbaRosterPlayer | null {
  if (!record(raw) || typeof raw.id !== "string" || !/^[1-9]\d{0,9}$/.test(raw.id)) return null;
  const firstName = text(raw.firstName), lastName = text(raw.lastName);
  // A missing optional portrait/status/position must not silently remove an athlete.
  if (!firstName || !lastName) return null;
  return {
    id: raw.id, firstName, lastName,
    position: record(raw.position) ? text(raw.position.displayName) ?? text(raw.position.name) ?? "Position unlisted" : "Position unlisted",
    portrait: record(raw.headshot) ? espnImage(raw.headshot.href) ?? "" : "",
    jersey: text(raw.jersey, 8),
    status: record(raw.status) ? text(raw.status.name, 50) : null,
  };
}

/** Every source-listed athlete is retained, including non-active statuses. Never trim to stars. */
export function decodeNbaRoster(raw: unknown, team: NbaTeam, observedAt: string): NbaRoster {
  if (!record(raw) || raw.status !== "success" || !record(raw.team) || raw.team.id !== team.id ||
    !Array.isArray(raw.athletes) || raw.athletes.length === 0 || raw.athletes.length > 60) throw new Error("NBA roster is unavailable");
  const players = raw.athletes.map(toPlayer);
  if (players.some(player => !player) || new Set(players.map(player => player?.id)).size !== players.length) throw new Error("NBA roster is incomplete");
  return { team, players: players as NbaRosterPlayer[], source: source(nbaRosterSourceUrl(team.id), observedAt, raw, raw.season) };
}

/** Strict browser boundary for the slim public endpoint, separate from upstream JSON. */
function isTeam(value: unknown): value is NbaTeam {
  return record(value) && isNbaTeamId(value.id) && !!text(value.city) && !!text(value.name) && !!text(value.abbreviation, 6) &&
    (value.logo === null || espnImage(value.logo) === value.logo);
}
function isSource(value: unknown, url: string): value is NbaSource {
  return record(value) && value.provider === "ESPN" && value.sourceUrl === url && !!instant(value.observedAt) &&
    (value.sourceUpdatedAt === null || !!instant(value.sourceUpdatedAt)) && (value.seasonLabel === null || !!text(value.seasonLabel, 30));
}
export function isNbaTeamDirectory(value: unknown): value is NbaTeamDirectory {
  return record(value) && Array.isArray(value.teams) && value.teams.length === 30 && value.teams.every(isTeam) &&
    new Set(value.teams.map(team => team.id)).size === 30 && isSource(value.source, NBA_TEAMS_SOURCE_URL);
}
export function isNbaRoster(value: unknown, teamId: string): value is NbaRoster {
  if (!record(value) || !isTeam(value.team) || value.team.id !== teamId || !Array.isArray(value.players) ||
    !value.players.length || value.players.length > 60 || !isSource(value.source, nbaRosterSourceUrl(teamId))) return false;
  return value.players.every(player => record(player) && typeof player.id === "string" && /^[1-9]\d{0,9}$/.test(player.id) &&
    !!text(player.firstName) && !!text(player.lastName) && !!text(player.position) &&
    (player.portrait === "" || espnImage(player.portrait) === player.portrait) &&
    (player.jersey === null || !!text(player.jersey, 8)) && (player.status === null || !!text(player.status, 50))) &&
    new Set(value.players.map(player => player.id)).size === value.players.length;
}
