import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, expect, it, vi } from "vitest";
import { loadConfigFromFile } from "vite";
import type { ViteUserConfig } from "vitest/config";

afterEach(() => vi.unstubAllEnvs());

it.each(["none", "price", "claim", "both"])("keeps the setup guard installed in %s mode", async mode => {
  vi.stubEnv("RUN_PRICE_HISTORY_LOCAL_TEST", mode === "price" || mode === "both" ? "1" : "0");
  vi.stubEnv("RUN_CLAIM_TEAM_LOCAL_TEST", mode === "claim" || mode === "both" ? "1" : "0");
  const result = await loadConfigFromFile({ command: "serve", mode: "test" },
    fileURLToPath(new URL("../../vitest.config.mts", import.meta.url)));
  const config = result?.config as ViteUserConfig | undefined;
  expect(config?.test?.setupFiles).toContain("./src/test/offline.ts");
});

it("explicitly disables both local integrations in CI", () => {
  const workflow = readFileSync(new URL("../../.github/workflows/ci.yml", import.meta.url), "utf8");
  expect(workflow).toMatch(/^\s+RUN_PRICE_HISTORY_LOCAL_TEST: "0"$/m);
  expect(workflow).toMatch(/^\s+RUN_CLAIM_TEAM_LOCAL_TEST: "0"$/m);
});
