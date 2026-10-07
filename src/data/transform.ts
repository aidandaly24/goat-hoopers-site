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
  StockMarket,
  StockFactor,
  StockTrend,
  PanicSignal,
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
 * Player stock market valuation — pure function, the rule-11 seam for
 * stocks. Fetching (transactions, rosters, drafts, snapshots) lives in
 * `league.ts`; every number below is computed from the input alone, so
 * tests can pass fake inputs straight in.
 *
 * THE MODEL (all in FAAB dollars — the league's waiver currency):
 *
 *   price = clamp( BASE
 *     + production   (ownership-implied: 50 × rostered share)
 *     + faab         (40 × FAAB spent ÷ league budget, capped at 1 budget)
 *     + trades       (+3 per trade in the window, capped at 4)
 *     + draft        (rookie pick premium: (31 − pick) × 1.2, top 30)
 *     + dynasty      (+8 for 3rd-year-or-less players aged ≤24,
 *                      +4 for anyone else aged ≤24)
 *     + recent       (+2 per net add in the window, clamped to ±5)
 *     then × age curve × injury discount,
 *     clamped to [$1, $250] )
 *
 * Honesty notes, enforced by the code not by comments:
 * - "Production" is market-implied. Sleeper's public API exposes no
 *   per-player stat feed, so we infer it from revealed behavior: managers
 *   roster and spend FAAB on players who produce. The factor note says so.
 * - "Contract" always resolves to $0. Sleeper tracks no contracts; the
 *   engine refuses to invent them. The factor still appears (neutral) so
 *   the model is explicit about what it doesn't know.
 * - "Recent performances" is add/drop velocity — adds mean someone's
 *   flashing, drops mean they're cold. Same revealed-behavior logic.
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
  /** player_id → overall rookie-draft pick number. */
  draftPick: Record<string, number>;
  /** player_id → previous prices, oldest → newest. Null = no history yet. */
  history: Record<string, number[]> | null;
  /** Unix ms of computation. */
  now: number;
};

const STOCK_BASE = 18;
const STOCK_FLOOR = 1;
const STOCK_CAP = 250;
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

function ageCurve(age: number | undefined): { mult: number; note: string } {
  if (age == null) return { mult: 0.9, note: "Age unknown — mild discount" };
  if (age < 21) return { mult: 0.85, note: `${age} — raw upside, unproven` };
  if (age <= 23) return { mult: 0.95, note: `${age} — still developing` };
  if (age <= 29) return { mult: 1.1, note: `${age} — prime years` };
  if (age <= 32) return { mult: 0.95, note: `${age} — veteran` };
  if (age <= 34) return { mult: 0.75, note: `${age} — declining` };
  return { mult: 0.5, note: `${age} — twilight` };
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

export function computeStockMarket(input: StockMarketInput): StockMarket {
  const {
    players,
    rosteredCount,
    totalRosters,
    faabSpent,
    faabBudget,
    flow,
    tradeCount,
    draftPick,
    history,
    now,
  } = input;

  const priced: PlayerStock[] = [];

  for (const [id, entry] of Object.entries(players)) {
    const owned = rosteredCount[id] ?? 0;
    const spent = faabSpent[id] ?? 0;
    const trades = tradeCount[id] ?? 0;
    const { adds, drops } = flow[id] ?? { adds: 0, drops: 0 };
    const pick = draftPick[id];
    const hasSignal =
      owned > 0 || spent > 0 || trades > 0 || adds > 0 || drops > 0 || pick != null;
    if (!hasSignal) continue; // no market footprint — not listed

    const ownership = totalRosters > 0 ? owned / totalRosters : 0;
    const faabNorm = faabBudget > 0 ? Math.min(spent / faabBudget, 1) : 0;
    const age = entry.age;
    const yearsExp = entry.years_exp;

    // Additive factors (FAAB dollars).
    const fProduction = ownership * 50;
    const fFaab = faabNorm * 40;
    const fTrades = Math.min(trades, 4) * 3;
    const fDraft = pick != null && pick <= 30 ? (31 - pick) * 1.2 : 0;
    const fDynasty =
      yearsExp != null && yearsExp <= 3 && (age ?? 99) <= 24
        ? 8
        : age != null && age <= 24
          ? 4
          : 0;
    const fRecent = clamp(adds - drops, -5, 5) * 2;

    const subtotal =
      STOCK_BASE + fProduction + fFaab + fTrades + fDraft + fDynasty + fRecent;

    // Multiplicative factors, recorded as their dollar delta.
    const ageC = ageCurve(age);
    const fAge = subtotal * (ageC.mult - 1);
    const injC = injuryDiscount(entry.injury_status);
    const fInjury = (subtotal + fAge) * (injC.mult - 1);

    const price = round2(clamp(subtotal + fAge + fInjury, STOCK_FLOOR, STOCK_CAP));

    const factors: StockFactor[] = [
      {
        kind: "production",
        label: "Production",
        delta: round2(fProduction),
        note: `Market-implied — ${Math.round(ownership * 100)}% owned (Sleeper has no per-player stat feed)`,
      },
      {
        kind: "faab",
        label: "FAAB market",
        delta: round2(fFaab),
        note:
          spent > 0
            ? `$${spent} in winning waiver bids lately`
            : "No FAAB spent lately",
      },
      {
        kind: "trades",
        label: "League trades",
        delta: round2(fTrades),
        note:
          trades > 0
            ? `Traded ${trades}× lately — the league is talking`
            : "No recent trades",
      },
      {
        kind: "draft",
        label: "Draft capital",
        delta: round2(fDraft),
        note:
          pick != null
            ? `Rookie draft pick #${pick}`
            : "No rookie-draft capital",
      },
      {
        kind: "dynasty",
        label: "Dynasty outlook",
        delta: round2(fDynasty),
        note:
          fDynasty > 0
            ? "Young core piece — long runway"
            : "Outlook priced on present value",
      },
      {
        kind: "recent",
        label: "Recent form",
        delta: round2(fRecent),
        note:
          adds !== 0 || drops !== 0
            ? `${adds} adds vs ${drops} drops lately`
            : "No recent adds/drops",
      },
      { kind: "age", label: "Age curve", delta: round2(fAge), note: ageC.note },
      {
        kind: "injury",
        label: "Injuries",
        delta: round2(fInjury),
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
    const hist = history?.[id] ?? [];
    const prevPrice = hist.length > 0 ? hist[hist.length - 1] : null;
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
    const spark = [...hist.slice(-9), price];

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
    });
  }

  priced.sort((a, b) => b.price - a.price);

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
    const { drops } = input.flow[s.playerId] ?? { drops: 0 };
    if (s.tradeCount >= 3) {
      panic.push({
        stock: s,
        reason: `Traded ${s.tradeCount}× in 14 days — why is everyone moving him?`,
        intensity: 3,
      });
    } else if (s.tradeCount === 2) {
      panic.push({
        stock: s,
        reason: "Traded twice in 14 days — the league is restless",
        intensity: 2,
      });
    } else if (drops >= 2 && s.ownership >= 0.5) {
      panic.push({
        stock: s,
        reason: `Dropped by ${drops} managers despite ${Math.round(s.ownership * 100)}% ownership`,
        intensity: 2,
      });
    } else if (drops - (input.flow[s.playerId]?.adds ?? 0) >= 3 && s.price >= 40) {
      panic.push({
        stock: s,
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
    stocks: priced,
    trending,
    falling,
    panic: panic.slice(0, 5),
    updatedAt: now,
    hasHistory,
  };
}
