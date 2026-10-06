/**
 * transform.ts — raw Sleeper payloads become domain objects here.
 *
 * This is the membrane between the outside world and the app. Everything
 * downstream (surfaces, pages) only ever sees `src/domain` types. If Sleeper
 * changes a field name, this file is the only place that needs to change.
 */
import type {
  Team,
  Standing,
  Transaction,
  Season,
  Matchup,
  LeagueStats,
} from "@/domain";
import type {
  RawLeague,
  RawRoster,
  RawUser,
  RawMatchupEntry,
  RawTransaction,
  RawPlayerEntry,
} from "./sleeper";

/** Team name resolution: manager's chosen name, else their username. */
export function teamNameOf(user: RawUser | undefined): string {
  if (!user) return "Unknown Team";
  return user.metadata?.team_name?.trim() || user.display_name;
}

export function toTeam(roster: RawRoster, user: RawUser | undefined): Team {
  const s = roster.settings;
  return {
    id: String(roster.roster_id),
    name: teamNameOf(user),
    managerName: user?.display_name ?? "—",
    avatar: user?.avatar ?? null,
    wins: s.wins,
    losses: s.losses,
    ties: s.ties,
    pointsFor: s.fpts * 100 + s.fpts_decimal,
    pointsAgainst: s.fpts_against * 100 + s.fpts_against_decimal,
  };
}

export function toTeams(rosters: RawRoster[], users: RawUser[]): Team[] {
  const byId = new Map(users.map((u) => [u.user_id, u]));
  return rosters.map((r) => toTeam(r, byId.get(r.owner_id)));
}

/**
 * Standings, sorted by wins desc then pointsFor desc.
 * gamesBack is measured in wins behind first place.
 */
export function toStandings(teams: Team[]): Standing[] {
  const sorted = [...teams].sort(
    (a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor
  );
  const leaderWins = sorted[0]?.wins ?? 0;
  return sorted.map((team, i) => ({
    team,
    rank: i + 1,
    wins: team.wins,
    losses: team.losses,
    ties: team.ties,
    pointsFor: team.pointsFor,
    gamesBack: leaderWins - team.wins,
  }));
}

export function toSeason(league: RawLeague): Season {
  return {
    leagueName: league.name,
    seasonYear: league.season,
    status: league.status,
    totalTeams: league.total_rosters,
  };
}

const TYPE_LABEL: Record<string, Transaction["type"]> = {
  waiver: "waiver",
  free_agent: "free_agent",
};

export function toTransactions(
  raw: RawTransaction[],
  teams: Team[],
  rosters: RawRoster[],
  users: RawUser[],
  directory: Record<string, RawPlayerEntry> | null
): Transaction[] {
  const teamByRosterId = new Map<string, Team>();
  for (const r of rosters) {
    const user = users.find((u) => u.user_id === r.owner_id);
    teamByRosterId.set(String(r.roster_id), toTeam(r, user));
  }
  const nameOf = (pid: string): string =>
    directory?.[pid]?.full_name ?? `Player ${pid}`;

  return raw
    .map((t) => {
      const rosterIds = new Set<number>();
      if (t.adds) Object.values(t.adds).forEach((rid) => rosterIds.add(rid));
      if (t.drops) Object.values(t.drops).forEach((rid) => rosterIds.add(rid));
      const actor =
        rosterIds.size === 1
          ? teamByRosterId.get(String([...rosterIds][0]))?.name ?? "A team"
          : "Multiple teams";

      const added = t.adds ? Object.keys(t.adds).map(nameOf) : [];
      const dropped = t.drops ? Object.keys(t.drops).map(nameOf) : [];
      let summary: string;
      if (t.type === "trade") {
        summary = `${actor} completed a trade`;
      } else if (added.length && dropped.length) {
        summary = `${actor} added ${added.join(", ")}, dropped ${dropped.join(", ")}`;
      } else if (added.length) {
        summary = `${actor} added ${added.join(", ")}`;
      } else if (dropped.length) {
        summary = `${actor} dropped ${dropped.join(", ")}`;
      } else {
        summary = `${actor} made a roster move`;
      }

      return {
        id: t.transaction_id,
        type: TYPE_LABEL[t.type] ?? "free_agent",
        week: t.week,
        createdAt: t.created,
        summary,
      } satisfies Transaction;
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

/* ---------------- matchups & league stats ---------------- */

/**
 * Pair raw matchup entries by matchup_id into head-to-head Matchups.
 * Entries are sorted by roster_id first so home/away assignment is stable.
 * Points stay null until played (see the Matchup contract).
 */
export function toMatchups(
  entries: RawMatchupEntry[],
  teams: Team[]
): Matchup[] {
  const teamByRosterId = new Map<string, Team>();
  for (const t of teams) teamByRosterId.set(t.id, t);
  const byMatchup = new Map<number, RawMatchupEntry[]>();
  for (const e of entries) {
    const list = byMatchup.get(e.matchup_id) ?? [];
    list.push(e);
    byMatchup.set(e.matchup_id, list);
  }
  const matchups: Matchup[] = [];
  for (const list of byMatchup.values()) {
    if (list.length !== 2) continue; // incomplete pairing — skip, don't guess
    const [a, b] = [...list].sort((x, y) => x.roster_id - y.roster_id);
    const home = teamByRosterId.get(String(a.roster_id));
    const away = teamByRosterId.get(String(b.roster_id));
    if (!home || !away) continue;
    matchups.push({
      week: 0, // filled in by the caller, which knows the week
      home,
      away,
      homePoints: a.points,
      awayPoints: b.points,
    });
  }
  return matchups;
}

/**
 * Count transactions per roster across raw weekly transaction lists.
 * Each transaction counts once per involved roster (adds and drops both
 * count as activity). Pure — trivially testable with fake payloads.
 */
export function countTransactionsByRoster(
  weeks: RawTransaction[][]
): Map<number, number> {
  const counts = new Map<number, number>();
  for (const txs of weeks) {
    for (const t of txs) {
      const rosters = new Set<number>();
      if (t.adds) for (const rid of Object.values(t.adds)) rosters.add(rid);
      if (t.drops) for (const rid of Object.values(t.drops)) rosters.add(rid);
      for (const rid of rosters) counts.set(rid, (counts.get(rid) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * LeagueStatsInput — everything computeLeagueStats needs, as plain data.
 * No fetching in here: the loader assembles this, the pure function below
 * does the math. That split is what makes the stats testable with fakes
 * (dependency inversion, rule 11).
 */
export type LeagueStatsInput = {
  teams: Team[];
  /** Index 0 = week 1. Only weeks with data are included. */
  matchupsByWeek: Matchup[][];
  transactionsByWeek: RawTransaction[][];
  /** False in the preseason — every stat stays null, no fake zeros. */
  hasGames: boolean;
};

/** All-null stats: the honest preseason / no-data state. */
export function emptyLeagueStats(): LeagueStats {
  return {
    pointsForLeader: null,
    pointsAgainstLeader: null,
    longestWinStreak: null,
    mostActiveManager: null,
    biggestBlowout: null,
    closestGame: null,
  };
}

function fmtPts(p: number): string {
  return (p / 100).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** Consecutive wins ending at the latest final week. 0 when none. */
function currentWinStreak(teamId: string, matchupsByWeek: Matchup[][]): number {
  let streak = 0;
  for (let w = matchupsByWeek.length - 1; w >= 0; w--) {
    const m = matchupsByWeek[w].find(
      (x) => x.home.id === teamId || x.away.id === teamId
    );
    if (!m || m.homePoints === null || m.awayPoints === null) break;
    const won =
      (m.home.id === teamId && m.homePoints > m.awayPoints) ||
      (m.away.id === teamId && m.awayPoints > m.homePoints);
    if (!won) break;
    streak++;
  }
  return streak;
}

/**
 * Derive every home-page stat from plain inputs. No fetching, no I/O —
 * pass fakes in tests. Returns nulls (not zeros) when there's nothing
 * meaningful to show.
 */
export function computeLeagueStats(input: LeagueStatsInput): LeagueStats {
  const { teams, matchupsByWeek, transactionsByWeek, hasGames } = input;
  if (!hasGames || teams.length === 0) return emptyLeagueStats();

  // Points leaders — only when somebody has actually scored.
  const byPF = [...teams].sort((a, b) => b.pointsFor - a.pointsFor);
  const byPA = [...teams].sort((a, b) => b.pointsAgainst - a.pointsAgainst);
  const pointsForLeader =
    byPF[0].pointsFor > 0
      ? { team: byPF[0], displayValue: fmtPts(byPF[0].pointsFor) }
      : null;
  const pointsAgainstLeader =
    byPA[0].pointsAgainst > 0
      ? { team: byPA[0], displayValue: fmtPts(byPA[0].pointsAgainst) }
      : null;

  // Longest active win streak.
  let longestWinStreak: LeagueStats["longestWinStreak"] = null;
  for (const t of teams) {
    const wins = currentWinStreak(t.id, matchupsByWeek);
    if (wins > 0 && (!longestWinStreak || wins > longestWinStreak.wins)) {
      longestWinStreak = { team: t, wins };
    }
  }

  // Most active manager by transaction count.
  const counts = countTransactionsByRoster(transactionsByWeek);
  const teamByRosterId = new Map(teams.map((t) => [t.id, t]));
  let mostActiveManager: LeagueStats["mostActiveManager"] = null;
  for (const [rosterId, n] of counts) {
    const team = teamByRosterId.get(String(rosterId));
    if (
      team &&
      n > 0 &&
      (!mostActiveManager || n > mostActiveManager.transactionCount)
    ) {
      mostActiveManager = { team, transactionCount: n };
    }
  }

  // Blowout / closest game from the latest week with final scores.
  let biggestBlowout: LeagueStats["biggestBlowout"] = null;
  let closestGame: LeagueStats["closestGame"] = null;
  for (let w = matchupsByWeek.length - 1; w >= 0; w--) {
    const finals = matchupsByWeek[w].filter(
      (m) => m.homePoints !== null && m.awayPoints !== null
    );
    if (finals.length === 0) continue;
    for (const m of finals) {
      const margin = Math.abs((m.homePoints as number) - (m.awayPoints as number));
      if (!biggestBlowout || margin > biggestBlowout.margin) {
        biggestBlowout = { matchup: m, margin };
      }
      if (!closestGame || margin < closestGame.margin) {
        closestGame = { matchup: m, margin };
      }
    }
    break; // only the latest week with finals
  }

  return {
    pointsForLeader,
    pointsAgainstLeader,
    longestWinStreak,
    mostActiveManager,
    biggestBlowout,
    closestGame,
  };
}
