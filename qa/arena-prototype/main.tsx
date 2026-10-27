import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { CourtsideHome } from "@/surfaces/season-hub/CourtsideHome";
import { SiteHeader } from "@/ui/SiteHeader";
import { SiteFooter } from "@/ui/SiteFooter";
import controls from "@/ui/controls.module.css";
import { arenaFixture, portraits } from "./fixture";
import { presentation } from "./presentation";
import "@/ui/tokens.css";
import "@/app/globals.css";
import "./review.css";

type SceneMode = "loading" | "ready" | "still" | "unavailable";
type SceneController = { dispose: () => void; redraw: () => void };
const query = new URLSearchParams(location.search);

/** User question: how does the whole homepage feel inside our arena?
 * Primary action: compare public/member layouts, use existing page controls.
 * States: 3D/still/failure, light/dark, public/member, missing editorial.
 * Narrow: same content/controls, one scene, narrow reading column.
 * Forbidden: production imports of this fixture, hidden content, new metrics. */
function Review() {
  const [member, setMember] = useState(query.get("view") === "member");
  const [still, setStill] = useState(query.get("scene") === "still");
  const [missing, setMissing] = useState(query.get("edition") === "missing");
  const [mode, setMode] = useState<SceneMode>("loading");
  const [reduced, setReduced] = useState(matchMedia("(prefers-reduced-motion: reduce)").matches);
  const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<SceneController | null>(null);
  const data = useMemo(() => arenaFixture(member, missing), [member, missing]);

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const changed = () => setReduced(media.matches);
    media.addEventListener("change", changed);
    return () => media.removeEventListener("change", changed);
  }, []);
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (still || reduced || connection?.saveData) return;
    let alive = true;
    void import("./scene").then(async ({ mountArena }) => {
      await document.fonts.ready;
      if (!alive || !host.current) return;
      controller.current = await mountArena(host.current, status => { if (alive) setMode(status); });
      if (!alive) controller.current?.dispose();
    }).catch(() => { if (alive) setMode("unavailable"); });
    return () => { alive = false; controller.current?.dispose(); controller.current = null; };
  }, [still, reduced]);

  const actualMode = still || reduced || saveData ? "still" : mode;
  return <>
    <style>{query.get("style") === "baseline" ? "" : presentation}</style>
    <div ref={host} className="arena-world" aria-hidden="true" />
    <div className="arena-haze" aria-hidden="true" />
    <aside className="review-toolbar" aria-label="Prototype controls">
      <div className="review-label"><strong>GOAT / Arena study</strong><span>Offline design · sample scores & prices</span></div>
      <div className="review-controls">
        <button className={controls.secondary} aria-pressed={member} onClick={() => setMember(!member)}>{member ? "Your edition" : "League edition"}<span aria-hidden="true"> ↔</span></button>
        <button className={controls.secondary} aria-pressed={still || reduced || saveData} disabled={reduced || saveData} onClick={() => setStill(!still)}>{still || reduced || saveData ? "Still arena" : "3D arena"}</button>
        <details className="review-options"><summary>States</summary><label><input type="checkbox" checked={missing} onChange={event => setMissing(event.target.checked)} /> Missing editorial</label></details>
      </div>
    </aside>
    <SiteHeader user={member ? { displayName: "Aidan · sample", teamId: "1", avatar: null } : null} logoutAction={async () => setMember(false)} />
    <div className="arena-location" aria-hidden="true"><span>HOME COURT</span><span>GOAT HOOPERS · EST. 2025</span><span>10 TEAMS / ONE HOUSE</span></div>
    <main className="arena-study" id="main-content" tabIndex={-1} data-arena-ready={actualMode === "ready"} data-review-view={member ? "member" : "public"}>
      <CourtsideHome data={data.home} archive={data.archive} portraits={portraits} personal={data.personal}
        aiWeekly={data.weekly} faces={data.faces} viewerTeamId={member ? "1" : undefined} />
    </main>
    <p className="review-receipt">Design review only · dated Oct 8 roster identities and sample editorial · synthetic current scores, prices, form and AI picks · {actualMode === "ready" ? "One still-rendered 3D scene" : "Static arena fallback"} · no live data or account actions.</p>
    <SiteFooter season={data.home.hub?.season ?? null} />
    <output className="review-status" aria-live="polite">{actualMode === "unavailable" ? "3D unavailable. Static arena retained." : reduced ? "Reduced motion: static arena." : ""}</output>
  </>;
}

createRoot(document.getElementById("root")!).render(<Review />);
