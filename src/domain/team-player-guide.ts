/** Public evidence for the personal form guide; ownership is resolved separately. */
export type GuidePlayer = { id: string; name: string; espnId: string | null };
export type CompletedPlayerWeek = {
  season: string; week: number; teamId: string; complete: boolean;
  startsAt: string; endsAt: string;
  /** Only roster membership and participation verified for this exact period. */
  players: { playerId: string; fantasyPoints: number | null; gamesPlayed: number | null; injuryNote: string | null }[];
};
export type PlayerGuideSources = {
  checkedAt: string;
  /** Null means the existing cache does not establish which season its EMA covers. */
  formSeason: string | null;
  form: Record<string, { fppg: number | null; games: number }>;
  injuries: Record<string, string | null>;
  /** null = schedule not available. A known zero never becomes a watch candidate. */
  scheduledGames: Record<string, number> | null;
  completedWeek: CompletedPlayerWeek | null;
};
export type GuideRow = GuidePlayer & { value: number; games: number | null; note: string };
export type TeamPlayerGuide = {
  season: string; currentWeek: number | null; previousWeek: number | null;
  watch: { basis: 'form' | 'market' | 'unavailable'; label: string; rows: GuideRow[]; message: string };
  best: GuideRow[]; rough: GuideRow[]; eligiblePlayed: number;
  recapMessage: string; period: string; coverage: string;
};
const stable = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const unavailable = (message: string): TeamPlayerGuide['watch'] => ({ basis: 'unavailable', label: 'Players to Watch', rows: [], message });

/** No season totals, market values or DNP zeros are relabelled weekly performance. */
export function buildTeamPlayerGuide(input: {
  teamId: string; season: string; phase: string; currentWeek: number | null; now: string;
  roster: GuidePlayer[]; market: { playerId: string; changePct: number | null; prevPrice: number | null }[];
  sources: PlayerGuideSources | null;
}): TeamPlayerGuide {
  const { teamId, season, phase, sources, roster } = input;
  const preseason = ['pre_season', 'pre_draft'].includes(phase);
  const active = preseason || phase === 'in_season';
  const currentWeek = preseason ? 1 : active && Number.isSafeInteger(input.currentWeek) && input.currentWeek! > 0 && input.currentWeek! <= 54
    ? input.currentWeek : null;
  const previousWeek = !preseason && currentWeek !== null && currentWeek > 1 ? currentWeek - 1 : null;
  const rosterMap = new Map(roster.map(player => [player.id, player]));
  const available = (id: string) => {
    const injury = sources?.injuries[id];
    return !/^(out\b|ir$|injured reserve|suspended|doubtful)/i.test(injury ?? '')
      && (sources?.scheduledGames?.[id] === undefined || sources.scheduledGames[id] > 0);
  };
  const note = (id: string) => sources && Object.hasOwn(sources.injuries, id)
    ? sources.injuries[id] ? `Status: ${sources.injuries[id]}` : 'No injury designation in the supplied source'
    : 'Availability status unknown';
  let watch = unavailable(!active ? 'No active weekly watch period in this season phase.' : 'Verified current-season form and schedule projections are not available. No weekly performance forecast is shown.');
  if (active && currentWeek !== null && preseason) {
    const rows = input.market.filter(quote => rosterMap.has(quote.playerId) && available(quote.playerId)
      && quote.prevPrice !== null && Number.isFinite(quote.prevPrice) && quote.prevPrice > 0 && quote.changePct !== null && Number.isFinite(quote.changePct) && quote.changePct > 0)
      .map(quote => ({ ...rosterMap.get(quote.playerId)!, value: quote.changePct!, games: null, note: note(quote.playerId) }))
      .sort((a, b) => b.value - a.value || stable(a, b)).slice(0, 3);
    watch = { basis: rows.length ? 'market' : 'unavailable', label: 'Rising value · change from previous price snapshot', rows,
      message: rows.length ? 'Preseason market movement, not observed performance or a weekly point projection. Snapshot intervals vary.' : 'No positive roster price changes with a known baseline are available. No watch picks are invented.' };
  } else if (active && currentWeek !== null && sources?.formSeason === season) {
    const rows = roster.filter(player => available(player.id)).flatMap(player => {
      const form = sources.form[player.id];
      return form && form.fppg !== null && Number.isFinite(form.fppg) && Number.isSafeInteger(form.games) && form.games >= 2
        ? [{ ...player, value: form.fppg, games: form.games, note: note(player.id) }] : [];
    }).sort((a, b) => b.value - a.value || stable(a, b)).slice(0, 3);
    watch = { basis: rows.length ? 'form' : 'unavailable', label: 'On form · in-season EMA fantasy points per game', rows,
      message: rows.length ? 'EMA across the shown number of observed games; not a this-week score projection. Schedule adjustment is unavailable.' : 'Not enough verified current-season games for a form watch list; at least two are required.' };
  }
  const result: TeamPlayerGuide = { season, currentWeek, previousWeek, watch, best: [], rough: [], eligiblePlayed: 0,
    recapMessage: !active ? 'No active weekly recap in this season phase.' : previousWeek === null ? 'No completed previous fantasy week in this season.' : 'Verified player-level weekly points and games played are unavailable. No best or rough-week ranking is inferred.',
    period: previousWeek === null ? `${season} · no previous scoring week` : `${season} · Week ${previousWeek}`, coverage: 'No-game, missing participation and unknown scores are excluded; absence is never poor performance.' };
  const observed = sources?.completedWeek;
  if (!active || previousWeek === null || !observed || !observed.complete || observed.season !== season
    || observed.teamId !== teamId || observed.week !== previousWeek) return result;
  const start = Date.parse(observed.startsAt), end = Date.parse(observed.endsAt), now = Date.parse(input.now);
  if (![start, end, now].every(Number.isFinite) || start >= end || end > now) return result;
  const unique = new Set<string>();
  const played = observed.players.flatMap(row => {
    if (!rosterMap.has(row.playerId) || unique.has(row.playerId) || row.fantasyPoints === null || !Number.isFinite(row.fantasyPoints)
      || row.gamesPlayed === null || !Number.isSafeInteger(row.gamesPlayed) || row.gamesPlayed < 1) return [];
    unique.add(row.playerId);
    return [{ ...rosterMap.get(row.playerId)!, value: row.fantasyPoints, games: row.gamesPlayed,
      note: row.injuryNote ?? (row.gamesPlayed === 1 ? 'One recorded game · small sample' : 'Recorded weekly fantasy points') }];
  });
  result.best = [...played].sort((a, b) => b.value - a.value || stable(a, b)).slice(0, 3);
  result.rough = [...played].sort((a, b) => a.value - b.value || stable(a, b)).slice(0, 3);
  result.eligiblePlayed = played.length;
  result.period = `${season} · Week ${previousWeek} · ${observed.startsAt.slice(0, 10)} to ${observed.endsAt.slice(0, 10)} (end exclusive)`;
  result.recapMessage = played.length ? 'Actual recorded fantasy points for current roster players with verified participation in the completed source week.' : 'No roster players have verified games and recorded points in this completed week.';
  result.coverage = `${played.length} current roster players have verified games. DNP, no-game and unknown records are excluded.${played.length < 6 ? ' These small-cohort lists may overlap; no additional players are inferred.' : ''}`;
  return result;
}
