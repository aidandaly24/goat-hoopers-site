import { expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { currentTeamQuote } from "@/domain/current-team-quote";
import { buildPersonalizedHome } from "@/data/personalized-home";
import { personalizedFixture } from "@/test/personalized-home-fixture";
import { changesHistory } from "../../../qa/team-value-history/changes-fixture";
import { TeamValueHistory } from "./TeamValueHistory";
import { RosterValueSection } from "./RosterValueSection";

function summary() {
  const f = personalizedFixture(); f.market.updatedAt = Date.parse("2026-10-20T19:00:00.000Z");
  const value = buildPersonalizedHome({ kind: "member", teamId: "1" }, f.home, f.weekly, f.market);
  if (value.kind !== "member" || !value.summary) throw Error("Synthetic member missing");
  return value.summary;
}
test("headline, current readout and distinct same-day marker share one validated calculation identity", () => {
  const s = summary(), h = changesHistory(), before = structuredClone(h);
  const html = renderToStaticMarkup(<RosterValueSection summary={s} portraits={{}} teamHistory={h} />);
  const ids = [...html.matchAll(/data-quote-calculation="([^"]+)"/g)].map(x => x[1]);
  expect(ids).toHaveLength(3); expect(new Set(ids).size).toBe(1);
  expect(html).toContain("Current modeled quote"); expect(html).toContain("Current roster");
  expect(html).toContain("data-history-current="); expect(html).toContain("data-history-point=\"synthetic-change-point-2026-10-20\"");
  expect(h).toEqual(before); expect(h.currentQuote?.subtotalCents).toBe(10096);
  expect(html).toContain("Saved quote for current roster: $100.96");
  expect(html).not.toContain("data-history-detail=");
});
test("partial current coverage stays a subtotal and is never inserted into historical evidence", () => {
  const s = summary();s.valuation.players[0].value = null;s.rosterValues[0].value = null;
  s.valuation.total = s.valuation.players.reduce((sum,p)=>sum+(p.value??0),0);
  s.valuation.priced--;s.valuation.unpriced++;s.valuation.complete=false;
  const q=currentTeamQuote(s)!, h=changesHistory();
  const html=renderToStaticMarkup(<TeamValueHistory history={h} currentQuote={q} />);
  expect(html).toContain("Subtotal · Current modeled quote");expect(html).toContain("3/4 priced");
  expect(html).toContain('aria-valuetext="Current modeled quote, $90 subtotal, 3/4 priced"');
  expect(h.points).toHaveLength(2);expect(html).toContain("2 historical priced dates");
});
test("an unavailable headline and current readout still share the same calculation state", () => {
  const s=summary();for(const p of s.valuation.players)p.value=null;for(const p of s.rosterValues)p.value=null;
  Object.assign(s.valuation,{total:null,priced:0,unpriced:4,complete:false});
  const html=renderToStaticMarkup(<RosterValueSection summary={s} portraits={{}} teamHistory={changesHistory()} />);
  const ids=[...html.matchAll(/data-quote-calculation="([^"]+)"/g)].map(x=>x[1]);
  expect(ids).toHaveLength(2);expect(new Set(ids).size).toBe(1);expect(html).not.toContain("data-history-current=");
  expect(html).toContain('aria-valuetext="Current modeled quote, unavailable, 0/4 priced"');
});
test("unpriced, empty and unknown current membership do not reuse an old historical value", () => {
  const s=summary();
  for(const p of s.valuation.players)p.value=null;for(const p of s.rosterValues)p.value=null;
  Object.assign(s.valuation,{total:null,priced:0,unpriced:4,complete:false});
  let html=renderToStaticMarkup(<TeamValueHistory history={changesHistory()} currentQuote={currentTeamQuote(s)} />);
  expect(html).toContain("Current value unavailable");expect(html).not.toContain("data-history-current=");
  s.rosterValues=[];Object.assign(s.valuation,{players:[],total:0,unpriced:0,complete:true});
  html=renderToStaticMarkup(<TeamValueHistory history={changesHistory()} currentQuote={currentTeamQuote(s)} />);
  expect(html).toContain("$0.00");expect(html).toContain("Empty current roster");expect(html).toContain("data-history-current=");
  Object.assign(s.valuation,{knownRoster:false,total:null,complete:false});
  html=renderToStaticMarkup(<TeamValueHistory history={changesHistory()} currentQuote={currentTeamQuote(s)} />);
  expect(html).toContain("Current membership is unavailable");expect(html).toContain("Current value unavailable");
});
test("wrong-team, tampered and distant future current quotes cannot change the graph or grow its calendar", () => {
  const s=summary(), h=changesHistory(), q=currentTeamQuote(s)!;
  const wrong=currentTeamQuote({...s,team:{...s.team,id:'other-team'}})!;
  const future=currentTeamQuote({...s,market:{...s.market!,updatedAt:Date.parse('2099-01-01T00:00:00.000Z')}})!;
  for(const bad of [wrong,future,{...q,subtotalCents:q.subtotalCents!+1}]) {
    const html=renderToStaticMarkup(<TeamValueHistory history={h} currentQuote={bad} />);
    expect(html).not.toContain("data-history-current=");expect(html).toContain("Saved snapshot");
  }
});
test("a current quote across the next UTC midnight is separate from the pinned historical cutoff", () => {
  const s=summary(),h=changesHistory();s.market!.updatedAt=Date.parse('2026-10-23T00:00:00.100Z');
  const before=structuredClone(h),html=renderToStaticMarkup(<TeamValueHistory history={h} currentQuote={currentTeamQuote(s)} />);
  expect(html).toContain("Current · Oct 23, 2026");expect(html).toContain("data-history-current=");
  expect(h).toEqual(before);expect(h.asOf).toBe('2026-10-22T00:10:00.000Z');
});
