import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

it("can invoke the build CLI without database credentials or a seed preflight", () => {
  // --help stops before compilation, external fetches or page rendering.
  // The previous build hook failed before Next because it tried getDb().
  const output = execFileSync("npm", ["run", "build", "--", "--help"], {
    cwd: fileURLToPath(new URL("../../../", import.meta.url)),
    env: { PATH: process.env.PATH, CI: "true", NODE_ENV: "test" },
    encoding: "utf8", timeout: 15000,
  });
  expect(output).toContain("next build");
  expect(output).toContain("Usage:");
}, 20000);
