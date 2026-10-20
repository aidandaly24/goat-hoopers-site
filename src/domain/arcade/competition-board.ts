import type { CompetitionBoard, PeriodPhase } from "./competition-period";
import type { RankedLeaderboardEntry } from "./ranked-free-throw";
import { choiceGameId, type ChoiceBoardEntry } from "./ranked-game-contract";
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const integer = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
export function decodeCompetitionBoard(value: unknown): CompetitionBoard | null {
  if (!record(value) || typeof value.gameId !== "string" || !/^[a-z0-9-]{1,80}$/.test(value.gameId) ||
    !["weekly", "all-time", "archive"].includes(String(value.kind)) || !["upcoming", "open", "blocked", "final", "held"].includes(String(value.phase)) ||
    !integer(value.asOfMs) || typeof value.label !== "string" || value.label.length > 150 ||
    !(value.periodId === null || typeof value.periodId === "string" && /^[a-z0-9-]{3,80}$/.test(value.periodId)) ||
    typeof value.scoreVersion !== "string" || !/^[a-f0-9]{64}$/.test(value.scoreVersion) || !Array.isArray(value.entries) || value.entries.length > 100) return null;
  if (value.gameId !== "free-throw" && !choiceGameId(value.gameId)) return null;
  const entries: (RankedLeaderboardEntry | ChoiceBoardEntry)[] = [];
  for (const e of value.entries) {
    if (choiceGameId(value.gameId)) {
      if (!record(e) || !integer(e.rank) || e.rank < 1 || !integer(e.score) || !record(e.metric) || !integer(e.achievedAtMs) ||
        typeof e.username !== "string" || !/^[a-z0-9_]{3,20}$/.test(e.username) && e.username !== "Player" || typeof e.isCurrentUser !== "boolean" ||
        !(e.teamId === null || typeof e.teamId === "string" && /^(?:[1-9]|10)$/.test(e.teamId))) return null;
      const m = e.metric;
      if (value.gameId === "week-2-preview" && m.kind === "modeled-record" && integer(m.wins) && integer(m.losses) && m.wins + m.losses === 82 && e.score === m.wins)
        entries.push({ rank: e.rank, score: e.score, username: e.username, teamId: e.teamId, achievedAtMs: e.achievedAtMs, isCurrentUser: e.isCurrentUser, metric: { kind: m.kind, wins: m.wins, losses: m.losses } });
      else if (value.gameId === "priced-in" && m.kind === "price-points" && integer(m.correct) && m.correct <= 5 && m.rounds === 5 && e.score >= m.correct * 100 && e.score <= m.correct * 150)
        entries.push({ rank: e.rank, score: e.score, username: e.username, teamId: e.teamId, achievedAtMs: e.achievedAtMs, isCurrentUser: e.isCurrentUser, metric: { kind: m.kind, correct: m.correct, rounds: 5 } });
      else return null;
      continue;
    }
    if (!record(e) || !integer(e.rank) || e.rank < 1 || !integer(e.score) || !integer(e.makes) || e.score !== e.makes ||
      !integer(e.attempts) || e.attempts < 1 || e.attempts > 100 || e.makes > e.attempts || e.accuracy !== e.makes / e.attempts ||
      !integer(e.longestStreak) || e.longestStreak > e.makes || !integer(e.endingStreak) || e.endingStreak > e.longestStreak ||
      typeof e.username !== "string" || !/^[a-z0-9_]{3,20}$/.test(e.username) && e.username !== "Player" || !integer(e.achievedAtMs) || typeof e.isCurrentUser !== "boolean" ||
      !(e.teamId === null || typeof e.teamId === "string" && /^(?:[1-9]|10)$/.test(e.teamId))) return null;
    entries.push({ rank: e.rank, score: e.score, makes: e.makes, attempts: e.attempts, accuracy: e.accuracy as number,
      longestStreak: e.longestStreak, endingStreak: e.endingStreak, username: e.username, teamId: e.teamId,
      achievedAtMs: e.achievedAtMs, isCurrentUser: e.isCurrentUser });
  }
  return { gameId: value.gameId, kind: value.kind as CompetitionBoard["kind"], label: value.label,
    phase: value.phase as PeriodPhase | "held", asOfMs: value.asOfMs, periodId: value.periodId, scoreVersion: value.scoreVersion, entries };
}
