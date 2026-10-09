import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const base = "92fb446c0e94f2b664bd2f3e5be3e574c2e3641d";
const sourcePath = "src/surfaces/teams/TeamProfile.tsx";
const cssPath = "src/surfaces/teams/TeamProfile.module.css";
const gitFile = file => execFileSync("git", ["show", `${base}:${file}`], { cwd: root, encoding: "utf8" });
const source = gitFile(sourcePath), css = gitFile(cssPath);
const currentSource = await readFile(path.join(root, sourcePath), "utf8");
const currentCss = await readFile(path.join(root, cssPath), "utf8");
const grid = text => text.slice(text.indexOf("<div className={styles.grid}>"));
assert.ok(grid(source).startsWith("<div className={styles.grid}>"));
assert.equal(grid(currentSource), grid(source), "Roster/grid markup is byte-identical to live");
const removedCss = css.slice(css.indexOf("/* Clickable 3D team figurine."), css.indexOf(".identityText"));
assert.ok(removedCss.includes(".hooperStage"));
assert.equal(currentCss, css.replace(removedCss, ""), "Only retired hooper-stage CSS was removed");
// Shared UI primitives/styles are exactly the live versions in both routes.
const files = execFileSync("git", ["ls-tree", "-r", "--name-only", base, "src/ui"], { cwd: root, encoding: "utf8" }).trim().split("\n")
  .filter(file => file !== "src/ui/CourtsideFigurine.module.css");
for (const file of files) assert.equal(await readFile(path.join(root, file), "utf8"), gitFile(file), file);
const originalImport = 'import { HooperViewer } from "@/three/HooperViewer";';
assert.equal(source.split(originalImport).length, 2);
const transformed = source.replace(originalImport, 'import { HooperViewer } from "./DisabledHooper";');
const directory = path.join(root, "qa/live-removal/.baseline");
await mkdir(directory, { recursive: true });
await writeFile(path.join(directory, "TeamProfile.tsx"), transformed);
await writeFile(path.join(directory, "TeamProfile.module.css"), css);
// No import, loader, canvas, renderer or model request can run in this stub.
await writeFile(path.join(directory, "DisabledHooper.tsx"), 'export function HooperViewer(_props: { rosterId: number; teamName: string; ariaLabel?: string }) { return null; }\n');
const sha256 = text => createHash("sha256").update(text).digest("hex");
const receipt = {
  base, originalSourceSha256: sha256(source), originalCssSha256: sha256(css),
  preparedSourceSha256: sha256(transformed), onlySourceTransform: "HooperViewer import replaced with a null component",
  rosterGridMarkupIdentical: true, onlyRetiredStageCssRemoved: true,
  sharedLiveUIFilesIdentical: files.length, rejectedModelLoadingAndRenderingDisabled: true,
};
await writeFile(path.join(directory, "provenance.json"), JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify(receipt));
