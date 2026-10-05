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
  DraftPick,
  Player,
} from "@/domain";
import type {
  RawLeague,
  RawRoster,
  RawUser,
  RawDraftPick,
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
    draftId: league.draft_id,
  };
}

function playerFromPick(
  pick: RawDraftPick,
  directory: Record<string, RawPlayerEntry> | null
): Player {
  const meta = pick.metadata ?? {};
  const dir = directory?.[pick.player_id];
  const fullName =
    `${meta.first_name ?? ""} ${meta.last_name ?? ""}`.trim() ||
    dir?.full_name ||
    `Player ${pick.player_id}`;
  return {
    id: pick.player_id,
    fullName,
    position: meta.position || dir?.position || null,
    nbaTeam: meta.team || dir?.team || null,
  };
}

/**
 * Draft picks with the picking team resolved via owner_id -> Team.
 */
export function buildDraftPicks(
  picks: RawDraftPick[],
  rosters: RawRoster[],
  users: RawUser[],
  directory: Record<string, RawPlayerEntry> | null
): DraftPick[] {
  const userById = new Map(users.map((u) => [u.user_id, u]));
  const teamByOwner = new Map<string, Team>();
  for (const r of rosters) {
    teamByOwner.set(r.owner_id, toTeam(r, userById.get(r.owner_id)));
  }
  const fallback: Team = {
    id: "0",
    name: "Unknown",
    managerName: "—",
    avatar: null,
    wins: 0,
    losses: 0,
    ties: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  };
  return picks.map((p) => ({
    pickNumber: p.pick_no,
    round: p.round,
    draftSlot: p.draft_slot,
    pickedBy: teamByOwner.get(p.picked_by) ?? fallback,
    player: playerFromPick(p, directory),
  }));
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
