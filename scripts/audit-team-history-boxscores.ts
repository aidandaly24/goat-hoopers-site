/** Bounded, offline-only audit of frozen public samples. No network or DB. */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { auditTeamHistoryBoxScore, type BoxScoreAuditEvent } from "../src/data/team-history-boxscore-audit";

const read = (file: string) => JSON.parse(readFileSync(file, "utf8"));
const hash = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
const root = "data/team-history-audit/";
const samples = read(`${root}samples.json`) as { events: BoxScoreAuditEvent[] };
const identities = read(`${root}identity-candidates.json`);
if (identities.existingMapSha256 !== hash("src/data/espn-id-map.json") || identities.directorySha256 !== hash("data/sleeper_players.json")) {
  throw new Error("Frozen mapping inputs changed; re-audit rather than silently changing the sample join");
}
const directory = read("data/sleeper_players.json");
for (const candidate of identities.candidates) {
  const row = directory[candidate.sleeperId];
  const matching = Object.values(directory).filter((entry: unknown) => {
    const person = entry as { full_name?: string; birth_date?: string };
    return person.full_name === candidate.name && person.birth_date === candidate.birthDate;
  });
  if (row?.full_name !== candidate.name || row?.birth_date !== candidate.birthDate || matching.length !== 1) throw new Error("Identity candidate is no longer a unique name/DOB match");
}
if (new Set(samples.events.map(event => event.id)).size !== samples.events.length) throw new Error("Duplicate sampled event");
const map = read("src/data/espn-id-map.json") as Record<string, string>;
const existingIdentities = Object.entries(map).map(([sleeperId, espnId]) => ({ sleeperId, espnId }));
const rows = samples.events.flatMap(event => auditTeamHistoryBoxScore(event, {
  scoring: read(`${root}scoring.json`).scoring, existingIdentities, candidateIdentities: identities.candidates,
}));
const played = rows.filter(row => row.participation === "played");
const report = { policy: "boxscore-feasibility-v1; offline samples only, not quotes or a full-season reconstruction",
  inputs: Object.fromEntries([`${root}samples.json`, `${root}scoring.json`, `${root}identity-candidates.json`, "src/data/espn-id-map.json"].map(file => [file, hash(file)])),
  events: samples.events.length, rows: rows.length, played: played.length, dnp: rows.filter(row => row.participation === "dnp").length,
  mappedWithExistingIds: played.filter(row => row.existingSleeperId !== null).length,
  mappingCandidatesOnly: played.filter(row => row.existingSleeperId === null && row.candidateSleeperId !== null).length,
  fullyScored: played.filter(row => row.fantasyPoints !== null).length,
  incompleteScoring: played.filter(row => row.fantasyPoints === null).length,
  eligibleWithExistingMap: played.filter(row => row.eligibleWithExistingMap).length, auditRows: rows };
const target = process.argv[2];
if (target) writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`);
else console.log(JSON.stringify(report, null, 2));
