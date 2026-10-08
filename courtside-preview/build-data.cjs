/* Run from the repo root after dependencies are installed. No API requests. */
const { execFileSync } = require("node:child_process");
const { writeFileSync, readFileSync } = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const tsc = process.env.CLUBHOUSE_TSC || path.join(root, "node_modules/.bin/tsc");
execFileSync(tsc, ["src/data/weekly-spotlight.ts", "src/data/clubhouse-directory.ts", "--outDir", "courtside-preview/generated", "--target", "ES2020", "--module", "commonjs", "--skipLibCheck", "--strict"], { cwd: root, stdio: "inherit" });
const { weeklyEditions } = require("./generated/data/weekly-spotlight.js");
const { clubhouseDirectory } = require("./generated/data/clubhouse-directory.js");
const snapshot = JSON.parse(readFileSync(path.join(__dirname, "league-snapshot.json"), "utf8"));
for (const edition of weeklyEditions) {
  const picks = edition.playerSpotlights;
  if (picks.length && (picks.length !== 3 || new Set(picks.map((pick) => pick.role)).size !== 3)) throw new Error("An edition must have all three distinct editorial roles.");
  for (const pick of picks) {
    if (!clubhouseDirectory.find((entry) => entry.identity.id === pick.teamId)?.players.some((player) => player.id === pick.playerId)) throw new Error("A weekly pick has the wrong roster owner.");
  }
}
for (const entry of clubhouseDirectory) {
  if (!entry.featuredPlayerIds.every((id) => entry.players.some((p) => p.id === id))) throw new Error("An editorial anchor is not owned by its stated team.");
  if (entry.opener && !clubhouseDirectory.some((e) => e.identity.id === entry.opener.opponentId)) throw new Error("An opener points to an unknown team.");
}
writeFileSync(path.join(__dirname, "data.js"), `window.CLUBHOUSE_DATA=${JSON.stringify({ weeklyEditions, snapshot, clubhouseDirectory })};\n`);
console.log(`Built ${weeklyEditions.length} editorial drafts and ${snapshot.teams.length} teams.`);
