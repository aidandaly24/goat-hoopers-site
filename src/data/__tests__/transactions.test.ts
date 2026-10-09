/**
 * transactions.test.ts — baseline regression coverage for the
 * Sleeper → domain transaction membrane (toTransactions).
 *
 * Bug-specific cases (trade preservation, unknown-type policy) land
 * with issue #27; this file proves the harness and fixtures work.
 */
import { describe, expect, it } from "vitest";
import { toTransactions } from "@/data/transform";
import { generateLeagueNews } from "@/data/news";
import {
  playerDirectory,
  rawTrade,
  rawTransaction,
  rawWaiver,
  teamA,
  teamB,
} from "./fixtures";

const TEAMS = [teamA(), teamB()];

describe("toTransactions baseline", () => {
  it("maps a free-agent add with newest-first ordering", () => {
    const older = rawTransaction({
      transaction_id: "old",
      created: Date.parse("2026-10-01T12:00:00Z"),
    });
    const newer = rawTransaction({
      transaction_id: "new",
      created: Date.parse("2026-10-02T12:00:00Z"),
    });
    const [first, second] = toTransactions(
      [older, newer],
      TEAMS,
      [],
      [],
      playerDirectory()
    );
    expect(first.id).toBe("new");
    expect(second.id).toBe("old");
    expect(first.type).toBe("free_agent");
    expect(first.adds).toEqual([{ playerId: "p1", name: "Player One" }]);
  });

  it("preserves the waiver type and FAAB bid signal", () => {
    const [tx] = toTransactions(
      [rawWaiver()],
      TEAMS,
      [],
      [],
      playerDirectory()
    );
    expect(tx.type).toBe("waiver");
  });

  it("falls back to Player <id> when the directory is missing", () => {
    const [tx] = toTransactions([rawTransaction()], TEAMS, [], [], null);
    expect(tx.adds[0].name).toBe("Player p1");
  });

  it("handles null adds and drops without crashing", () => {
    const [tx] = toTransactions(
      [rawTransaction({ adds: null, drops: null })],
      TEAMS,
      [],
      [],
      playerDirectory()
    );
    expect(tx.adds).toEqual([]);
    expect(tx.drops).toEqual([]);
    expect(tx.summary).toContain("roster move");
  });
});

describe("toTransactions trade preservation (issue #27)", () => {
  it("preserves the trade type through the membrane", () => {
    const [tx] = toTransactions(
      [rawTrade()],
      TEAMS,
      [],
      [],
      playerDirectory()
    );
    expect(tx.type).toBe("trade");
  });

  it("builds two-sided trade sides for news coverage", () => {
    const [tx] = toTransactions(
      [rawTrade()],
      TEAMS,
      [],
      [],
      playerDirectory()
    );
    expect(tx.sides).toHaveLength(2);
    const side1 = tx.sides!.find((s) => s.teamId === "1")!;
    const side2 = tx.sides!.find((s) => s.teamId === "2")!;
    expect(side1.received).toEqual([{ playerId: "p1", name: "Player One" }]);
    expect(side2.received).toEqual([{ playerId: "p2", name: "Player Two" }]);
  });

  it("a two-sided trade produces trade news articles", () => {
    const [tx] = toTransactions(
      [rawTrade()],
      TEAMS,
      [],
      [],
      playerDirectory()
    );
    const articles = generateLeagueNews({
      transactions: [tx],
      picks: [],
      teams: TEAMS,
    });
    const trades = articles.filter((a) => a.kind === "trade");
    expect(trades.length).toBeGreaterThan(0);
  });

  it("a pick-only trade keeps its trade type without fabricating players", () => {
    const [tx] = toTransactions(
      [
        rawTrade({
          transaction_id: "pick-trade",
          adds: null,
          drops: null,
          draft_picks: [{ pick: 1 }],
        }),
      ],
      TEAMS,
      [],
      [],
      playerDirectory()
    );
    expect(tx.type).toBe("trade");
    expect(tx.adds).toEqual([]);
    expect(tx.drops).toEqual([]);
    expect(tx.sides).toBeUndefined();
  });

  it("filters unknown types instead of silently reclassifying", () => {
    const txs = toTransactions(
      [rawTransaction({ transaction_id: "weird", type: "mystery_move" })],
      TEAMS,
      [],
      [],
      playerDirectory()
    );
    expect(txs).toHaveLength(0);
  });
});

describe("Transactions participant and completion repairs", () => {
  it("keeps declared pick-only participants without player moves or empty sides", () => {
    const [tx] = toTransactions([rawTrade({roster_ids:[702,703,702],adds:null,drops:null})],TEAMS,[],[],playerDirectory());
    expect(tx.teamIds).toEqual(["702","703"]);
    expect(tx.adds).toEqual([]);
    expect(tx.drops).toEqual([]);
    expect(tx.sides).toBeUndefined();
  });
  it("preserves move-derived order and sides while appending declared-only participants", () => {
    const [tx] = toTransactions([rawTrade({roster_ids:[703,2,1]})],TEAMS,[],[],playerDirectory());
    expect(tx.teamIds).toEqual(["1","2","703"]);
    expect(tx.sides?.map(s=>s.teamId)).toEqual(["1","2"]);
    expect(tx.sides?.map(s=>s.received.map(p=>p.playerId))).toEqual([["p1"],["p2"]]);
  });
  it("does not infer pick owners when declared and player participants are absent", () => {
    const [tx] = toTransactions([rawTrade({adds:null,drops:null,draft_picks:[{owner_id:703}]})],TEAMS,[],[],null);
    expect(tx.teamIds).toEqual([]);
    expect(tx.sides).toBeUndefined();
  });
  it("never fabricates empty received-player sides for declared or sending-only teams", () => {
    const [tx] = toTransactions([rawTrade({adds:{p1:702},drops:{p1:701},roster_ids:[703]})],TEAMS,[],[],playerDirectory());
    expect(tx.teamIds).toEqual(["702","701","703"]);
    expect(tx.sides?.map(s=>s.teamId)).toEqual(["702"]);
    const [empty] = toTransactions([rawTrade({adds:{},drops:null,roster_ids:[703]})],TEAMS,[],[],null);
    expect(empty.sides).toBeUndefined();
  });
  it("ignores malformed, zero, negative, fractional and nonfinite declared IDs", () => {
    const [tx] = toTransactions([rawTrade({adds:null,drops:null,roster_ids:[0,-1,NaN,Infinity,2.5,Number.MAX_SAFE_INTEGER+1,"703",703] as number[]})],TEAMS,[],[],null);
    expect(tx.teamIds).toEqual(["703"]);
  });
  it.each(["failed","pending","unknown",""])("does not turn explicit %s status into successful activity", status=>{
    expect(toTransactions([rawWaiver({status})],TEAMS,[],[],playerDirectory())).toEqual([]);
  });
  it("preserves completed and status-absent legacy IDs, moves and ordering", () => {
    const legacy=rawWaiver({transaction_id:"demo-legacy",created:1});
    const complete=rawTrade({transaction_id:"demo-complete",created:2,status:"complete"});
    const result=toTransactions([legacy,complete],TEAMS,[],[],playerDirectory());
    expect(result.map(t=>t.id)).toEqual(["demo-complete","demo-legacy"]);
    expect(result[1].adds).toEqual([{playerId:"p1",name:"Player One"}]);
  });
});
