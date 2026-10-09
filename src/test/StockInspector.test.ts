import { describe, expect, it, vi } from "vitest";
import type { HTMLAttributes, KeyboardEvent, ReactElement } from "react";
import { StockInspector, type DetailState } from "@/surfaces/stock-market/StockInspector";
import type { StockQuote } from "@/domain";

const quote: StockQuote = {
  playerId: "synthetic", playerName: "Synthetic Player", position: "PG", nbaTeam: null,
  price: 20, prevPrice: null, change: null, changePct: null, trend: "flat",
  ownership: 0, rookiePick: null,
};
const states: DetailState[] = [
  { status: "loading" }, { status: "error" },
  { status: "ready", detail: { playerId: quote.playerId, spark: [], seasonHistory: [], factors: [] } },
];
function inspector(selected: StockQuote | null, detail: DetailState) {
  const onClose = vi.fn();
  const element = StockInspector({ quote: selected, detail, onClose, headingRef: null,
    onRetry: vi.fn(), examples: [quote], onInspect: vi.fn(),
    loadHistory: vi.fn(async () => { throw new Error("Keyboard test must not load history"); }) }) as ReactElement<HTMLAttributes<HTMLElement>>;
  return { onClose, element };
}
function key(key: string, defaultPrevented = false) {
  return { key, defaultPrevented, preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as KeyboardEvent<HTMLElement>;
}

describe("inspector keyboard dismissal", () => {
  for (const detail of states) it(`consumes Escape once through onClose while ${detail.status}`, () => {
    const { element, onClose } = inspector(quote, detail);
    const event = key("Escape");
    element.props.onKeyDown!(event);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    expect(element.type).toBe("aside");
    expect(element.props.role).toBeUndefined();
    expect(element.props.onKeyDownCapture).toBeUndefined();
  });
  for (const [selected, value, prevented] of [
    [null, "Escape", false], [quote, "Escape", true],
    [quote, "Tab", false], [quote, "Enter", false], [quote, " ", false], [quote, "ArrowDown", false],
  ] as const) it(`leaves ${value} untouched (selection=${!!selected}, handled=${prevented})`, () => {
    const { element, onClose } = inspector(selected, { status: "idle" });
    const event = key(value, prevented);
    element.props.onKeyDown!(event);
    expect(onClose).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(event.stopPropagation).not.toHaveBeenCalled();
  });
});
