/** Offline preparation only. No fetches, credentials, or database writes. */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createPriceHistoryArtifact } from "../src/data/price-history-artifact";
import type { ReconstructionInput } from "../src/domain/price-history-import";

const [configPath, outputPath] = process.argv.slice(2);
if (!configPath || !outputPath) throw new Error("Usage: npm run price-history:prepare -- inputs.json candidate.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));
const read = (path: string) => JSON.parse(readFileSync(resolve(dirname(configPath), path), "utf8"));
const input: ReconstructionInput = {
  directorySeason: config.directorySeason,
  currentSeasonStartYear: config.currentSeasonStartYear,
  directory: read(config.directoryPath),
  players: read(config.gamelogPath).players,
  seasonHistory: read(config.seasonHistoryPath),
  draftPicks: read(config.draftPicksPath),
};
const codeHash = createHash("sha256").update(readFileSync(resolve("src/data/transform.ts")))
  .update(readFileSync(resolve("src/data/reconstruct-price-history.ts"))).digest("hex");
const artifact = createPriceHistoryArtifact(input, config.source, codeHash);
writeFileSync(outputPath, JSON.stringify(artifact));
console.log(JSON.stringify(artifact.manifest, null, 2));
