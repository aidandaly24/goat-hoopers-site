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
  Player,
  DraftPick,
  PlayerStock,
  PlayerStatProfile,
  StockMarket,
  StockFactor,
  StockTrend,
  StockQuote,
  StockDetail,
  PanicSignal,
  PriceHistoryPoint,
} from "@/domain";
import type {
  RawLeague,
  RawRoster,
  RawUser,
  RawMatchupEntry,
  RawTransaction,
  RawPlayerEntry,
  RawNbaState,
  RawDraftPick,
  RawWinnersBracketEntry,
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
 * Resolve one player_id to a domain Player. Unknown ids degrade to a
 * "Player <id>" stub instead of disappearing from the roster.
 */
export function toPlayer(
  pid: string,
  entry: RawPlayerEntry | undefined,
): Player {
  const name =
    entry?.full_name ??
    [entry?.first_name, entry?.last_name].filter(Boolean).join(" ") ??
    "";
  return {
    id: pid,
    fullName: name || `Player ${pid}`,
    position: entry?.position ?? null,
    nbaTeam: entry?.team ?? null,
  };
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

export function toSeason(league: RawLeague, nbaState: RawNbaState | null): Season {
  // Sleeper flips league.status to "in_season" before the NBA actually tips
  // off. The honest status is preseason until games exist — this is the same
  // signal the stats strip uses for its "go live when the season tips off"
  // empty state, so the two never contradict each other.
  const nbaStarted = nbaState !== null && nbaState.season_type !== "pre";
  const status =
    !nbaStarted && league.status === "in_season" ? "pre_season" : league.status;
  return {
    leagueName: league.name,
    seasonYear: league.season,
    status,
    totalTeams: league.total_rosters,
    playoffTeams: league.settings?.playoff_teams ?? 6,
    playoffWeekStart: league.settings?.playoff_week_start ?? 19,
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
  const moveOf = (pid: string) => ({ playerId: pid, name: nameOf(pid) });

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
        week: t.leg,
        createdAt: t.created,
        summary,
        teamIds: [...rosterIds].map(String),
        adds: t.adds ? Object.keys(t.adds).map(moveOf) : [],
        drops: t.drops ? Object.keys(t.drops).map(moveOf) : [],
        // Per-team trade view for the news network: who received whom.
        sides:
          t.type === "trade" && t.adds
            ? [...rosterIds].map((rid) => {
                const team = teamByRosterId.get(String(rid));
                return {
                  teamId: String(rid),
                  teamName: team?.name ?? "A team",
                  received: Object.entries(t.adds!)
                    .filter(([, toRid]) => toRid === rid)
                    .map(([pid]) => moveOf(pid)),
                };
              })
            : undefined,
      } satisfies Transaction;
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Raw draft picks -> domain DraftPicks, sorted by pick number.
 * Player names come from the pick metadata (no directory needed).
 */
export function toDraftPicks(raw: RawDraftPick[]): DraftPick[] {
  return raw
    .map((p) => {
      const meta = p.metadata ?? {};
      const name =
        meta.full_name ??
        [meta.first_name, meta.last_name].filter(Boolean).join(" ");
      return {
        pickNo: p.pick_no,
        round: p.round,
        draftSlot: p.draft_slot,
        playerId: p.player_id,
        playerName: name || `Player ${p.player_id}`,
        position: meta.position ?? null,
        nbaTeam: meta.team ?? null,
        teamId: String(p.roster_id),
      } satisfies DraftPick;
    })
    .sort((a, b) => a.pickNo - b.pickNo);
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

/**
 * Signed active streak for a team, ending at the latest final week:
 * positive = consecutive wins, negative = consecutive losses, 0 = none.
 * Pure — takes matchups as a parameter.
 */
export function currentStreak(
  teamId: string,
  matchupsByWeek: Matchup[][]
): number {
  let streak = 0;
  for (let w = matchupsByWeek.length - 1; w >= 0; w--) {
    const m = matchupsByWeek[w].find(
      (x) => x.home.id === teamId || x.away.id === teamId
    );
    if (!m || m.homePoints === null || m.awayPoints === null) break;
    const isHome = m.home.id === teamId;
    const mine = (isHome ? m.homePoints : m.awayPoints) as number;
    const theirs = (isHome ? m.awayPoints : m.homePoints) as number;
    const result = mine > theirs ? 1 : mine < theirs ? -1 : 0;
    if (result === 0) break;
    if (streak !== 0 && Math.sign(streak) !== result) break;
    streak += result;
  }
  return streak;
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

/**
 * Champion roster id from a winners bracket: the winner of the final
 * (highest-round) matchup, as a string to match Team.id. Null when the
 * bracket is empty or the final is undecided — the honest state for a
 * league that hasn't crowned anyone yet (GOAT Hoopers' first season).
 * Pure: takes the raw bracket, no network.
 */
export function championRosterId(
  bracket: RawWinnersBracketEntry[]
): string | null {
  if (bracket.length === 0) return null;
  const finalRound = Math.max(...bracket.map((e) => e.r));
  const finals = bracket.filter((e) => e.r === finalRound);
  const decided = finals.find((e) => e.w !== null && e.w !== undefined);
  const winner = decided?.w ?? finals[0]?.w ?? null;
  return winner === null || winner === undefined ? null : String(winner);
}

/* ---------------- player stock market ---------------- */

/**
 * Player stock market valuation v2 — pure function, the rule-11 seam for
 * stocks. Fetching (transactions, rosters, drafts, snapshots, stat cache)
 * lives in `league.ts`; every number below is computed from the input
 * alone, so tests can pass fake inputs straight in.
 *
 * THE MODEL (all in FAAB dollars — the league's waiver currency):
 *
 *   price = clamp( K × ability × futureSeasons(age)
 *                  × sentimentMult × injuryMult, $1, $250 )
 *
 * - ability: Bayesian blend of proven production and prospect pedigree.
 *   Proven production is trailing fantasy PPG in OUR scoring (0.65 × last
 *   season + 0.35 × season before), computed from Sleeper's stats feed —
 *   real box-score totals, not ownership vibes. Prospect pedigree is the
 *   historical year-1–3 fantasy output for the player's league
 *   rookie-draft slot. Blend weight w = exp(−careerMinutes/800): an
 *   unproven rookie prices on pedigree alone; a veteran prices on
 *   production alone. One bad game can't crater a young player because
 *   most of his price is future potential, not last night's box score.
 * - futureSeasons(age): discounted remaining prime —
 *   Σ ageCurve(age+t)/ageCurve(age) × 0.85^t. A proven 21-year-old is
 *   worth more than the same production at 30. This is the dynasty term
 *   the old additive model got backwards (it paid a premium for 24).
 * - sentimentMult: bounded (±25%) overlay from revealed league behavior —
 *   add/drop velocity, FAAB spent, trades. Hype moves price but can't
 *   invent value.
 * - In-season, trailing production blends toward the per-game EMA
 *   (see emaUpdate) as games accumulate; preseason it runs on trailing
 *   production + pedigree alone.
 *
 * Honesty notes, enforced by the code not by comments:
 * - "Contract" always resolves to $0. Sleeper tracks no contracts; the
 *   engine refuses to invent them. The factor still appears (neutral) so
 *   the model is explicit about what it doesn't know.
 * - Change % compares against the last persisted snapshot. With no
 *   snapshot history every change field is null (shown as "new listing").
 */
export type StockMarketInput = {
  /** player_id → directory entry (age, injury_status, years_exp…). */
  players: Record<string, RawPlayerEntry>;
  /** player_id → number of league teams currently rostering the player. */
  rosteredCount: Record<string, number>;
  totalRosters: number;
  /** player_id → total FAAB (waiver_bid) spent in the window. */
  faabSpent: Record<string, number>;
  /** League waiver budget in FAAB dollars (0/unknown → FAAB factor off). */
  faabBudget: number;
  /** player_id → adds/drops in the window. */
  flow: Record<string, { adds: number; drops: number }>;
  /** player_id → times traded in the window. */
  tradeCount: Record<string, number>;
  /** player_id → earliest league rookie-draft overall pick. */
  draftPick: Record<string, number>;
  /** player_id → fundamentals. Null = stats unavailable, price on pedigree. */
  statProfiles: Record<string, PlayerStatProfile> | null;
  /** player_id → price points, oldest → newest. Null = no history yet. */
  history: Record<string, PriceHistoryPoint[]> | null;
  /** Unix ms of computation. */
  now: number;
};

export const STOCK_FLOOR = 1;
export const STOCK_CAP = 250;
/**
 * Dollar calibration: Jokić's trailing ~40 fppg at age 30–31 lands ≈$75.
 * Recompute if the scoring settings change materially.
 */
export const K_STOCK = 0.5;
/** Moves smaller than this read as noise → trend "flat". */
const TREND_THRESHOLD_PCT = 1;
/** Movers sections only list moves at least this big. */
const MOVER_THRESHOLD_PCT = 2;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Fantasy PPG from a Sleeper season stat line under the given scoring.
 * `sp` is seconds played (Sleeper's field name). Returns null for empty
 * lines (didn't play). Pure — used by the stats client and by tests.
 */
export function fppgUnderScoring(
  line: Record<string, number>,
  scoring: Record<string, number>
): { fppg: number; games: number; minutes: number } | null {
  const games = line.gp ?? 0;
  if (!(games > 0)) return null;
  let total = 0;
  for (const [stat, pts] of Object.entries(scoring)) {
    total += (line[stat] ?? 0) * pts;
  }
  return {
    fppg: Math.round((total / games) * 100) / 100,
    games,
    minutes: (line.sp ?? 0) / 60,
  };
}

/**
 * NBA aging curve: multiplier of peak production by age. Peak 26–27,
 * gentle ramp before, steeper decline after — the standard empirical shape.
 */
const AGE_CURVE: Array<[number, number]> = [
  [19, 0.78], [20, 0.83], [21, 0.87], [22, 0.91], [23, 0.94], [24, 0.97],
  [25, 0.99], [26, 1.0], [27, 1.0], [28, 0.98], [29, 0.95], [30, 0.91],
  [31, 0.86], [32, 0.8], [33, 0.73], [34, 0.65], [35, 0.56], [36, 0.47],
  [37, 0.38], [38, 0.3],
];

export function ageCurveMultiplier(age: number | undefined): number {
  if (age == null || Number.isNaN(age)) return 0.9;
  if (age <= 19) return 0.78;
  if (age >= 38) return 0.3;
  const lo = Math.floor(age);
  const hi = lo + 1;
  const loV = AGE_CURVE.find(([a]) => a === lo)?.[1] ?? 0.9;
  const hiV = AGE_CURVE.find(([a]) => a === hi)?.[1] ?? loV;
  return loV + (hiV - loV) * (age - lo);
}

export function ageCurveNote(age: number | undefined): string {
  if (age == null) return "Age unknown — mild discount";
  if (age <= 21) return `${age} — long runway, production still ramping`;
  if (age <= 25) return `${age} — approaching prime`;
  if (age <= 29) return `${age} — prime years`;
  if (age <= 32) return `${age} — veteran, decline priced in`;
  if (age <= 34) return `${age} — declining`;
  return `${age} — twilight`;
}

/**
 * Discounted future seasons of current production — the dynasty term.
 * Σ ageCurve(age+t)/ageCurve(age) × 0.85^t. A proven 21-year-old carries
 * ~6.5 discounted seasons; the same player at 31 carries ~3.7.
 */
export function futureSeasonValue(age: number | undefined): number {
  const a = age ?? 27;
  const base = ageCurveMultiplier(a);
  let sum = 0;
  for (let t = 0; t <= 38 - Math.min(Math.max(a, 19), 38); t++) {
    sum += (ageCurveMultiplier(a + t) / base) * Math.pow(0.85, t);
  }
  return Math.round(sum * 100) / 100;
}

/**
 * Prospect pedigree: historical year-1–3 fantasy PPG for a league
 * rookie-draft slot. Undrafted/never-drafted → replacement level.
 */
export function pedigreeFppg(pick: number | null | undefined): number {
  if (pick == null) return 2.0;
  if (pick <= 3) return 13;
  if (pick <= 7) return 9.5;
  if (pick <= 14) return 6.5;
  if (pick <= 20) return 5;
  if (pick <= 30) return 3.5;
  return 2.5;
}

/**
 * Prospect weight: how much of the price is still pedigree vs proven
 * production. Decays exponentially with NBA minutes — ~800 minutes
 * (a quarter-season of rotation play) halves it. Veterans measured over
 * only two seasons get years_exp × 1500 as a floor so an injured
 * eight-year vet doesn't price like a rookie.
 */
export function prospectWeight(
  careerMinutes: number,
  yearsExp: number | undefined
): number {
  const effective = Math.max(careerMinutes, (yearsExp ?? 0) * 1500);
  return Math.exp(-effective / 800);
}

/**
 * Per-game Bayesian-ish update. alpha is the learning rate: small for
 * rookies/young players (their price is mostly future potential, so one
 * game barely moves it), larger for veterans (their price IS current
 * production).
 */
export function emaUpdate(
  ema: number | null,
  games: number,
  gameFppg: number,
  alpha: number
): { ema: number; games: number } {
  const next = ema == null ? gameFppg : ema + alpha * (gameFppg - ema);
  return { ema: round2(next), games: games + 1 };
}

/** Learning rate for the EMA: potential-dominated players learn slowly. */
export function emaAlpha(
  age: number | undefined,
  careerMinutes: number
): number {
  if ((age ?? 99) <= 22 || careerMinutes < 800) return 0.025;
  if ((age ?? 99) <= 25 || careerMinutes < 2500) return 0.05;
  return 0.08;
}

function injuryDiscount(
  status: string | null | undefined
): { mult: number; note: string } {
  switch (status) {
    case "Out":
    case "IR":
      return { mult: 0.45, note: `${status} — heavy discount` };
    case "Doubtful":
      return { mult: 0.7, note: "Doubtful — discounted" };
    case "Questionable":
      return { mult: 0.85, note: "Questionable — slight discount" };
    case "Suspended":
      return { mult: 0.5, note: "Suspended" };
    default:
      return { mult: 1, note: "Healthy" };
  }
}

function displayNameOf(id: string, entry: RawPlayerEntry): string {
  return (
    entry.full_name ??
    [entry.first_name, entry.last_name].filter(Boolean).join(" ") ??
    `Player ${id}`
  );
}

/**
 * Market footprint signals for one player. A player is listed in the
 * market when any signal is present: current ownership, FAAB spent,
 * trades, adds/drops in the window, or rookie-draft capital.
 */
export type MarketFootprintSignals = {
  owned: number;
  spent: number;
  trades: number;
  adds: number;
  drops: number;
  pick: number | null | undefined;
};

/**
 * Pure market-membership predicate. Shared by pricing (computePlayerStocks)
 * and history-request selection (getMarketInputs) so "listed", "history
 * requested", and "snapshot eligible" never drift (issue #31).
 */
export function hasMarketFootprint(signals: MarketFootprintSignals): boolean {
  return (
    signals.owned > 0 ||
    signals.spent > 0 ||
    signals.trades > 0 ||
    signals.adds > 0 ||
    signals.drops > 0 ||
    signals.pick != null
  );
}

/**
 * Player IDs with a market footprint, derived from a StockMarketInput.
 * Used to select history requests — must match pricing membership so
 * unrostered listings (draft picks, recent moves) recover their baselines.
 * Pure.
 */
export function marketCandidateIds(
  input: Pick<
    StockMarketInput,
    "players" | "rosteredCount" | "faabSpent" | "flow" | "tradeCount" | "draftPick"
  >
): string[] {
  const ids: string[] = [];
  for (const id of Object.keys(input.players)) {
    const { adds, drops } = input.flow[id] ?? { adds: 0, drops: 0 };
    if (
      hasMarketFootprint({
        owned: input.rosteredCount[id] ?? 0,
        spent: input.faabSpent[id] ?? 0,
        trades: input.tradeCount[id] ?? 0,
        adds,
        drops,
        pick: input.draftPick[id],
      })
    ) {
      ids.push(id);
    }
  }
  return ids;
}

/**
 * Price every player with a market footprint, full PlayerStock objects.
 * Pure: same inputs, same outputs. Used by computeStockMarket (which slims
 * the list to quotes for Rule 14) and by getStockDetail (one player's deep
 * data for the expanded row).
 */
export function computePlayerStocks(input: StockMarketInput): PlayerStock[] {
  const {
    players,
    rosteredCount,
    totalRosters,
    faabSpent,
    faabBudget,
    flow,
    tradeCount,
    draftPick,
    statProfiles,
    history,
    now,
  } = input;

  const priced: PlayerStock[] = [];
  /** Future seasons at peak age — the age factor is measured against this. */
  const FS_PEAK = futureSeasonValue(27);

  for (const [id, entry] of Object.entries(players)) {
    const owned = rosteredCount[id] ?? 0;
    const spent = faabSpent[id] ?? 0;
    const trades = tradeCount[id] ?? 0;
    const { adds, drops } = flow[id] ?? { adds: 0, drops: 0 };
    const pick = draftPick[id];
    if (!hasMarketFootprint({ owned, spent, trades, adds, drops, pick }))
      continue; // no market footprint — not listed

    const ownership = totalRosters > 0 ? owned / totalRosters : 0;
    const faabNorm = faabBudget > 0 ? Math.min(spent / faabBudget, 1) : 0;
    const age = entry.age;
    const yearsExp = entry.years_exp;
    const prof = statProfiles?.[id] ?? null;

    // --- Fundamentals: Bayesian blend of proven production + pedigree ---
    // In-season games count toward the prospect decay (est. 30 min/game)
    // so a rookie's pedigree converts to production as he actually plays.
    const w = prospectWeight(
      (prof?.careerMinutes ?? 0) + (prof?.emaGames ?? 0) * 30,
      yearsExp
    );
    const pedigree = pedigreeFppg(prof?.leaguePick ?? pick);
    let trailing = prof?.fppg ?? null;
    if (prof && prof.emaFppg != null && prof.emaGames > 0) {
      // In-season: blend trailing production toward the current-season
      // EMA as games accumulate (up to 50/50 after 20 games).
      const sw = Math.min(prof.emaGames / 20, 0.5);
      trailing =
        trailing != null
          ? round2((1 - sw) * trailing + sw * prof.emaFppg)
          : prof.emaFppg;
    }
    const provenPart = trailing != null ? (1 - w) * trailing : 0;
    const ability = provenPart + w * pedigree;
    const fs = futureSeasonValue(age);

    // --- Sentiment: bounded overlay from revealed league behavior ---
    const netFlow = clamp(adds - drops, -5, 5);
    const sentimentRaw =
      netFlow * 0.02 + Math.min(faabNorm, 1) * 0.12 + Math.min(trades, 3) * 0.02;
    const sentimentMult = clamp(1 + sentimentRaw, 0.75, 1.25);

    const injC = injuryDiscount(entry.injury_status);
    const price = round2(
      clamp(
        K_STOCK * ability * fs * sentimentMult * injC.mult,
        STOCK_FLOOR,
        STOCK_CAP
      )
    );

    // Factors, decomposing the price exactly.
    const fProduction = round2(K_STOCK * provenPart * FS_PEAK);
    const fPedigree = round2(K_STOCK * w * pedigree * FS_PEAK);
    const fAge = round2(K_STOCK * ability * (fs - FS_PEAK));
    const fSentiment = round2(
      (fProduction + fPedigree + fAge) * (sentimentMult - 1)
    );
    const fInjury = round2(
      (fProduction + fPedigree + fAge + fSentiment) * (injC.mult - 1)
    );

    const factors: StockFactor[] = [
      {
        kind: "production",
        label: "Proven production",
        delta: fProduction,
        note:
          trailing != null
            ? `${trailing.toFixed(1)} fppg trailing (65/35) × ${(100 * (1 - w)).toFixed(0)}% proven weight`
            : "No NBA stat line — priced on pedigree alone",
      },
      {
        kind: "draft",
        label: "Prospect pedigree",
        delta: fPedigree,
        note:
          w < 0.02
            ? "Fully proven — pedigree weight ~0%"
            : (prof?.leaguePick ?? pick) != null
              ? `Rookie pick #${prof?.leaguePick ?? pick} → ${pedigree} fppg historical comps × ${(100 * w).toFixed(0)}% weight`
              : `Undrafted → ${pedigree} fppg replacement-level prior`,
      },
      {
        kind: "dynasty",
        label: "Age curve",
        delta: fAge,
        note: `${ageCurveNote(age)} — ${fs.toFixed(1)} discounted seasons vs ${FS_PEAK.toFixed(1)} at peak`,
      },
      {
        kind: "recent",
        label: "Market sentiment",
        delta: fSentiment,
        note:
          adds !== 0 || drops !== 0 || spent > 0 || trades > 0
            ? `${adds} adds vs ${drops} drops, $${spent} FAAB, ${trades} trades — bounded ±25%`
            : "No recent league buzz — sentiment neutral",
      },
      {
        kind: "injury",
        label: "Injuries",
        delta: fInjury,
        note: injC.note,
      },
      {
        kind: "contract",
        label: "Contract",
        delta: 0,
        note: "Not tracked — Sleeper exposes no contract data",
      },
    ];
    factors.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    // History → change, trend, sparkline.
    // `hist` is already sampled (store caps at 40 points): reconstructed
    // gamelog path + backtest points + live snapshots, oldest → newest.
    const hist = history?.[id] ?? [];
    const liveHistory = hist.filter(p => p.source === "live");
    const prevPrice = liveHistory.length > 0 ? liveHistory[liveHistory.length - 1].price : null;
    const change =
      prevPrice != null && prevPrice > 0 ? round2(price - prevPrice) : null;
    const changePct =
      prevPrice != null && prevPrice > 0
        ? Math.round(((price - prevPrice) / prevPrice) * 1000) / 10
        : null;
    const trend: StockTrend =
      changePct == null
        ? "flat"
        : changePct >= TREND_THRESHOLD_PCT
          ? "up"
          : changePct <= -TREND_THRESHOLD_PCT
            ? "down"
            : "flat";
    const spark: PriceHistoryPoint[] = [
      ...hist.slice(-39),
      { date: new Date(now).toISOString(), price, source: "live" },
    ];

    priced.push({
      playerId: id,
      playerName: displayNameOf(id, entry),
      position: entry.position ?? null,
      nbaTeam: entry.team ?? null,
      price,
      prevPrice,
      change,
      changePct,
      trend,
      spark,
      factors,
      faabSpent: spent,
      tradeCount: trades,
      ownership,
      rookiePick: pick ?? null,
      seasonHistory: prof?.seasonHistory ?? [],
    });
  }

  priced.sort((a, b) => b.price - a.price);
  return priced;
}

export function computeStockMarket(input: StockMarketInput): StockMarket {
  const { flow, now, statProfiles } = input;
  const priced = computePlayerStocks(input);
  const anyInSeason = Object.values(statProfiles ?? {}).some(
    (p) => p.emaGames > 0
  );

  const hasHistory = priced.some((s) => s.changePct != null);
  const movers = priced.filter((s) => s.changePct != null);
  const trending = movers
    .filter((s) => (s.changePct as number) >= MOVER_THRESHOLD_PCT)
    .sort((a, b) => (b.changePct as number) - (a.changePct as number))
    .slice(0, 5);
  const falling = movers
    .filter((s) => (s.changePct as number) <= -MOVER_THRESHOLD_PCT)
    .sort((a, b) => (a.changePct as number) - (b.changePct as number))
    .slice(0, 5);

  // Panic meter — rule-based, documented, no vibes.
  const panic: PanicSignal[] = [];
  for (const s of priced) {
    const quote = toStockQuote(s);
    const { drops } = flow[s.playerId] ?? { drops: 0 };
    if (s.tradeCount >= 3) {
      panic.push({
        stock: quote,
        reason: `Traded ${s.tradeCount}× in 14 days — why is everyone moving him?`,
        intensity: 3,
      });
    } else if (s.tradeCount === 2) {
      panic.push({
        stock: quote,
        reason: "Traded twice in 14 days — the league is restless",
        intensity: 2,
      });
    } else if (drops >= 2 && s.ownership >= 0.5) {
      panic.push({
        stock: quote,
        reason: `Dropped by ${drops} managers despite ${Math.round(s.ownership * 100)}% ownership`,
        intensity: 2,
      });
    } else if (drops - (flow[s.playerId]?.adds ?? 0) >= 3 && s.price >= 40) {
      panic.push({
        stock: quote,
        reason: `Getting dumped — ${drops} drops lately on a $${s.price.toFixed(2)} stock`,
        intensity: 1,
      });
    }
  }
  panic.sort(
    (a, b) =>
      b.intensity - a.intensity ||
      Math.abs(b.stock.changePct ?? 0) - Math.abs(a.stock.changePct ?? 0)
  );

  return {
    stocks: priced.map(toStockQuote),
    trending: trending.map(toStockQuote),
    falling: falling.map(toStockQuote),
    panic: panic.slice(0, 5),
    updatedAt: now,
    hasHistory,
    pricingBasis: anyInSeason ? "in-season" : "preseason",
  };
}

/**
 * Slim a full PlayerStock down to its list-view quote. Per Rule 14, the
 * list ships only what rows render — factors, season history, and the
 * sparkline load on expand via getStockDetail.
 */
export function toStockQuote(s: PlayerStock): StockQuote {
  return {
    playerId: s.playerId,
    playerName: s.playerName,
    position: s.position,
    nbaTeam: s.nbaTeam,
    price: s.price,
    prevPrice: s.prevPrice,
    change: s.change,
    changePct: s.changePct,
    trend: s.trend,
    ownership: s.ownership,
    rookiePick: s.rookiePick,
  };
}

/**
 * Extract one player's deep data from a full PlayerStock. Powers
 * getStockDetail — never ships in list HTML.
 */
export function toStockDetail(s: PlayerStock): StockDetail {
  return {
    playerId: s.playerId,
    factors: s.factors,
    seasonHistory: s.seasonHistory,
    spark: s.spark,
  };
}
