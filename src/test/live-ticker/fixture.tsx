import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { CombinedTicker } from "@/surfaces/stock-market/CombinedTicker";
import { fixtureClock } from "./hook";
import "@/ui/tokens.css";
import "@/app/globals.css";

// Any accidental application fetch fails before sending a request.
window.fetch = async () => { throw new Error("Synthetic fixture forbids fetch"); };
const reduced = new URLSearchParams(window.location.search).has("reduced");
if (reduced) {
  const realMatchMedia = window.matchMedia.bind(window);
  window.matchMedia = (query) => query === "(prefers-reduced-motion: reduce)"
    ? { ...realMatchMedia(query), matches: true } as MediaQueryList
    : realMatchMedia(query);
}

function Fixture() {
  const [snapshot, setSnapshot] = useState(fixtureClock.snapshot);
  const [generation, setGeneration] = useState(0);
  const [mounted, setMounted] = useState(true);
  const [feeds, setFeeds] = useState("all");
  useEffect(() => fixtureClock.subscribe(() => setSnapshot(fixtureClock.snapshot())), []);
  return <>
    {mounted && <CombinedTicker key={generation}
      stocks={feeds === "all" ? [{ playerId: "synthetic-player", playerName: "Synthetic Player", price: 42, changePct: 5, trend: "up" }] : []}
      headlines={feeds === "all" ? [{ text: "Synthetic league headline", publication: "Fixture" }] : []} />}
    <main style={{ padding: "var(--gh-s4)", maxWidth: "70rem", margin: "auto" }}>
      <h1>PR63 · synthetic ticker</h1>
      <p>Production poller and ticker; injected clock/slates. No ESPN or database requests.</p>
      <p>Reduced-motion JS branch: {String(reduced)}</p>
      <label>Feeds <select aria-label="Feeds" value={feeds} onChange={(event) => setFeeds(event.target.value)}>
        <option value="all">News, stocks and scores</option><option value="scores">Scores only</option>
      </select></label>
      <p>
        <button onClick={() => { fixtureClock.reset(false); setGeneration((n) => n + 1); setMounted(true); }}>Cold idle mount</button>{" "}
        <button onClick={() => { fixtureClock.reset(true); setGeneration((n) => n + 1); setMounted(true); }}>Overnight live mount</button>{" "}
        <button onClick={() => fixtureClock.respond("final")}>Provider finals</button>{" "}
        <button onClick={() => fixtureClock.respond("in-progress", "2026-10-09")}>Provider rolls to live</button>{" "}
        <button onClick={() => fixtureClock.respond("scheduled", "2026-10-09")}>Provider scheduled</button>{" "}
        <button onClick={() => fixtureClock.respond("empty", "2026-10-09")}>Provider empty</button>{" "}
        <button onClick={() => fixtureClock.respond("failure")}>Provider failure</button>
      </p>
      <p>
        <button onClick={() => void fixtureClock.advance(30_000)}>Advance 30 seconds</button>{" "}
        <button onClick={() => void fixtureClock.advance(60_000)}>Advance 1 minute</button>{" "}
        <button onClick={() => void fixtureClock.advance(2 * 3_600_000)}>Advance 2 hours</button>{" "}
        <button onClick={() => window.dispatchEvent(new Event("online"))}>Online event</button>{" "}
        <button onClick={() => document.dispatchEvent(new Event("visibilitychange"))}>Visible event</button>{" "}
        <button onClick={() => setMounted(false)}>Unmount ticker</button>
      </p>
      <output aria-label="Poller observations"><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{JSON.stringify(snapshot, null, 2)}</pre></output>
    </main>
  </>;
}
createRoot(document.getElementById("root")!).render(<Fixture />);
