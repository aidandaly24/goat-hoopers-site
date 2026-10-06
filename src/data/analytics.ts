/**
 * analytics.ts — pure data tools for the DATA pillar.
 *
 * Every function here is pure: inputs in, domain objects out, no fetching,
 * no network, no imports beyond domain types. The loaders in league.ts
 * assemble the inputs (the rule-11 seam, same as computeLeagueStats);
 * tests pass fake inputs straight in. All functions return null when
 * there's no real data — a power ranking of all-zero rows is fabrication,
 * not insight.
 */
import type {
  Matchup,
  MatchupPreview,
  PlayoffOdds,
  PowerRanking,
  RecordBook,
  Team,
  TeamWeekScore,
} from "@/domain";
import { isFinal } from "@/domain";

/* ---------------- shared helpers ---------------- */

function gamesPlayed(t: Team): number {
  return t.wins + t.losses + t.ties;
}

/**
 * Min-max normalization across the league. All-equal inputs map to 0.5 so
 * a meaningless stat (everyone tied) can't tilt the order.
 */
function normalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (values.length === 0 || max === min) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}

/** Win percentage over a team's most recent `n` finals. 0.5 when unplayed. */
function recentForm(teamId: string, finals: Matchup[], n: number): number {
  const mine = finals.filter(
    (m) => m.home.id === teamId || m.away.id === teamId
  );
  const last = mine.slice(-n);
  if (last.length === 0) return 0.5;
  let wins = 0;
  for (const m of last) {
    const home = m.home.id === teamId;
    const mine2 = (home ? m.homePoints : m.awayPoints) as number;
    const theirs = (home ? m.awayPoints : m.homePoints) as number;
    if (mine2 > theirs) wins++;
    else if (mine2 === theirs) wins += 0.5;
  }
  return wins / last.length;
}

/** Mulberry32 — a small seeded PRNG so Monte Carlo odds are stable. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard-normal sample via Box-Muller, from a seeded uniform source. */
function randn(rand: () => number): number {
  const u = Math.max(rand(), 1e-12);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ---------------- power rankings ---------------- */

export type PowerRankingsInput = {
  teams: Team[];
  /** Index 0 = week 1. Same convention as LeagueStatsInput. */
  matchupsByWeek: Matchup[][];
};

/**
 * Reconstruct a team's record and point totals as of a subset of finals.
 * The Team objects from the loader carry current-season totals, so the
 * previous-week re-rank (for movement arrows) can't reuse them — it has
 * to replay the season up to that week. Note: finals points are raw
 * Sleeper points, while Team.pointsFor is hundredths; this reconstruction
 * keeps raw units, which is fine because rankOnce only compares and
 * normalizes within one consistent scale.
 */
function teamAsOfWeek(t: Team, finalsThrough: Matchup[]): Team {
  let wins = 0;
  let losses = 0;
  let ties = 0;
  let pf = 0;
  let pa = 0;
  for (const m of finalsThrough) {
    const isHome = m.home.id === t.id;
    if (!isHome && m.away.id !== t.id) continue;
    const mine = (isHome ? m.homePoints : m.awayPoints) as number;
    const theirs = (isHome ? m.awayPoints : m.homePoints) as number;
    pf += mine;
    pa += theirs;
    if (mine > theirs) wins++;
    else if (mine < theirs) losses++;
    else ties++;
  }
  return { ...t, wins, losses, ties, pointsFor: pf, pointsAgainst: pa };
}

/**
 * Compute the league power order.
 *
 * score = 0.40 * norm(winPct)
 *       + 0.30 * norm(pointsFor per game)
 *       + 0.15 * norm(last-3 winPct)       // recent form
 *       + 0.15 * norm(-pointsAgainst per game)
 *
 * Movement is computed by replaying the season through the previous week
 * (teamAsOfWeek reconstructs historical records from finals — the loader's
 * Team objects carry current-season totals and can't be reused for the
 * past). Returns null when nobody has played — the surface renders the
 * honest empty state instead.
 */
export function computePowerRankings(
  input: PowerRankingsInput
): PowerRanking[] | null {
  const { teams, matchupsByWeek } = input;
  const finals = matchupsByWeek.flat().filter(isFinal);
  if (teams.length === 0 || finals.length === 0) return null;

  // Latest week with finals.
  let lastWeekIdx = -1;
  for (let w = matchupsByWeek.length - 1; w >= 0; w--) {
    if (matchupsByWeek[w].some(isFinal)) {
      lastWeekIdx = w;
      break;
    }
  }

  /** The power order as it stood after week `throughIdx` (0-based). */
  const rankAsOf = (throughIdx: number): PowerRanking[] => {
    const fs = matchupsByWeek
      .slice(0, throughIdx + 1)
      .flat()
      .filter(isFinal);
    const asOf = teams.map((t) => teamAsOfWeek(t, fs));
    const winPct = asOf.map((t) => {
      const g = gamesPlayed(t);
      return g === 0 ? 0 : t.wins / g;
    });
    const pfPerGame = asOf.map((t) => {
      const g = gamesPlayed(t);
      return g === 0 ? 0 : t.pointsFor / g;
    });
    const paPerGame = asOf.map((t) => {
      const g = gamesPlayed(t);
      return g === 0 ? 0 : t.pointsAgainst / g;
    });
    const form = asOf.map((t) => recentForm(t.id, fs, 3));

    const nWin = normalize(winPct);
    const nPf = normalize(pfPerGame);
    const nForm = normalize(form);
    const nPa = normalize(paPerGame.map((x) => -x)); // fewer = better

    return asOf
      .map((team, i) => ({
        team,
        rank: 0,
        score: 0.4 * nWin[i] + 0.3 * nPf[i] + 0.15 * nForm[i] + 0.15 * nPa[i],
        previousRank: null as number | null,
        movement: 0,
      }))
      .sort((a, b) => b.score - a.score)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  };

  const current = rankAsOf(lastWeekIdx);
  const previous =
    lastWeekIdx > 0 ? rankAsOf(lastWeekIdx - 1) : null;

  // Restore the loader's current-season Team objects on the final ranking
  // (rankAsOf's as-of reconstructions are only for the math).
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const prevRankById = new Map(
    (previous ?? []).map((r) => [r.team.id, r.rank])
  );
  return current.map((r) => {
    const pr = prevRankById.get(r.team.id) ?? null;
    return {
      team: teamById.get(r.team.id) as Team,
      rank: r.rank,
      score: r.score,
      previousRank: pr,
      movement: pr === null ? 0 : pr - r.rank, // positive = climbed
    };
  });
}

/* ---------------- playoff odds ---------------- */

export type PlayoffOddsInput = {
  teams: Team[];
  /** Index 0 = week 1. */
  matchupsByWeek: Matchup[][];
  /** Sleeper settings: playoff_teams. */
  playoffSpots: number;
  /** Sleeper settings: playoff_week_start (regular season ends the week before). */
  playoffWeekStart: number;
  /** Current league week — seeds the RNG so odds are stable within a week. */
  week: number;
};

const ELO_K = 24;
const SCORE_SD = 15; // weekly fantasy-basketball scoring spread
const ODDS_TRIALS = 10_000;

/**
 * Monte Carlo playoff odds. Elo starts at 1500 for all, updates K=24 on
 * binary final results (margin doesn't rate skill, only W/L does).
 * Remaining regular-season games simulate as round-robin proxies — each
 * week every team draws a random opponent — with win probability from
 * the Elo logistic. Simulated standings break ties by total points for
 * (Sleeper's rule), sampling weekly scores from N(pfPerGame, 15).
 *
 * Returns null in the preseason: uniform-Elo simulation with no data is
 * arithmetic, not insight.
 */
export function computePlayoffOdds(
  input: PlayoffOddsInput
): PlayoffOdds[] | null {
  const { teams, matchupsByWeek, playoffSpots, playoffWeekStart, week } = input;
  const finals = matchupsByWeek.flat().filter(isFinal);
  if (teams.length === 0 || finals.length === 0) return null;

  // Completed weeks = weeks with at least one final.
  let completedWeeks = 0;
  for (let w = 0; w < matchupsByWeek.length; w++) {
    if (matchupsByWeek[w].some(isFinal)) completedWeeks = w + 1;
  }
  const remainingWeeks = Math.max(
    0,
    playoffWeekStart - 1 - completedWeeks
  );

  // Elo from actual results.
  const elo = new Map<string, number>(teams.map((t) => [t.id, 1500]));
  const ordered = [...finals].sort((a, b) => a.week - b.week);
  for (const m of ordered) {
    const eh = elo.get(m.home.id) as number;
    const ea = elo.get(m.away.id) as number;
    const expectedH = 1 / (1 + Math.pow(10, (ea - eh) / 400));
    const hp = m.homePoints as number;
    const ap = m.awayPoints as number;
    const actualH = hp > ap ? 1 : hp < ap ? 0 : 0.5;
    elo.set(m.home.id, eh + ELO_K * (actualH - expectedH));
    elo.set(m.away.id, ea + ELO_K * ((1 - actualH) - (1 - expectedH)));
  }

  const pfPerGame = new Map<string, number>();
  for (const t of teams) {
    const g = gamesPlayed(t);
    pfPerGame.set(t.id, g === 0 ? 0 : t.pointsFor / g);
  }

  const rand = mulberry32((week * 2654435761) >>> 0);
  const made = new Map<string, number>(teams.map((t) => [t.id, 0]));
  const winTotals = new Map<string, number>(teams.map((t) => [t.id, 0]));

  const ids = teams.map((t) => t.id);
  for (let trial = 0; trial < ODDS_TRIALS; trial++) {
    const simWins = new Map<string, number>(
      teams.map((t) => [t.id, t.wins + t.ties * 0.5])
    );
    const simPf = new Map<string, number>(
      teams.map((t) => [t.id, t.pointsFor])
    );
    for (let w = 0; w < remainingWeeks; w++) {
      for (const id of ids) {
        // Random round-robin-proxy opponent.
        let opp = id;
        while (opp === id) opp = ids[Math.floor(rand() * ids.length)];
        const e = elo.get(id) as number;
        const eo = elo.get(opp) as number;
        const p = 1 / (1 + Math.pow(10, (eo - e) / 400));
        if (rand() < p) simWins.set(id, (simWins.get(id) as number) + 1);
        // Weekly score sample for the Sleeper-style PF tiebreak.
        const mean = pfPerGame.get(id) as number;
        simPf.set(
          id,
          (simPf.get(id) as number) + Math.max(0, mean + randn(rand) * SCORE_SD * 100)
        );
      }
    }
    const order = [...teams].sort((a, b) => {
      const dw = (simWins.get(b.id) as number) - (simWins.get(a.id) as number);
      if (dw !== 0) return dw;
      return (simPf.get(b.id) as number) - (simPf.get(a.id) as number);
    });
    for (let i = 0; i < Math.min(playoffSpots, order.length); i++) {
      made.set(order[i].id, (made.get(order[i].id) as number) + 1);
    }
    for (const t of teams) {
      winTotals.set(t.id, (winTotals.get(t.id) as number) + (simWins.get(t.id) as number));
    }
  }

  return teams
    .map((team) => ({
      team,
      makePlayoffPct: (made.get(team.id) as number) / ODDS_TRIALS,
      expectedWins: (winTotals.get(team.id) as number) / ODDS_TRIALS,
      trials: ODDS_TRIALS,
    }))
    .sort((a, b) => b.makePlayoffPct - a.makePlayoffPct);
}

/* ---------------- record book ---------------- */

export type RecordBookInput = {
  /** Index 0 = week 1. */
  matchupsByWeek: Matchup[][];
};

/**
 * All-time top-5 lists from every final: biggest blowouts, closest games,
 * highest single-week team scores. Null when nothing's been played.
 */
export function computeRecordBook(
  input: RecordBookInput
): RecordBook | null {
  const finals = input.matchupsByWeek.flat().filter(isFinal);
  if (finals.length === 0) return null;

  const withMargin = finals.map((m) => ({
    matchup: m,
    margin: Math.abs((m.homePoints as number) - (m.awayPoints as number)),
  }));
  const biggestBlowouts = [...withMargin]
    .sort((a, b) => b.margin - a.margin || b.matchup.week - a.matchup.week)
    .slice(0, 5);
  const closestGames = [...withMargin]
    .sort((a, b) => a.margin - b.margin || b.matchup.week - a.matchup.week)
    .slice(0, 5);

  const scores: TeamWeekScore[] = [];
  for (const m of finals) {
    scores.push({
      team: m.home,
      week: m.week,
      points: m.homePoints as number,
    });
    scores.push({
      team: m.away,
      week: m.week,
      points: m.awayPoints as number,
    });
  }
  const highestScores = scores
    .sort((a, b) => b.points - a.points || b.week - a.week)
    .slice(0, 5);

  return { biggestBlowouts, closestGames, highestScores };
}

/* ---------------- matchup previews ---------------- */

export type MatchupPreviewInput = {
  /** Index 0 = week 1. */
  matchupsByWeek: Matchup[][];
  teams: Team[];
};

const MARGIN_SD = 35; // weekly head-to-head margin spread

/** Standard normal CDF (Abramowitz & Stegun approximation). */
function phi(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

/**
 * Preview the current (or most recent upcoming) week's matchups.
 *
 * The target week is the first week with any non-final matchup; when every
 * played week is final, it falls back to the latest week with matchups.
 * Expected score = 50/50 blend of the team's points-per-game with the
 * league scoring average (shrinks thin samples toward the mean). Win
 * probability = normal CDF on the projected differential. The "pick" is
 * the higher-probability team — a projection, never a lock.
 */
export function computeMatchupPreviews(
  input: MatchupPreviewInput
): MatchupPreview[] | null {
  const { matchupsByWeek, teams } = input;
  if (matchupsByWeek.length === 0) return null;

  let target = -1;
  for (let w = 0; w < matchupsByWeek.length; w++) {
    if (matchupsByWeek[w].length > 0 && matchupsByWeek[w].some((m) => !isFinal(m))) {
      target = w;
      break;
    }
  }
  if (target === -1) {
    for (let w = matchupsByWeek.length - 1; w >= 0; w--) {
      if (matchupsByWeek[w].length > 0) {
        target = w;
        break;
      }
    }
  }
  if (target === -1) return null;

  const ppg = new Map<string, number>();
  let leagueAvg = 0;
  for (const t of teams) {
    const g = gamesPlayed(t);
    const v = g === 0 ? 0 : t.pointsFor / g;
    ppg.set(t.id, v);
    leagueAvg += v;
  }
  leagueAvg = teams.length === 0 ? 0 : leagueAvg / teams.length;

  const expected = (t: Team) => {
    const g = gamesPlayed(t);
    if (g === 0) return leagueAvg; // unplayed team = league average, honestly
    const mine = ppg.get(t.id) as number;
    return 0.5 * mine + 0.5 * leagueAvg;
  };

  return matchupsByWeek[target].map((m) => {
    const projH = expected(m.home);
    const projA = expected(m.away);
    const homeWinPct = phi((projH - projA) / (MARGIN_SD * 100 * Math.SQRT2));
    return {
      matchup: m,
      projectedHome: projH,
      projectedAway: projA,
      homeWinPct,
      pick: homeWinPct >= 0.5 ? m.home : m.away,
    };
  });
}
