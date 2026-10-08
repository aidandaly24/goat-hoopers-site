import { Children, createElement, isValidElement, type ButtonHTMLAttributes, type MouseEvent, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Link from "next/link";
import type { StockDetail, StockQuote } from "@/domain";
import { PlayerName } from "@/ui/PlayerRow";
import { StockQuoteRow } from "./StockQuoteRow";
import { createDetailLoader } from "./detail";

const quote: StockQuote = {
  playerId: "synthetic", playerName: "Synthetic Player", position: "PG", nbaTeam: null,
  price: 20, prevPrice: null, change: null, changePct: null, trend: "flat",
  ownership: 0, rookiePick: null,
};
type Props = { children?: ReactNode; [key: string]: unknown };
function descendants(node: ReactNode): ReactElement<Props>[] {
  return Children.toArray(node).flatMap((child) => isValidElement<Props>(child)
    ? [child, ...descendants(child.props.children)] : []);
}
function row(selected = false) {
  const onInspect = vi.fn();
  const element = StockQuoteRow({ quote, rank: 1, selected, onInspect });
  const buttons = descendants(element).filter((child) => child.type === "button") as ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>[];
  return { element, buttons, onInspect };
}

describe("stocks chart discovery", () => {
  for (const selected of [false, true]) it(`offers two native chart buttons with selection=${selected}`, () => {
    const { buttons } = row(selected);
    expect(buttons).toHaveLength(2);
    expect(buttons.map((button) => button.props["aria-label"])).toEqual([
      "Synthetic Player price history", "Price history for Synthetic Player",
    ]);
    for (const button of buttons) {
      expect(button.props.type).toBe("button");
      expect(button.props["aria-controls"]).toBe("stock-inspector");
      expect(button.props["aria-expanded"]).toBe(selected);
      expect(button.props["aria-pressed"]).toBeUndefined();
      // Native buttons retain Enter/Space activation rather than replacing it.
      expect(button.props.onKeyDown).toBeUndefined();
      expect(button.props.tabIndex).toBeUndefined();
    }
  });

  for (const index of [0, 1]) it(`passes the clicked chart trigger ${index} to the existing focus-restoration path`, () => {
    const { buttons, onInspect } = row();
    const trigger = { id: `trigger-${index}` } as HTMLButtonElement;
    buttons[index].props.onClick!({ currentTarget: trigger } as MouseEvent<HTMLButtonElement>);
    expect(onInspect).toHaveBeenCalledExactlyOnceWith(quote, trigger);
  });

  it("renders a visible price-history label and a separate non-prefetched profile link", () => {
    const { element } = row();
    const html = renderToStaticMarkup(element);
    expect(html).toMatch(/<button[^>]*aria-label="Synthetic Player price history"[^>]*>Synthetic Player<\/button>/);
    expect(html).toMatch(/<button[^>]*aria-label="Price history for Synthetic Player"[^>]*>[\s\S]*?Price history<\/button>/);
    const profiles = descendants(element).filter((child) => child.type === Link);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].props.href).toBe("/player/synthetic");
    expect(profiles[0].props["aria-label"]).toBe("Full profile for Synthetic Player");
    expect(profiles[0].props.children).toBe("Full profile");
    expect(profiles[0].props.prefetch).toBe(false);
    expect(profiles[0].props.onClick).toBeUndefined();
  });

  it("reuses one lazy detail request when name and price-history controls are both activated", async () => {
    const detail: StockDetail = { playerId: quote.playerId, spark: [], seasonHistory: [], factors: [] };
    const load = vi.fn(async () => detail);
    const getDetail = createDetailLoader(load);
    const pending: Promise<StockDetail>[] = [];
    const element = StockQuoteRow({ quote, rank: 1, selected: false,
      onInspect: (selected) => { pending.push(getDetail(selected.playerId)); } });
    expect(load).not.toHaveBeenCalled();
    const buttons = descendants(element).filter((child) => child.type === "button") as ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>[];
    for (const button of buttons) button.props.onClick!({ currentTarget: {} } as MouseEvent<HTMLButtonElement>);
    expect(pending[0]).toBe(pending[1]);
    expect(await Promise.all(pending)).toEqual([detail, detail]);
    expect(load).toHaveBeenCalledExactlyOnceWith(quote.playerId);
    expect(await getDetail(quote.playerId)).toBe(detail);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("leaves shared player-name navigation unchanged outside the stocks rows", () => {
    const html = renderToStaticMarkup(createElement(PlayerName, { player: { id: quote.playerId, fullName: quote.playerName } }));
    expect(html).toMatch(/<a[^>]*href="\/player\/synthetic"[^>]*>Synthetic Player<\/a>/);
    expect(html).not.toContain("<button");
  });
});
