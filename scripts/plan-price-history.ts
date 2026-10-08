/** Read-only comparison of a retained JSON export with an offline candidate. */
import { readFileSync, writeFileSync } from "node:fs";
import { createPublicationPlan } from "../src/data/price-history-plan";
const [backupPath, candidatePath, outputPath] = process.argv.slice(2);
if (!backupPath || !candidatePath || !outputPath) throw new Error("Usage: npm run price-history:plan -- backup.json candidate.json plan.json");
const plan = createPublicationPlan(JSON.parse(readFileSync(backupPath, "utf8")), JSON.parse(readFileSync(candidatePath, "utf8")));
writeFileSync(outputPath, JSON.stringify(plan, null, 2));
console.log(JSON.stringify(plan, null, 2));
