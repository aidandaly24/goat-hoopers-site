import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import type { TeamProfile as TeamProfileData, FranchiseHistory } from "@/domain";
import { TeamProfile } from "@/surfaces/teams/TeamProfile";
import { PropViewer } from "../../PropViewer";
import "@/ui/tokens.css";
import "./fixture.css";

// Standalone local fixture: synthetic domain props, local GLBs, no app layout,
// data loaders, hosted images, auth, database, or production routes.
const mode = new URLSearchParams(location.search).get("mode") ?? "normal";
const getContext = HTMLCanvasElement.prototype.getContext;
if (mode === "disabled") {
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
    if (type.startsWith("webgl")) return null;
    return getContext.call(this, type, ...args);
  } as typeof getContext;
}
if (mode === "load-error") {
  const localFetch = window.fetch;
  window.fetch = (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.includes("/3d/")) return Promise.resolve(new Response("Broken local fixture", { status: 404 }));
    return localFetch(input, init);
  };
}

const profile: TeamProfileData = {
  team: { id: "8", name: "Offline Hoopers", managerName: "Fixture Manager", avatar: null, wins: 5, losses: 2, ties: 0, pointsFor: 123456, pointsAgainst: 112233 },
  players: [{ id: "fixture-player", fullName: "Fixture Guard", position: "PG", nbaTeam: "TST", espnId: null }],
  matchups: [], streak: 2, draftPicks: [], transactions: [],
};
const franchise: FranchiseHistory = {
  teamId: "8", teamName: profile.team.name, founded: "2025", championships: 0, finalsAppearances: 0,
  allTime: { wins: 5, losses: 2 }, titleSeasons: [],
  timeline: [{ year: "2025", title: "Synthetic franchise history", description: "Offline fixture data only." }],
};

function Fixture() {
  const [generation, setGeneration] = useState(0);
  const [mounted, setMounted] = useState(true);
  return (
    <main>
      <p>Local viewer fixture: {mode}</p>
      <div className="fixtureControls">
        <button onClick={() => setGeneration((value) => value + 1)}>Remount viewer</button>
        <button onClick={() => setMounted((value) => !value)}>{mounted ? "Unmount" : "Mount"}</button>
        <button onClick={() => {
          const canvas = document.querySelector("canvas");
          const context = canvas?.getContext("webgl2");
          context?.getExtension("WEBGL_lose_context")?.loseContext();
        }}>Lose real WebGL context</button>
      </div>
      {mounted ? <TeamProfile key={generation} profile={profile} teams={[profile.team]} franchise={franchise} /> : <p>Viewer unmounted</p>}
      <div className="fixtureProp"><PropViewer prop="basketball" /></div>
      <a href="#fixture-end">Surrounding page link</a>
      <p id="fixture-end">End of local fixture</p>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><Fixture /></StrictMode>);
