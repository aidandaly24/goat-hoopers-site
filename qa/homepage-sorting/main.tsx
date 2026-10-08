import { useState } from "react";
import { createRoot } from "react-dom/client";
import type { Team, Standing } from "@/domain";
import type { LiveClubhouseDirectoryEntry } from "@/domain/clubhouse-directory";
import { CourtsideDirectory } from "@/surfaces/season-hub/CourtsideDirectory";
import { StandingsTable } from "@/surfaces/season-hub/StandingsTable";
import { cs } from "@/surfaces/season-hub/CourtsideStyles";
import "@/ui/tokens.css";
import "@/app/globals.css";
import "@/ui/courtside-tokens.css";

const team = (id: string, managerName: string): Team => ({ id, managerName, name: `Team ${id}`, avatar: null,
  wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0 });
const teams = [team("10", "Zed"), team("2", "Amy"), team("3", "Bea"), team("4", "Dan")];
const entries: LiveClubhouseDirectoryEntry[] = teams.map((identity, index) => ({
  identity, currentRecord: null, featuredPlayerIds: [], opener: null, recentMove: null, latestMove: null,
  previousSeason: index === 3 ? null : { season: "2025", wins: index === 1 ? 10 : 2, losses: 3,
    finish: index === 0 ? 10 : 2, ownerNote: index === 2 ? "Synthetic previous manager context." : null },
  currentMatchup: index < 2 ? { week: 1, home: teams[0], away: teams[1], homePoints: null, awayPoints: null } : null,
  players: Array.from({ length: [9, 2, 1, 0][index] }, (_, n) => ({ id: `${identity.id}-${n}`,
    fullName: index === 0 && n === 8 ? "Only In Ten" : `Fixture Player ${identity.id} ${n}`, position: "C", nbaTeam: null })),
}));
const standings: Standing[] = teams.map((team, index) => ({ team, rank: [3, 1, 2, 4][index],
  wins: [2, 10, 2, 0][index], losses: [10, 2, 2, 0][index], ties: 0, gamesBack: 0,
  pointsFor: [900, 10000, 900, NaN][index] }));

function Fixture() {
  const [round, setRound] = useState(0);
  const [result, setResult] = useState("Not run. All team/player values are synthetic.");
  async function run() {
    const checks: string[] = [];
    const check = (truth: boolean, message: string) => {
      if (!truth) throw new Error(message);
      checks.push(message);
    };
    const flush = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    try {
      setRound((value) => value + 1);
      await flush();
      const directory = document.getElementById("fixture-directory")!;
      const table = document.getElementById("fixture-standings")!;
      const rows = () => Array.from(directory.querySelectorAll<HTMLDetailsElement>("details[data-team-id]"));
      const order = () => rows().map((row) => row.dataset.teamId).join(",");
      const tableOrder = () => Array.from(table.querySelectorAll<HTMLAnchorElement>('a[role="row"]')).map((row) => row.getAttribute("href")!.split("/").pop()).join(",");
      const select = directory.querySelector<HTMLSelectElement>("select")!;
      const choose = async (key: string) => { select.value = key; select.dispatchEvent(new Event("change", { bubbles: true })); await flush(); };
      const click = async (scope: Element, prefix: string) => {
        const button = Array.from(scope.querySelectorAll<HTMLButtonElement>("button")).find((node) => node.getAttribute("aria-label")?.startsWith(prefix));
        if (!button) throw new Error(`Missing button: ${prefix}`);
        button.click(); await flush();
      };
      check(order() === "10,2,3,4", "Original league order");
      const openRow = rows()[0]; openRow.open = true;
      await choose("finish");
      check(order() === "2,3,10,4", "2025 finish selector still works; equal finishes stable and missing last");
      check(rows().includes(openRow) && openRow.open, "Native expanded roster node retained after sorting");
      await click(directory, "Reverse");
      check(order() === "10,2,3,4", "Reverse historical finish with missing last");
      await choose("team");
      check(order() === "2,3,4,10", "Natural numeric team names ascending");
      await click(directory, "Team, by Team");
      check(order() === "10,4,3,2", "Column activation reverses selected team order");
      await click(directory, "manager, by Manager");
      check(order() === "2,3,4,10", "Manager column switches to alphabetical order");
      await click(directory, "Full roster, by Roster size");
      check(order() === "10,2,3,4", "Roster size sorts by numeric player count");
      await click(directory, "2025 record, by 2025 wins");
      check(order() === "2,10,3,4", "Record sorts by displayed wins, stable ties");
      await click(directory, "2025 record, by 2025 wins");
      check(order() === "10,3,2,4", "Record ascending keeps unknown records last");
      const input = directory.querySelector<HTMLInputElement>('input[type="search"]')!;
      const writeQuery = async (value: string) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true })); await flush();
      };
      await writeQuery("Only In Ten");
      check(order() === "10" && rows()[0].querySelectorAll("li").length === 9, "Search reaches a nonfeatured player and retains full roster");
      await choose("team");
      check(order() === "10", "Sorting preserves search filter");
      const clear = Array.from(directory.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent === "Clear")!;
      clear.click(); await flush();
      check(order() === "2,3,4,10" && document.activeElement === input, "Clear preserves sort and restores search focus");
      await writeQuery("no match at all");
      check(rows().length === 0 && directory.textContent!.includes("No matching team"), "No-results state preserved");
      clear.click(); await flush(); await choose("league");
      check(order() === "10,2,3,4", "League order restores original order");
      check(!!directory.querySelector('a[href="/teams/10"]') && !!directory.querySelector('a[href="/player/10-8"]'), "Team and player destinations preserved");
      check(tableOrder() === "2,3,10,4", "Standings default league ranks");
      for (const [direction, expected] of [["descending", "2,10,3,4"], ["ascending", "10,3,2,4"], ["descending", "2,10,3,4"], ["ascending", "10,3,2,4"]]) {
        await click(table, "Points for:");
        check(tableOrder() === expected, `Points for ${direction}: repeated DOM activation, stable ties, missing last`);
        check(table.querySelector('[role="columnheader"][aria-sort="' + direction + '"]')?.textContent?.includes("PF") === true, `aria-sort reports ${direction}`);
      }
      const pointCells = Array.from(table.querySelectorAll('[data-label="PF"]')).map((node) => node.textContent);
      check(pointCells.join(",") === "9.0,9.0,100.0,—", "Displayed Standing.pointsFor matches comparator; missing rendered as dash");
      const ranks = Array.from(table.querySelectorAll('a[role="row"]')).map((node) => node.firstElementChild?.textContent?.trim());
      check(ranks.join(",") === "3,2,1,4", "Sorting retains official ranks rather than renumbering");
      await click(table, "Wins:"); check(tableOrder() === "2,10,3,4", "Wins defaults high to low");
      await click(table, "Losses:"); check(tableOrder() === "4,2,3,10", "Losses defaults low to high");
      const sizes = Array.from(table.querySelectorAll<HTMLButtonElement>("button")).map((button) => button.getBoundingClientRect());
      check(sizes.every((rect) => rect.height >= 44 && rect.width >= 44), "Standings controls have 44px touch targets");
      setResult(`PASS: ${checks.length} DOM checks\n` + checks.join("\n"));
    } catch (error) {
      setResult(`FAIL after ${checks.length} checks: ${error instanceof Error ? error.message : error}\n` + checks.join("\n"));
    }
  }
  return <>
    <div style={{ padding: "var(--gh-s4)" }}>
      <h1>Homepage sorting — offline fixture</h1>
      <p>Actual production components; four synthetic teams. No league loaders, DB, portraits or external avatars.</p>
      <button type="button" onClick={run}>Run repeated DOM interaction checks</button>
      <pre role="status" style={{ whiteSpace: "pre-wrap" }}>{result}</pre>
    </div>
    <main key={round} className={cs("surface")} data-courtside-home>
      <div id="fixture-directory">
        <CourtsideDirectory entries={entries} seasonLabel="Synthetic 2026" checkedAt="2026-10-08T00:00:00Z" preseason rosterNamesAvailable portraits={{}}>
          <details open className={cs("league-details")}>
            <summary>Live standings, stats &amp; recent moves</summary>
            <div className={cs("live-grid")}>
              <div id="fixture-standings"><StandingsTable standings={standings} /></div>
              <div>
                <h2>Synthetic league context</h2>
                <p>This sibling preserves the homepage&apos;s split-column standings width. No live stats or transactions are loaded.</p>
              </div>
            </div>
          </details>
        </CourtsideDirectory>
      </div>
    </main>
  </>;
}
createRoot(document.getElementById("root")!).render(<Fixture />);
