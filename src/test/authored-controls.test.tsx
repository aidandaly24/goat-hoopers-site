import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { expect, it } from "vitest";
import { teamA } from "@/data/__tests__/fixtures";
import { TeamDirectory } from "@/surfaces/teams/TeamDirectory";

const forbidden = /[\p{Extended_Pictographic}\p{Emoji_Presentation}\u2190-\u21ff\uFE0F]/u;
function surfaceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? surfaceFiles(path) : path.endsWith(".tsx") && !path.includes(".test.") ? [path] : [];
  });
}

it("keeps app-authored interface text free of emoji and arrow glyphs", () => {
  // Parse authored text only. Comments and values received from users/providers
  // are outside this policy; do not sanitize team names or news at runtime.
  const files = ["src/app", "src/ui", "src/surfaces"].flatMap(surfaceFiles);
  files.push("src/domain/arcade/games.ts");
  const violations: string[] = [];
  for (const file of files) {
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node) => {
      if ((ts.isJsxText(node) || ts.isStringLiteralLike(node)) && forbidden.test(node.text)) {
        violations.push(`${file}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  expect(violations).toEqual([]);
});

it("preserves user-created team names verbatim", () => {
  const name = "Fixture 🏀 Club ↗";
  const html = renderToStaticMarkup(createElement(TeamDirectory, { teams: [teamA({ name })] }));
  expect(html).toContain(name);
  expect(html).toContain(`aria-label="View ${name}"`);
});
