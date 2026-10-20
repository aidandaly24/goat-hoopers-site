/** Offline source evaluation only. No fetch, DB, quote computation or runtime caller. */
export type BoxScoreAuditEvent = {
  id: string;
  scheduledStart: string;
  completed: boolean;
  teams: {
    id: string;
    penaltyTotals: Record<string, string | undefined>;
    statKeys: string[];
    athletes: { id: string; name: string; didNotPlay?: boolean; stats?: string[] | null }[];
  }[];
  selectedPlays: {
    id: string; typeId: string; typeText: string; teamId?: string | null;
    athleteIds: string[]; wallclock?: string | null;
  }[];
};

export type BoxScoreAuditIdentity = { sleeperId: string; espnId: string };
export type BoxScoreAuditRow = {
  eventId: string; teamId: string; espnId: string; name: string;
  participation: "played" | "dnp" | "unknown";
  existingSleeperId: string | null; candidateSleeperId: string | null;
  /** Source event lower bound, NOT proof that the provider published this row then. */
  eventCutoff: string | null;
  minutes: number | null;
  minutesPrecision: "displayed";
  statistics: Record<string, number>;
  missingScoring: string[];
  knownFantasyPoints: number | null;
  fantasyPoints: number | null;
  eligibleWithExistingMap: boolean;
  penaltyPlayIds: string[];
  issues: string[];
};

const count = (raw: string | undefined): number | null => {
  if (raw === undefined || !/^(?:0|[1-9]\d*)$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
};
const instant = (raw: string | null | undefined): number | null => {
  if (!raw || !/^\d{4}-\d{2}-\d{2}T\d{2}:[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?Z$/.test(raw)) return null;
  const value = Date.parse(raw);
  return Number.isFinite(value) && new Date(value).toISOString().slice(0, 16) === raw.slice(0, 16) ? value : null;
};
const uniqueId = (rows: readonly BoxScoreAuditIdentity[], id: string): string | null => {
  const matches = new Set(rows.filter(row => row.espnId === id).map(row => row.sleeperId));
  return matches.size === 1 ? [...matches][0] : null;
};

function readStatistics(keys: string[], values: string[] | null | undefined) {
  const statistics: Record<string, number> = {};
  const issues: string[] = [];
  let minutes: number | null = null;
  if (!values || values.length !== keys.length || new Set(keys).size !== keys.length) {
    return { statistics, minutes, issues: ["missing_or_ambiguous_stat_columns"] };
  }
  const columns = new Map(keys.map((key, index) => [key, values[index]]));
  for (const [source, target] of [["points", "pts"], ["rebounds", "reb"], ["assists", "ast"],
    ["turnovers", "to"], ["steals", "stl"], ["blocks", "blk"]]) {
    const value = count(columns.get(source));
    if (value !== null) statistics[target] = value;
  }
  const threes = columns.get("threePointFieldGoalsMade-threePointFieldGoalsAttempted")?.match(/^(\d+)-(\d+)$/);
  if (threes && Number(threes[1]) <= Number(threes[2]) && Number.isSafeInteger(Number(threes[2]))) {
    statistics.tpm = Number(threes[1]);
  }
  const rawMinutes = columns.get("minutes");
  if (rawMinutes && /^\d+(?:\.\d+)?$/.test(rawMinutes)) minutes = Number(rawMinutes);
  else if (rawMinutes && /^\d+:[0-5]\d$/.test(rawMinutes)) {
    const [m, s] = rawMinutes.split(":").map(Number); minutes = m + s / 60;
  }
  if (minutes === null || !Number.isFinite(minutes)) { minutes = null; issues.push("minutes_unavailable"); }
  const categories = ["pts", "reb", "ast", "stl", "blk"];
  if (categories.every(key => key in statistics)) {
    const doubles = categories.filter(key => statistics[key] >= 10).length;
    statistics.dd = Number(doubles >= 2);
    statistics.td = Number(doubles >= 3);
  }
  if ("pts" in statistics) {
    statistics.bonus_pt_40p = Number(statistics.pts >= 40);
    statistics.bonus_pt_50p = Number(statistics.pts >= 50);
  }
  if ("ast" in statistics) statistics.bonus_ast_15p = Number(statistics.ast >= 15);
  if ("reb" in statistics) statistics.bonus_reb_20p = Number(statistics.reb >= 20);
  return { statistics, minutes, issues };
}

/** Resolve only explicit zero totals or fully reconciled, structured offender IDs.
 * Names, a technical free-throw shooter and an unassigned coach event are never
 * used to infer player penalties. Unsupported foul types preserve missingness. */
function penalties(event: BoxScoreAuditEvent, team: BoxScoreAuditEvent["teams"][number], kind: "tf" | "ff") {
  const relevant = event.selectedPlays.filter(play => kind === "tf"
    ? play.typeId === "35" || /technical foul/i.test(play.typeText)
    : play.typeId === "32" || /flagrant foul/i.test(play.typeText));
  const teamPlays = relevant.filter(play => !play.teamId || play.teamId === team.id);
  const expected = count(team.penaltyTotals[kind === "tf" ? "totalTechnicalFouls" : "flagrantFouls"]);
  const technical = kind === "tf" ? count(team.penaltyTotals.technicalFouls) : expected;
  const counts = new Map<string, number>();
  const members = new Set(team.athletes.map(row => row.id));
  const valid = expected !== null && technical === expected && teamPlays.length === expected
    && teamPlays.every(play => play.teamId === team.id && play.athleteIds.length === 1
      && members.has(play.athleteIds[0]) && (kind === "tf"
        ? play.typeId === "35" && play.typeText === "Technical Foul"
        : play.typeId === "32" && play.typeText === "Flagrant Foul Type 1"));
  if (valid) for (const play of teamPlays) counts.set(play.athleteIds[0], (counts.get(play.athleteIds[0]) ?? 0) + 1);
  return { counts, valid, playIds: teamPlays.map(play => play.id) };
}

export function auditTeamHistoryBoxScore(event: BoxScoreAuditEvent, options: {
  scoring: Readonly<Record<string, number>>;
  existingIdentities: readonly BoxScoreAuditIdentity[];
  candidateIdentities?: readonly BoxScoreAuditIdentity[];
}): BoxScoreAuditRow[] {
  if (Object.values(options.scoring).some(value => !Number.isFinite(value))) throw new Error("Invalid scoring weights");
  const issues: string[] = [];
  const ends = event.selectedPlays.filter(play => play.typeId === "402" && play.typeText === "End Game");
  const start = instant(event.scheduledStart), end = ends.length === 1 ? instant(ends[0].wallclock) : null;
  let eventCutoff = event.completed && start !== null && end !== null && end >= start ? new Date(end).toISOString() : null;
  if (!eventCutoff) issues.push("completed_game_cutoff_unverified");
  const playIds = event.selectedPlays.map(play => play.id);
  const athleteIds = event.teams.flatMap(team => team.athletes.map(row => row.id));
  if (new Set(playIds).size !== playIds.length || new Set(athleteIds).size !== athleteIds.length
    || new Set(event.teams.map(team => team.id)).size !== event.teams.length) {
    issues.push("duplicate_source_ids"); eventCutoff = null;
  }
  if (end !== null && event.selectedPlays.some(play => (instant(play.wallclock) ?? end) > end)) {
    issues.push("event_after_final_cutoff"); eventCutoff = null;
  }
  return event.teams.flatMap(team => {
    const tf = penalties(event, team, "tf"), ff = penalties(event, team, "ff");
    return team.athletes.map(athlete => {
      const rowIssues = [...issues];
      const participation = athlete.didNotPlay === true ? "dnp" : athlete.didNotPlay === false ? "played" : "unknown";
      const existingSleeperId = uniqueId(options.existingIdentities, athlete.id);
      const candidateSleeperId = uniqueId(options.candidateIdentities ?? [], athlete.id);
      if (!existingSleeperId) rowIssues.push("existing_identity_unresolved");
      const result = participation === "played" ? readStatistics(team.statKeys, athlete.stats)
        : { statistics: {} as Record<string, number>, minutes: null, issues: [participation === "dnp" ? "did_not_play" : "participation_unknown"] };
      rowIssues.push(...result.issues);
      if (participation === "played") {
        if (tf.valid) result.statistics.tf = tf.counts.get(athlete.id) ?? 0;
        if (ff.valid) result.statistics.ff = ff.counts.get(athlete.id) ?? 0;
      }
      const scoring = Object.entries(options.scoring).filter(([, weight]) => weight !== 0);
      const missingScoring = scoring.filter(([key]) => !(key in result.statistics)).map(([key]) => key).sort();
      const cents = Math.round(scoring.reduce((sum, [key, weight]) => sum + (result.statistics[key] ?? 0) * weight, 0) * 100);
      if (!Number.isSafeInteger(cents)) rowIssues.push("unsafe_scoring_total");
      const knownFantasyPoints = participation === "played" && Number.isSafeInteger(cents) && scoring.some(([key]) => key in result.statistics)
        ? cents / 100 : null;
      const fantasyPoints = participation === "played" && missingScoring.length === 0 && eventCutoff !== null ? knownFantasyPoints : null;
      return { eventId: event.id, teamId: team.id, espnId: athlete.id, name: athlete.name,
        participation, existingSleeperId, candidateSleeperId, eventCutoff,
        minutes: result.minutes, minutesPrecision: "displayed" as const,
        statistics: result.statistics, missingScoring, knownFantasyPoints, fantasyPoints,
        eligibleWithExistingMap: fantasyPoints !== null && existingSleeperId !== null && result.minutes !== null,
        penaltyPlayIds: [...tf.playIds, ...ff.playIds], issues: rowIssues };
    });
  });
}

/** Retrospective event eligibility only; never implies a recorded quote existed. */
export function gameInputsPrecede(row: Pick<BoxScoreAuditRow, "eventCutoff">, asOf: string): boolean {
  const cutoff = instant(row.eventCutoff), at = instant(asOf);
  return cutoff !== null && at !== null && cutoff <= at;
}
