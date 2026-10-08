import { createHash } from "node:crypto";
import type { ExistingHistoryPoint, PriceHistoryArtifact, PriceHistoryPublicationPlan } from "../domain/price-history-import";
import { contentHash, validatePriceHistoryArtifact } from "./price-history-artifact";

const reconstructed = (p: { source: string }) => p.source === "gamelog" || p.source === "backtest";
const key = (p: { playerId: string; date: string; source: string }) => `${p.playerId}|${p.date}|${p.source}`;
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

/** Matches Postgres md5/string_agg with explicit UTC and C ordering. Drift check, not an approval signature. */
export function reconstructedFingerprint(rows: ExistingHistoryPoint[]): string {
  const ordered = rows.filter(reconstructed).sort((a, b) => compare(a.playerId, b.playerId) || compare(a.date, b.date) || compare(a.source, b.source));
  return createHash("md5").update(ordered.map(p => `${p.playerId}|${p.date}|${p.priceCents}|${p.source}|${p.season}\n`).join("")).digest("hex");
}

export function createPublicationPlan(backup: ExistingHistoryPoint[], candidate: PriceHistoryArtifact): PriceHistoryPublicationPlan {
  validatePriceHistoryArtifact(candidate);
  for (const p of backup) {
    if (!p.id || !p.playerId || /[|\n]/.test(p.playerId + p.source + p.season) || !Number.isInteger(p.priceCents) ||
        new Date(p.date).toISOString() !== p.date) throw new Error("Invalid backup row; export UTC ISO dates and retain IDs");
  }
  const previous = backup.filter(reconstructed);
  const old = new Map(previous.map(p => [key(p), p]));
  if (old.size !== previous.length) throw new Error("Backup contains duplicate natural keys; review before migration");
  let added = 0, removed = 0, repriced = 0, relabeled = 0, unchanged = 0;
  const nextKeys = new Set(candidate.points.map(key));
  for (const p of candidate.points) {
    const prior = old.get(key(p));
    if (!prior) added++;
    else {
      if (prior.priceCents !== p.priceCents) repriced++;
      if (prior.season !== p.season) relabeled++;
      if (prior.priceCents === p.priceCents && prior.season === p.season) unchanged++;
    }
  }
  for (const p of previous) if (!nextKeys.has(key(p))) removed++;
  const groups = (rows: Array<{ source: string; season: string }>) => rows.reduce<Record<string, number>>((out, p) => {
    const group = `${p.source}|${p.season}`; out[group] = (out[group] ?? 0) + 1; return out;
  }, {});
  return { candidateDatasetId: candidate.manifest.datasetId, backupHash: contentHash(backup),
    reconstructedFingerprint: reconstructedFingerprint(backup), replacedRows: previous.length,
    candidateRows: candidate.points.length, preservedRows: backup.length - previous.length,
    added, removed, repriced, relabeled, unchanged, before: groups(previous), after: groups(candidate.points) };
}

export function validatePublicationPlan(plan: PriceHistoryPublicationPlan, candidate: PriceHistoryArtifact): void {
  if (plan.candidateDatasetId !== candidate.manifest.datasetId || plan.candidateRows !== candidate.points.length ||
      !/^[a-f0-9]{64}$/.test(plan.backupHash) || !/^[a-f0-9]{32}$/.test(plan.reconstructedFingerprint) ||
      !Number.isInteger(plan.replacedRows) || plan.replacedRows < 0) throw new Error("Invalid or mismatched publication plan");
}
