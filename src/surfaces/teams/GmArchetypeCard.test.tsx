/**
 * GmArchetypeCard surface contract — static-markup regressions.
 *
 * Rendered with react-dom/server (no DOM, no browser): asserts the
 * committed output contract — honest empty states, default-visible
 * metric bars with accessible names, real-zero vs unmeasured metrics,
 * and one independent native disclosure per definition. Props are
 * wholly synthetic; nothing here touches the network or the database.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import type { ManagerArchetype, MetricId } from "@/domain";
import { GmArchetypeCard } from "./GmArchetypeCard";

const ALL_MEASURED: Record<MetricId, number | null> = {
  draftCapital: 94,
  tradeFrequency: 82,
  wireAggression: 31,
  youthPreference: 97,
  patience: 88,
};

function card(
  metrics: Record<MetricId, number | null> = ALL_MEASURED,
  priorManagerNote: string | null = null,
): ManagerArchetype {
  return {
    rosterId: "1",
    seasons: [
      {
        season: "2025",
        managerName: "Synthetic GM",
        priorManagerNote,
        metrics,
        archetype: "hoarder",
      },
    ],
  };
}

function html(archetype: ManagerArchetype | null): string {
  return renderToStaticMarkup(<GmArchetypeCard archetype={archetype} />);
}

function detailsBlocks(markup: string): string[] {
  return markup.match(/<details\b[^>]*>[\s\S]*?<\/details>/g) ?? [];
}

function countOccurrences(haystack: string, needle: RegExp): number {
  return haystack.match(needle)?.length ?? 0;
}

/** Distinctive fragments of each metric definition (escaping-proof). */
const DEFINITION_FRAGMENTS: Record<MetricId, string> = {
  draftCapital: "Round-weighted net future rookie picks",
  tradeFrequency: "Trades participated in",
  wireAggression: "no FAAB bids exist in the transaction data",
  youthPreference: "younger roster = higher percentile",
  patience: "ranked among managers with measured tenure",
};

describe("GmArchetypeCard", () => {
  test("null archetype renders an honest empty state, never fake numbers", () => {
    const out = html(null);
    expect(out).toContain("No archetype yet");
    expect(out).not.toContain('role="img"');
    expect(out).not.toContain(">pct<");
  });

  test("empty seasons renders the same honest empty state", () => {
    const out = html({ rosterId: "1", seasons: [] });
    expect(out).toContain("No archetype yet");
    expect(out).not.toContain('role="img"');
  });

  test("populated card shows all five bars with accessible names and widths", () => {
    const out = html(card());
    expect(countOccurrences(out, /role="img"/g)).toBe(5);
    expect(out).toContain('aria-label="Draft capital: 94th percentile"');
    expect(out).toContain('aria-label="Trade frequency: 82th percentile"');
    expect(out).toContain('aria-label="Free-agent aggression: 31th percentile"');
    expect(out).toContain('aria-label="Young-player preference: 97th percentile"');
    expect(out).toContain('aria-label="Patience: 88th percentile"');
    expect(out).toContain('style="width:94%"');
    expect(out).toContain('style="width:31%"');
    expect(out).toContain("The Hoarder");
    expect(out).toContain("2025");
  });

  test("bars are visible by default: none sit inside a closed disclosure", () => {
    const out = html(card());
    expect(countOccurrences(out, /role="img"/g)).toBe(5);
    for (const block of detailsBlocks(out)) {
      expect(block).not.toContain('role="img"');
    }
  });

  test("each definition lives in its own independent native disclosure", () => {
    const out = html(card());
    const blocks = detailsBlocks(out);
    expect(blocks).toHaveLength(5);
    const ids: MetricId[] = [
      "draftCapital",
      "tradeFrequency",
      "wireAggression",
      "youthPreference",
      "patience",
    ];
    for (const id of ids) {
      const block = blocks.find((b) =>
        b.includes(DEFINITION_FRAGMENTS[id]),
      );
      expect(block, `independent disclosure for ${id}`).toBeDefined();
      // one definition per disclosure: no other metric's fragment leaks in
      for (const other of ids) {
        if (other === id) continue;
        expect(block).not.toContain(DEFINITION_FRAGMENTS[other]);
      }
    }
    // native details/summary: keyboard-operable with no JS required
    expect(countOccurrences(out, /<summary/g)).toBe(5);
  });

  test("real zero renders as a measured zero, null as unmeasured", () => {
    const zero = html(card({ ...ALL_MEASURED, patience: 0 }));
    expect(zero).toContain('aria-label="Patience: 0th percentile"');
    expect(zero).toContain('style="width:0%"');
    expect(countOccurrences(zero, />pct</g)).toBe(5);
    expect(zero).not.toContain(">n/a<");

    const unmeasured = html(card({ ...ALL_MEASURED, patience: null }));
    expect(unmeasured).toContain('aria-label="Patience: unmeasured"');
    // empty bar, never a fake value
    expect(unmeasured).toContain('style="width:0%"');
    expect(countOccurrences(unmeasured, />n\/a</g)).toBe(1);
    expect(countOccurrences(unmeasured, />pct</g)).toBe(4);
    expect(unmeasured).not.toContain("Patience: 0th percentile");
  });

  test("prior-manager note renders when present, omitted otherwise", () => {
    const withNote = html(
      card(ALL_MEASURED, "2025 · managed then by slennox — not the current manager."),
    );
    expect(withNote).toContain("slennox");
    expect(html(card())).not.toContain("slennox");
  });
});
