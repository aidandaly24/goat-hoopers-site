import type { Team } from "@/domain";

// Realistic identity lengths with explicit synthetic managers/results, never live data.
const names = [
  "Reaves Dropper", "Northside Basketball Club", "The Fourth Quarter Comeback Crew",
  "Only Buckets", "Josh Diddy's Roster", "Full Court Friends",
  "The Incredibly Long Basketball Club Name That Must Remain Fully Readable",
  "Bench Mob", "Downtown Hoopers", "Sunday Shootaround",
];
export const directoryTeams: Team[] = names.map((name, index) => ({
  id: String(index + 1), name, managerName: index === 6
    ? "Synthetic manager with a deliberately long display name"
    : `Synthetic Manager ${index + 1}`,
  avatar: null, wins: [14, 13, 12, 11, 10, 9, 8, 7, 2, 0][index],
  losses: [6, 7, 8, 9, 10, 11, 12, 13, 18, 0][index], ties: 0,
  pointsFor: [2384567, 2297810, 2210565, 2184700, 2127395, 2081020, 2039632, 1997760, 1899430, 0][index],
  pointsAgainst: 0,
}));
