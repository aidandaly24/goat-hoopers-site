/**
 * #217 Stage 2 modeled backfill runner — OFFLINE package builder.
 *
 * Builds the reconstruction artifact from the pinned inputs under
 * data/reconstruction/, verifies it is the dataset the committed
 * manifest pins, composes the modeled team-value series from a
 * membership snapshot of the roster replay, and writes ONE local JSON
 * package. It imports no database module, writes nothing to any
 * database, and applies nothing anywhere: publishing the package is a
 * separate, explicitly approved step that this script is not part of.
 *
 * Usage:
 *   npm run backfill:modeled -- \
 *     --config=data/reconstruction/inputs.json \
 *     --membership=data/reconstruction/membership.json \
 *     --recorded-inventory=data/reconstruction/recorded-inventory.json \
 *     --out=modeled-backfill-package.json \
 *     [--manifest=data/reconstruction/manifest.json] \
 *     [--from=YYYY-MM-DD] [--through=YYYY-MM-DD]
 *
 * --membership and --recorded-inventory are REQUIRED (fail-closed).
 * The membership snapshot is the roster replay's evidence exported to
 * a file (see modeled-backfill-export.test.ts for its regeneration);
 * the recorded inventory lists the team-days the recorded lane admits,
 * and modeled points are emitted only where it admits nothing. Running
 * without either is refused, so a future window that overlaps recorded
 * coverage can never silently emit modeled points over recorded days.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createPriceHistoryArtifact, validatePriceHistoryArtifact } from "../src/data/price-history-artifact";
import type { ReconstructionInput } from "../src/domain/price-history-import";
import {
  assertMembershipSnapshot, assertModeledDataset, buildModeledBackfillPackage,
  buildModeledPlayerTimelines, buildModeledTeamPoints, computeRecordedAdmissionHash,
  endOfDay, parseRecordedInventory,
  type MembershipSnapshot,
} from "../src/data/modeled-backfill";

function arg(name: string): string | null {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find(a => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}
function requiredArg(name: string): string {
  const value = arg(name);
  if (!value) throw new Error(`--${name}=<path> is required (fail-closed: no defaults for run inputs)`);
  return value;
}
const readJson = (path: string) => JSON.parse(readFileSync(resolve(path), "utf8"));

const configPath = requiredArg("config");
const membershipPath = requiredArg("membership");
const inventoryPath = requiredArg("recorded-inventory");
const outPath = requiredArg("out");
const manifestPath = arg("manifest") ?? "data/reconstruction/manifest.json";

const config = readJson(configPath);
const configDir = dirname(resolve(configPath));
const readInput = (path: string) => JSON.parse(readFileSync(resolve(configDir, path), "utf8"));
const input: ReconstructionInput = {
  directorySeason: config.directorySeason,
  currentSeasonStartYear: config.currentSeasonStartYear,
  directory: readInput(config.directoryPath),
  players: readInput(config.gamelogPath).players,
  seasonHistory: readInput(config.seasonHistoryPath),
  draftPicks: readInput(config.draftPicksPath),
};
const modelCodeHash = createHash("sha256")
  .update(readFileSync(resolve("src/data/transform.ts")))
  .update(readFileSync(resolve("src/data/reconstruct-price-history.ts")))
  .digest("hex");
const artifact = createPriceHistoryArtifact(input, config.source, modelCodeHash);
validatePriceHistoryArtifact(artifact);
assertModeledDataset(artifact, readJson(manifestPath).datasetId);

// Both offline inputs are validated before anything is composed:
// the snapshot's structure (canonical days, unique teams, no
// duplicated member in a team-day) and its claimed membership hash
// against its actual dated content; the inventory's canonical days,
// known teams, freedom from duplicate entries, and — when the file
// carries one — its claimed admission hash against the validated
// set. Malformed input rejects the run — it is never normalized
// away. The validated admission set's own hash is computed here and
// bound into the package and generation: suppression is part of
// the effective series, so it is part of the series' identity.
const snapshot = readJson(membershipPath) as MembershipSnapshot;
assertMembershipSnapshot(snapshot);
const admitted = parseRecordedInventory(readJson(inventoryPath), snapshot.teamIds);
const recordedAdmissionHash = computeRecordedAdmissionHash(admitted);

const range = {
  fromDay: arg("from") ?? snapshot.range.fromDay,
  throughDay: arg("through") ?? snapshot.range.throughDay,
};
const seasons = artifact.points.map(p => Number(p.season.slice(0, 4)));
const built = buildModeledPlayerTimelines(artifact, {
  from: `${Math.min(...seasons)}-07-01T00:00:00.000Z`,
  asOf: endOfDay(range.throughDay),
});
const result = buildModeledTeamPoints({
  built,
  datasetId: artifact.manifest.datasetId,
  modelVersion: artifact.manifest.modelVersion,
  membershipOnDay: (rosterId, day) => {
    const playerIds = snapshot.days[String(rosterId)]?.[day];
    return playerIds ? { playerIds } : null;
  },
  recordedAdmits: (teamId, day) => admitted.has(`${teamId}|${day}`),
  teamIds: snapshot.teamIds,
  range,
  seasonTwoFromDay: snapshot.seasonTwoFromDay,
});
const pkg = buildModeledBackfillPackage({
  artifact,
  rosterEvidenceHash: snapshot.rosterEvidenceHash,
  membershipHash: snapshot.membershipHash,
  recordedAdmissionHash,
  range,
  result,
});

mkdirSync(dirname(resolve(outPath)), { recursive: true });
writeFileSync(resolve(outPath), `${JSON.stringify(pkg, null, 1)}\n`);
console.log(JSON.stringify({
  datasetId: pkg.datasetId, generation: pkg.generation,
  recordedAdmissionHash: pkg.recordedAdmissionHash, range: pkg.range,
  diagnostics: pkg.diagnostics,
  pricedPlayerDays: pkg.points.reduce((n, entry) => n + entry.point.priced, 0),
  out: outPath,
}, null, 2));
