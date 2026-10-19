import { expect, it } from 'vitest';
import {
  getObservedPlayerWeek,
  observedPlayersForCurrentRoster,
  type EvidenceLeagueInput,
  type EvidenceStateInput,
  type WeeklyPlayerEvidenceDeps,
} from '../weekly-player-evidence';

const LEAGUE_ID = '1387473752807190528';
const TIPPED_NOW = () => Date.parse('2026-10-25T12:00:00Z');

function state(overrides: Partial<EvidenceStateInput> = {}): EvidenceStateInput {
  return {
    season: '2026',
    season_type: 'regular',
    week: 2,
    leg: 2,
    season_start_date: '2026-10-20',
    ...overrides,
  };
}

function league(overrides: Partial<EvidenceLeagueInput> = {}): EvidenceLeagueInput {
  return { season: '2026', ...overrides };
}

/** One matchup entry; players_points keys are the weekly roster ids. */
function entry(
  rosterId: number,
  matchupId: number,
  playersPoints: Record<string, number> | null,
  extras: Record<string, unknown> = {},
) {
  const players = playersPoints ? Object.keys(playersPoints) : [];
  return {
    roster_id: rosterId,
    matchup_id: matchupId,
    points: playersPoints ? Object.values(playersPoints).reduce((a, b) => a + b, 0) : null,
    players,
    players_points: playersPoints,
    starters_points: [],
    ...extras,
  };
}

/** Ten paired entries (5 matchups), week with real production on team 1. */
function tenTeams(withPoints: (rosterId: number) => Record<string, number> | null) {
  // (callbacks below return compatible shapes; the parameter type unifies them)
  const entries = [];
  for (let rosterId = 1; rosterId <= 10; rosterId += 1) {
    const matchupId = Math.ceil(rosterId / 2);
    entries.push(entry(rosterId, matchupId, withPoints(rosterId)));
  }
  return entries;
}

function deps(overrides: Partial<WeeklyPlayerEvidenceDeps> = {}): WeeklyPlayerEvidenceDeps {
  return {
    leagueId: LEAGUE_ID,
    league: async () => league(),
    state: async () => state(),
    matchups: async () =>
      tenTeams((rosterId): Record<string, number> => (rosterId === 1 ? { '100': 24.5, '101': 0 } : { '200': 12 })),
    now: TIPPED_NOW,
    ...overrides,
  };
}

it('returns recorded points for one previous week with participation unknown and gp null', async () => {
  const result = await getObservedPlayerWeek(deps());
  expect(result.status).toBe('ok');
  if (result.status !== 'ok') return;
  expect(result.week.leagueId).toBe(LEAGUE_ID);
  expect(result.week.season).toBe('2026');
  expect(result.week.week).toBe(1);
  expect(result.week.teams).toHaveLength(10);
  const team1 = result.week.teams.find((t) => t.rosterId === 1)!;
  expect(team1.players).toEqual([
    { playerId: '100', points: 24.5, participation: 'unknown', gamesPlayed: null },
    // Recorded zero stays a zero — never a DNP claim, never dropped.
    { playerId: '101', points: 0, participation: 'unknown', gamesPlayed: null },
  ]);
  expect(result.week.coverage).toMatchObject({ teams: 10, teamsTotal: 10, droppedCorruptRows: 0 });
});

it('resolves leg 30 to week 29 (season/week boundary)', async () => {
  const d = deps({ state: async () => state({ leg: 30, week: 30 }) });
  const result = await getObservedPlayerWeek(d);
  expect(result.status).toBe('ok');
  if (result.status !== 'ok') return;
  expect(result.week.week).toBe(29);
});

it('reports unavailable when the current leg has no previous week', async () => {
  const result = await getObservedPlayerWeek(deps({ state: async () => state({ leg: 1, week: 1 }) }));
  expect(result).toMatchObject({ status: 'unavailable', reason: 'no_previous_week' });
});

it('rejects preseason state and an untipped season', async () => {
  const pre = await getObservedPlayerWeek(deps({ state: async () => state({ season_type: 'pre', leg: 0, week: 1 }) }));
  expect(pre).toMatchObject({ status: 'unavailable', reason: 'preseason' });

  const untipped = await getObservedPlayerWeek(
    deps({ now: () => Date.parse('2026-10-19T12:00:00Z') }),
  );
  expect(untipped).toMatchObject({ status: 'unavailable', reason: 'preseason' });
});

it('rejects season mismatches and invalid state', async () => {
  const mismatch = await getObservedPlayerWeek(deps({ league: async () => league({ season: '2025' }) }));
  expect(mismatch).toMatchObject({ status: 'unavailable', reason: 'season_mismatch' });

  for (const bad of [
    state({ leg: 31 }),
    state({ leg: null, week: NaN }),
    state({ season_type: 'offseason' }),
    state({ season: '26' }),
    state({ season_start_date: 'not-a-date' }),
    state({ season_start_date: null }),
  ]) {
    const result = await getObservedPlayerWeek(deps({ state: async () => bad }));
    expect(result).toMatchObject({ status: 'unavailable', reason: 'invalid_state' });
  }
});

it('reports fetch failures without throwing', async () => {
  const failing: WeeklyPlayerEvidenceDeps = {
    ...deps(),
    matchups: async () => {
      throw new Error('boom');
    },
  };
  const result = await getObservedPlayerWeek(failing);
  expect(result).toMatchObject({ status: 'unavailable', reason: 'fetch_failed' });
});

it('rejects malformed matchup structures', async () => {
  const cases: unknown[][] = [
    [],
    tenTeams(() => ({ '1': 5 })).slice(0, 8),
    // Unpaired matchup ids.
    tenTeams((rosterId) => ({ [`${rosterId}`]: 5 })).map((e, i) => ({ ...e, matchup_id: i + 1 })),
    // Duplicate roster id.
    [...tenTeams(() => ({ '1': 5 })).slice(0, 9), entry(1, 5, { '1': 5 })],
    // Non-object entry.
    [...tenTeams(() => ({ '1': 5 })).slice(0, 9), 'nope'],
  ];
  for (const entries of cases) {
    const result = await getObservedPlayerWeek(deps({ matchups: async () => entries }));
    expect(result).toMatchObject({ status: 'unavailable', reason: 'malformed_matchups' });
  }
});

it('reports missing players_points explicitly', async () => {
  const result = await getObservedPlayerWeek(
    deps({ matchups: async () => tenTeams(() => null) }),
  );
  expect(result).toMatchObject({ status: 'unavailable', reason: 'missing_player_points' });
});

it('refuses to certify an all-zero placeholder week as completed', async () => {
  const result = await getObservedPlayerWeek(
    deps({ matchups: async () => tenTeams(() => ({ '1': 0, '2': 0 })) }),
  );
  expect(result).toMatchObject({ status: 'unavailable', reason: 'no_recorded_production' });
});

it('keeps partial coverage when some teams lack players_points', async () => {
  const result = await getObservedPlayerWeek(
    deps({
      matchups: async () =>
        tenTeams((rosterId) => (rosterId <= 5 ? { [`p${rosterId}`]: 10 } : null)),
    }),
  );
  expect(result.status).toBe('ok');
  if (result.status !== 'ok') return;
  expect(result.week.coverage).toMatchObject({ teams: 5, teamsTotal: 10 });
  const team6 = result.week.teams.find((t) => t.rosterId === 6)!;
  expect(team6.players).toEqual([]);
});

it('reports roster ids missing from players_points as null points, not zero', async () => {
  const entries = tenTeams(
    (rosterId): Record<string, number> => (rosterId === 1 ? { '100': 24.5 } : { '200': 12 }),
  );
  entries[0] = { ...entries[0], players: ['100', '101'] };
  const result = await getObservedPlayerWeek(deps({ matchups: async () => entries }));
  expect(result.status).toBe('ok');
  if (result.status !== 'ok') return;
  const team1 = result.week.teams.find((t) => t.rosterId === 1)!;
  expect(team1.players).toEqual([
    { playerId: '100', points: 24.5, participation: 'unknown', gamesPlayed: null },
    { playerId: '101', points: null, participation: 'unknown', gamesPlayed: null },
  ]);
});

it('drops corrupt point values and counts them', async () => {
  const entries = tenTeams((rosterId): Record<string, number> => (rosterId === 1 ? { '100': 24.5 } : { '200': 12 }));
  entries[0] = {
    ...entries[0],
    players: ['100', 'bad'],
    players_points: { '100': 24.5, bad: 'twelve' } as unknown as Record<string, number>,
  };
  const result = await getObservedPlayerWeek(deps({ matchups: async () => entries }));
  expect(result.status).toBe('ok');
  if (result.status !== 'ok') return;
  const team1 = result.week.teams.find((t) => t.rosterId === 1)!;
  expect(team1.players.map((p) => p.playerId)).toEqual(['100']);
  expect(result.week.coverage.droppedCorruptRows).toBe(1);
});

it('preserves the same player id on two teams (mid-week trade) as recorded', async () => {
  const entries = tenTeams((rosterId) => ({ [`p${rosterId}`]: 10 }));
  entries[0] = { ...entries[0], players: ['shared'], players_points: { shared: 5 } };
  entries[1] = { ...entries[1], players: ['shared'], players_points: { shared: 7 } };
  const result = await getObservedPlayerWeek(deps({ matchups: async () => entries }));
  expect(result.status).toBe('ok');
  if (result.status !== 'ok') return;
  const t1 = result.week.teams.find((t) => t.rosterId === 1)!;
  const t2 = result.week.teams.find((t) => t.rosterId === 2)!;
  expect(t1.players).toEqual([{ playerId: 'shared', points: 5, participation: 'unknown', gamesPlayed: null }]);
  expect(t2.players).toEqual([{ playerId: 'shared', points: 7, participation: 'unknown', gamesPlayed: null }]);
});

it('intersects observed rows with a current roster without verdicts', async () => {
  const result = await getObservedPlayerWeek(deps());
  expect(result.status).toBe('ok');
  if (result.status !== 'ok') return;
  const rows = observedPlayersForCurrentRoster(result.week, 1, new Set(['100', '999']));
  expect(rows).toEqual([
    { playerId: '100', points: 24.5, participation: 'unknown', gamesPlayed: null },
  ]);
  expect(observedPlayersForCurrentRoster(result.week, 99, ['100'])).toEqual([]);
});
