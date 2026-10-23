/**
 * Regenerate the pinned #217 reconstruction inputs under
 * data/reconstruction/ from their committed sources, and record the
 * resulting artifact manifest (datasetId + hashes). Offline only: no
 * fetches, no credentials, no database. Deterministic — rerunning on
 * unchanged sources rewrites byte-identical files.
 *
 *   npm run price-history:inputs
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createPriceHistoryArtifact, validatePriceHistoryArtifact } from "../src/data/price-history-artifact";
import type { ReconstructionInput } from "../src/domain/price-history-import";
import {
  buildReconstructionConfig, deriveDirectoryProjection, deriveDraftPicks, deriveSeasonHistory,
} from "./lib/reconstruction-inputs";

const readJson = (path: string) => JSON.parse(readFileSync(resolve(path), "utf8"));
const writeJson = (path: string, value: unknown) => writeFileSync(resolve(path), `${JSON.stringify(value, null, 1)}\n`);

const gamelog = readJson("data/gamelog_mapped.json");
const directorySnapshot = readJson("data/sleeper_players.json");
const draftReceipts = ["2025", "2026"].map(season => ({
  draft: readJson(`src/test/fixtures/roster-replay/season-${season}-draft.json`),
  picks: readJson(`src/test/fixtures/roster-replay/season-${season}-draft-picks.json`),
}));

const directory = deriveDirectoryProjection(directorySnapshot, Object.keys(gamelog.players));
const seasonHistory = deriveSeasonHistory(gamelog.players);
const draftPicks = deriveDraftPicks(draftReceipts);
const config = buildReconstructionConfig();

writeJson("data/reconstruction/directory.json", directory);
writeJson("data/reconstruction/season-history.json", seasonHistory);
writeJson("data/reconstruction/draft-picks.json", draftPicks);
writeJson("data/reconstruction/inputs.json", config);

const input: ReconstructionInput = {
  directorySeason: config.directorySeason,
  currentSeasonStartYear: config.currentSeasonStartYear,
  directory,
  players: gamelog.players,
  seasonHistory,
  draftPicks,
};
const modelCodeHash = createHash("sha256")
  .update(readFileSync(resolve("src/data/transform.ts")))
  .update(readFileSync(resolve("src/data/reconstruct-price-history.ts")))
  .digest("hex");
const artifact = createPriceHistoryArtifact(input, config.source, modelCodeHash);
validatePriceHistoryArtifact(artifact);

const manifest = {
  datasetId: artifact.manifest.datasetId,
  inputHash: artifact.manifest.inputHash,
  pointsHash: artifact.manifest.pointsHash,
  modelVersion: artifact.manifest.modelVersion,
  reconstructionVersion: artifact.manifest.reconstructionVersion,
  modelCodeHash: artifact.manifest.modelCodeHash,
  rows: artifact.manifest.rows,
  players: artifact.manifest.players,
  gamelogPoints: artifact.points.filter(p => p.source === "gamelog").length,
  backtestPoints: artifact.points.filter(p => p.source === "backtest").length,
  generatedBy: "scripts/prepare-reconstruction-inputs.ts (npm run price-history:inputs)",
  inputs: {
    gamelog: "data/gamelog_mapped.json",
    directorySource: "data/sleeper_players.json",
    draftReceipts: "src/test/fixtures/roster-replay/season-{2025,2026}-draft{,-picks}.json",
  },
};
writeJson("data/reconstruction/manifest.json", manifest);
console.log(JSON.stringify(manifest, null, 2));
