import { createHash } from "node:crypto";
import type { PriceHistoryArtifact, ReconstructionInput } from "../domain/price-history-import";
import { calendarDate, reconstructPriceHistory } from "./reconstruct-price-history";

/** Stable hashing makes equivalent frozen inputs reproducible. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value != null && typeof value === "object") return `{${Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  return JSON.stringify(value);
}
export const contentHash = (value: unknown) => createHash("sha256").update(canonicalJson(value)).digest("hex");

/** Bind all published audit metadata to the reviewed dataset ID, excluding only the ID itself. */
export function artifactDatasetId(manifest: Omit<PriceHistoryArtifact["manifest"], "datasetId"> & { datasetId?: string }): string {
  const reviewed = { ...manifest };
  delete reviewed.datasetId;
  return contentHash(reviewed);
}

export function createPriceHistoryArtifact(input: ReconstructionInput,
  source: PriceHistoryArtifact["manifest"]["source"], modelCodeHash: string): PriceHistoryArtifact {
  if (!source?.description || !source.revision || !source.scoring || !Object.keys(source.scoring).length || !Array.isArray(source.limitations)) {
    throw new Error("Source description, frozen revision and scoring are required");
  }
  const points = reconstructPriceHistory(input);
  const inputHash = contentHash({ input, source });
  const pointsHash = contentHash(points);
  const manifest: Omit<PriceHistoryArtifact["manifest"], "datasetId"> = {
    modelVersion: "v2", reconstructionVersion: "2", modelCodeHash, inputHash,
    pointsHash, source,
    directorySeason: input.directorySeason, currentSeasonStartYear: input.currentSeasonStartYear,
    rows: points.length, players: new Set(points.map(p => p.playerId)).size,
    assumptions: ["Current v2 model applied retrospectively; not observed site prices",
      "Historical sentiment and injury are neutral", "Calendar game dates at 00:00 UTC, after-game prices",
      "Missing early career minutes use the frozen experience prior", "Yearly fallback uses completed-season totals and estimated 30 minutes/game",
      ...source.limitations],
  };
  return { manifest: { ...manifest, datasetId: artifactDatasetId(manifest) }, points };
}

export function validatePriceHistoryArtifact(artifact: PriceHistoryArtifact): void {
  const m = artifact.manifest;
  if (m?.modelVersion !== "v2" || m.reconstructionVersion !== "2" || !artifact.points?.length ||
      !m.source?.description || !m.source.revision || !Array.isArray(m.source.limitations) ||
      !Object.values(m.source.scoring ?? {}).length || Object.values(m.source.scoring).some(n => !Number.isFinite(n)) ||
      artifact.points.some(p => !["gamelog", "backtest"].includes(p.source) || !Number.isInteger(p.priceCents) || p.priceCents < 100 || p.priceCents > 25000) ||
      m.rows !== artifact.points.length || m.players !== new Set(artifact.points.map(p => p.playerId)).size ||
      m.pointsHash !== contentHash(artifact.points) || m.datasetId !== artifactDatasetId(m)) {
    throw new Error("Invalid or changed reconstruction artifact");
  }
  const keys = artifact.points.map(p => `${p.playerId}|${p.date}|${p.source}`);
  if (new Set(keys).size !== keys.length) throw new Error("Duplicate artifact points");
  for (const p of artifact.points) {
    const y = Number(p.season.slice(0, 4));
    if (!p.playerId || /[|\n]/.test(p.playerId) || p.date !== calendarDate(p.date) ||
        p.season !== `${y}-${String(y + 1).slice(2)}` ||
        p.date < calendarDate(`${y}-07-01`) || p.date >= calendarDate(`${y + 1}-07-01`)) throw new Error("Invalid artifact date or season");
  }
}
