import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { AiDecidesData } from "@/domain/ai-decider";
import legacy from "@/data/ai-decider/__tests__/legacy-weekly-fixtures.json";
import { AiDecidesHomeEntry, AiWeekly } from "./AiWeekly";

const data = (): AiDecidesData => ({ availability: { status: "unavailable", code: "synthetic", message: "Offline fixture" }, weekly: {
  ...structuredClone(legacy.records[1].result) as AiDecidesData["weekly"], status: "stale",
  sourceCompatibility: { status: "changed", currentWindow: true, savedStarterCount: 10, currentStarterCount: 11, savedPolicy: "legacy-ten-starters", message: "Saved result uses 10 starters; current source declares 11. Not a current-settings prediction. Saved probabilities are unchanged." },
} });
describe("saved policy disclosure", () => {
  it.each(["weekly", "home"])("shows the settings mismatch beside saved probabilities in %s", surface => {
    const fixture = data(), teams = Array.from({ length: 10 }, (_, n) => ({ id: String(n + 1), name: `Synthetic team ${n + 1}` }));
    const html = renderToStaticMarkup(surface === "weekly" ? createElement(AiWeekly, { data: fixture, teams, onPair: () => {} }) : createElement(AiDecidesHomeEntry, { data: fixture, teams }));
    expect(html).toContain('data-ai-source-compatibility="changed"');
    expect(html).toContain("current source declares 11");
    expect(html).toContain("Saved comparison"); expect(html).not.toContain("Past week");
    expect(html).toContain("65%"); expect(html).toContain("35%");
  });
});
