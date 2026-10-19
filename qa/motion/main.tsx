import { useState } from "react";
import { createRoot } from "react-dom/client";
import type { CourtsideHomeData } from "@/data/league";
import type { Team, Matchup } from "@/domain";
import { AI_PROBABILITY_LABEL, type AiWeeklySlate } from "@/domain/ai-decider";
import type { WeeklyEdition } from "@/domain/weekly-spotlight";
import { CourtsideHome } from "@/surfaces/season-hub/CourtsideHome";
import { SiteHeader } from "@/ui/SiteHeader";
import "@/ui/tokens.css";
import "@/app/globals.css";
import "./fixture.css";

// A bounded fixture-only probe exercises the component's live MediaQueryList listener.
// CSS keeps the browser's actual preference; this is explicitly not OS emulation.
const nativeMatchMedia = window.matchMedia.bind(window);
const matchesGetter = Object.getOwnPropertyDescriptor(MediaQueryList.prototype, "matches")!.get!;
const motionQueries = new Set<MediaQueryList>();
let forcedReduced = false;
window.matchMedia = (query) => {
  const media = nativeMatchMedia(query);
  if (query === "(prefers-reduced-motion: reduce)") {
    Object.defineProperty(media, "matches", { get: () => forcedReduced || matchesGetter.call(media) });
    motionQueries.add(media);
  }
  return media;
};
function forceMotionPreference(reduce: boolean) {
  forcedReduced = reduce;
  for (const media of motionQueries) media.dispatchEvent(new MediaQueryListEvent("change", { matches: media.matches, media: media.media }));
}

// Public production components, approved local assets, invented presentation inputs.
// No league/data-loader/auth/model module is executed by this fixture.
const names = ["Aster", "Larch", "Copper Comets", "West End", "The Long Named Synthetic Basketball Club", "Fern", "Bayside", "Elm", "Ridge", "Lake"];
const teams: Team[] = names.map((name, index) => ({ id: String(index + 1), name, managerName: `Fixture manager ${index + 1}`,
  avatar: null, wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0 }));
const pairs: Matchup[] = Array.from({ length: 5 }, (_, i) => ({ week: 1, home: teams[i * 2], away: teams[i * 2 + 1], homePoints: null, awayPoints: null }));
const edition: WeeklyEdition = { id: "synthetic-motion", season: "2026", title: "Synthetic local edition", dateLabel: "Synthetic QA · Oct 5–11",
  startsAt: "2026-10-05T00:00:00Z", endsAt: "2026-10-12T00:00:00Z", status: "draft", publishedAt: null,
  game: { title: "Aster meets Larch.", note: "Synthetic opening-week watch", leagueWeek: 1, teamIds: ["1", "2"], state: "upcoming",
    scores: null, context: "Invented fixture context. All probabilities and records below are synthetic, not league results.", selectionReason: "Synthetic featured pairing for source-component QA." },
  playerSpotlights: ["player-of-week", "underperformer", "one-to-watch"].map((role, i) => ({ role: role as "player-of-week" | "underperformer" | "one-to-watch",
    playerId: `fixture-player-${i}`, name: `Synthetic Player ${i + 1}`, position: "C", teamId: teams[i].id, periodLabel: "Synthetic period",
    headline: "Fixture player take.", opinion: "Invented copy for layout inspection.", stats: [{ label: "PPG", value: "20.0" }], statPeriod: "Synthetic prior season",
    selectionReason: "Offline fixture", source: { label: "Local QA", url: "/", checkedAt: "2026-10-11" } })),
  happenings: [], sources: [], };
const home: CourtsideHomeData = {
  hub: { teams, season: { leagueName: "Synthetic QA league", seasonYear: "2026", status: "pre_season", totalTeams: 10, playoffTeams: 6, playoffWeekStart: 20 },
    standings: [], transactions: [], stats: { pointsForLeader: null, pointsAgainstLeader: null, longestWinStreak: null, mostActiveManager: null, biggestBlowout: null, closestGame: null } },
  edition, checkedAt: "2026-10-11T00:00:00Z", rosterNamesAvailable: true,
  directory: teams.map((identity, i) => ({ identity, previousSeason: { season: "2025", wins: 10 + i, losses: 10 - i, finish: i + 1, ownerNote: null },
    currentRecord: null, currentMatchup: pairs[Math.floor(i / 2)], featuredPlayerIds: [], opener: null, recentMove: null, latestMove: null,
    players: Array.from({ length: 4 }, (_, p) => ({ id: `fixture-player-${i}-${p}`, fullName: `Fixture Player ${i + 1}.${p + 1}`, position: "C", nbaTeam: null, espnId: null })) })),
};
const weekly: AiWeeklySlate = { leagueId: "synthetic", season: "2026", week: 1, status: "ready", message: "Synthetic saved picks",
  generatedAt: "2026-10-09T00:00:00Z", snapshot: null,
  matchups: pairs.map((pair, i) => ({ matchupId: `fixture-${i}`, teamIds: [pair.home.id, pair.away.id], status: "ready", message: "Synthetic pick", evidence: ["Synthetic fixture evidence."], baseline: null,
    result: { model: "synthetic-model", promptVersion: "synthetic-v1", choice: pair.home.id, confidence: .21,
      probabilities: [{ choice: pair.home.id, probability: .62 }, { choice: pair.away.id, probability: .38 }], evidence: [], probabilityLabel: AI_PROBABILITY_LABEL, snapshot: null } })), };

function Fixture() {
  const [report, setReport] = useState("Not run. Chrome native media preference is separate from the explicit JS preference-subscription probe.");
  const [running, setRunning] = useState(false);
  async function run() {
    setRunning(true);
    const checks: string[] = [];
    const check = (value: boolean, message: string) => { if (!value) throw new Error(message); checks.push(message); };
    const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
    const dialog = document.querySelector<HTMLDialogElement>("dialog")!;
    const trigger = Array.from(document.querySelectorAll<HTMLButtonElement>("main button")).find(button => button.textContent?.includes("Featured matchup notes"))!;
    const close = dialog.querySelector<HTMLButtonElement>('button[aria-label="Close matchup notes"]')!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const values = () => [...document.querySelectorAll('[data-probability-for]')].map(node => node.innerHTML).join("");
    const initialValues = values();
    try {
      check(document.querySelectorAll('[data-probability-for]').length === 10, "All five pairings and ten static probability bars present");
      check(document.querySelectorAll('details[data-team-id]').length === 10, "Ten native team roster disclosures retained");
      trigger.focus(); trigger.click();
      check(dialog.open && dialog.dataset.motion === "none", "Keyboard-style activation opens immediately without motion");
      check(document.activeElement === close, "Native opening focus is Close");
      check(dialog.querySelector("h2")?.id === dialog.getAttribute("aria-labelledby"), "Visible heading supplies accessible dialog name");
      close.click(); check(!dialog.open && document.activeElement === trigger, "Close immediately restores trigger focus");
      for (let i = 0; i < 6; i++) {
        trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
        check(dialog.open, `Rapid native reopen ${i + 1} accepts input`);
        await pause(20);
        close.click(); check(!dialog.open && document.activeElement === trigger, `Interrupted close ${i + 1} restores focus immediately`);
      }
      await pause(200);
      trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
      await frame();
      check(dialog.dataset.motion === (reduced ? "none" : "pointer"), "Pointer opening follows actual native reduced-motion preference");
      check(reduced || dialog.getAnimations().length > 0, "Normal pointer entry produces native CSS transitions");
      const style = getComputedStyle(dialog);
      check(style.transitionProperty.includes("opacity") || reduced, "Transition is property-specific, with no layout tween");
      await pause(200);
      const maxRect = dialog.getBoundingClientRect();
      check(maxRect.left >= 0 && maxRect.right <= innerWidth && maxRect.height <= innerHeight, "Named notes surface stays within viewport");
      close.click(); await pause(200);
      check(getComputedStyle(dialog).display === "none" && dialog.getAnimations().length === 0, "Closed reader stops animation and leaves no visible top-layer surface");
      trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
      forceMotionPreference(true); await frame();
      check(dialog.dataset.motion === "none" && getComputedStyle(dialog).transform === "none", "Forced live reduced-preference listener stops an open dialog's movement");
      close.click(); trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
      check(dialog.open && dialog.dataset.motion === "none" && dialog.getAnimations().length === 0, "Forced reduced preference retains immediate pointer opening, readable notes and Close");
      close.click(); forceMotionPreference(false);
      check(values() === initialValues, "Numeric labels and probability geometry remain unchanged through all motion");
      check(document.documentElement.scrollWidth <= innerWidth, "No page-wide horizontal overflow at this viewport");
      setReport(`PASS: ${checks.length} checks at ${innerWidth}×${innerHeight}; native reduced-motion=${reduced}\n${checks.join("\n")}`);
    } catch (error) {
      dialog.close(); setReport(`FAIL after ${checks.length} checks: ${String(error)}\n${checks.join("\n")}`);
    } finally { forceMotionPreference(false); setRunning(false); }
  }
  return <>
    <aside className="qa-controls"><strong>Local source-component QA · all team/player/record/probability content is synthetic</strong>
      <p>Approved assets/fonts, real homepage/header/controls. No live providers, account or data loaders. Responsive Chrome checks do not establish physical touch or a screen reader.</p>
      <button type="button" onClick={run} disabled={running}>Run native dialog interruption checks</button>
      <pre role="status">{report}</pre>
    </aside>
    <SiteHeader user={null} logoutAction={async () => {}} />
    <div id="main-content"><CourtsideHome data={home} archive={[edition]} portraits={{}} aiWeekly={weekly} /></div>
  </>;
}
createRoot(document.getElementById("root")!).render(<Fixture />);
