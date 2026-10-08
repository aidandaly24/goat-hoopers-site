/** Explicit import. Default is validation only; application builds never invoke it. */
import { readFileSync } from "node:fs";
import { createImportDb } from "../src/data/db";
import { validatePriceHistoryArtifact } from "../src/data/price-history-artifact";
import { publishReconstructedPoints } from "../src/data/stocks";
import { validatePublicationPlan } from "../src/data/price-history-plan";
import type { PriceHistoryArtifact, PriceHistoryPublicationPlan } from "../src/domain/price-history-import";

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: npm run price-history:import -- candidate.json [--plan=FILE] [--apply --dataset=HASH]");
  const artifact: PriceHistoryArtifact = JSON.parse(readFileSync(file, "utf8"));
  validatePriceHistoryArtifact(artifact);
  console.log(JSON.stringify(artifact.manifest, null, 2));
  const planPath = process.argv.find(a => a.startsWith("--plan="))?.slice("--plan=".length);
  const plan: PriceHistoryPublicationPlan | null = planPath ? JSON.parse(readFileSync(planPath, "utf8")) : null;
  if (plan) { validatePublicationPlan(plan, artifact); console.log(JSON.stringify(plan, null, 2)); }
  if (!process.argv.includes("--apply")) return;
  const expected = process.argv.find(a => a.startsWith("--dataset="))?.slice("--dataset=".length);
  if (expected !== artifact.manifest.datasetId) throw new Error("Explicit reviewed --dataset=HASH is required");
  if (!planPath) throw new Error("A reviewed --plan=FILE bound to the retained backup is required");
  if (!plan) throw new Error("A publication plan is required");
  const url = process.env.PRICE_HISTORY_IMPORT_URL;
  if (!url) throw new Error("Set PRICE_HISTORY_IMPORT_URL for the reviewed target; no DATABASE_URL fallback");
  await publishReconstructedPoints(createImportDb(url), artifact, plan);
  console.log(`Published dataset ${expected} (${artifact.points.length} rows)`);
}
main().catch(() => { console.error("Import failed; publication was not confirmed. Inspect the selected target before retrying."); process.exitCode = 1; });
