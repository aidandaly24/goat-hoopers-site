import { personalizedFixture } from "./personalized-home-fixture";
import { parseWeeklyEvidenceReceipt } from "@/data/weekly-player-evidence";

/** Fully synthetic receipt, identities and points for offline interaction checks. */
export function weeklyHomeFixture() {
  const fixture = personalizedFixture();
  fixture.home.checkedAt = "2026-10-27T12:00:00Z";
  fixture.home.directory.forEach(entry => { if (entry.currentMatchup) entry.currentMatchup.week = 2; });
  const receipt = parseWeeklyEvidenceReceipt({
    season: "2026", week: 1, startsAt: "2026-10-20T19:00:00Z", endsAt: "2026-10-26T23:00:00Z",
    generatedAt: "2026-10-27T01:00:00Z", generator: "synthetic-fixture", source: "Synthetic offline evidence only",
    teams: fixture.home.directory.map((entry, index) => {
      const residual = [0, 5, 7].includes(index) ? 2 : index === 8 ? 26 : 0;
      const players = entry.players.map((player, i) => ({ playerId: player.id,
        countedPoints: [30 + index, 0, null, 5][i], gamesPlayed: [3, 1, 0, 2][i],
        countedGameId: i === 2 ? null : `synthetic-game-${index}-${i}`, locked: i < 2 }));
      const computedPoints = 35 + index;
      return { teamId: entry.identity.id, computedPoints, officialPoints: computedPoints - residual, residual,
        status: residual === 0 ? "verified" : residual <= 4 ? "estimated-foul-residual" : "unreconciled",
        evidenceComplete: true, players };
    }),
  });
  if (!receipt) throw new Error("Invalid synthetic weekly receipt");
  return { ...fixture, receipt };
}
