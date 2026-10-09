import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

// Frozen parent source; before/after import the same shared primitives/tokens/fonts.
const base = "32794327df2ec8cd3d2b30935c2df51b354f63ca";
await mkdir("qa/teams/.baseline", { recursive: true });
for (const file of ["TeamDirectory.tsx", "TeamDirectory.module.css"]) {
  const source = execFileSync("git", ["show", `${base}:src/surfaces/teams/${file}`]);
  await writeFile(`qa/teams/.baseline/${file}`, source);
}
console.log(`Prepared original directory from ${base}; no data or asset requests.`);
