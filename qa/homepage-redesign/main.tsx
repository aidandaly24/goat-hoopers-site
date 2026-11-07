import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { CourtsideHome } from "@/surfaces/season-hub/CourtsideHome";
import { SiteHeader } from "@/ui/SiteHeader";
import { SiteFooter } from "@/ui/SiteFooter";
import controls from "@/ui/controls.module.css";
import { homepageFixture, portraits } from "./fixture";
import { presentation } from "./presentation";
import "@/ui/tokens.css";
import "@/app/globals.css";
import "./review.css";

const query = new URLSearchParams(location.search);

/** Surface contract: find this week's matchup and the next useful action.
 * Member: My team / roster. Public: inspect matchup/teams. Same underlying
 * CourtsideHome, including missing-edition/unknown data and every disclosure.
 * Narrow layout preserves reading order and targets. No new data requests,
 * production logic, fake Power rankings, 3D or generic feature-card grid. */
function Review() {
  const [member, setMember] = useState(query.get("view") === "member");
  const [missing, setMissing] = useState(query.get("edition") === "missing");
  const baseline = query.get("style") === "baseline";
  const aiState = query.get("ai") === "stale" ? "stale" : query.get("ai") === "missing" ? "missing" : "ready";
  const data = useMemo(() => homepageFixture(member, missing, aiState), [member, missing, aiState]);
  return <>
    {!baseline && <style>{presentation}</style>}
    <details className="review-toolbar" aria-label="Prototype controls">
      <summary>Homepage study · synthetic current scores, prices, form & AI <span>Review controls +</span></summary>
      <div className="review-controls">
        <button className={controls.secondary} aria-pressed={member} onClick={() => setMember(!member)}>{member ? "Your edition" : "League edition"}</button>
        <label><input type="checkbox" checked={missing} onChange={event => setMissing(event.target.checked)} /> Missing editorial</label>
        <a href={`/?view=${member ? "member" : "public"}${baseline ? "" : "&style=baseline"}`}>{baseline ? "See redesign" : "Compare current"}</a>
      </div>
    </details>
    <SiteHeader user={member ? { displayName: "Aidan · sample", teamId: "1", avatar: null } : null} logoutAction={async () => setMember(false)} />
    <main key={missing ? "missing" : "edition"} className={baseline ? "baseline-home" : "editorial-study"} id="main-content" tabIndex={-1} data-review-view={member ? "member" : "public"}>
      <CourtsideHome data={data.home} archive={data.archive} portraits={portraits} personal={data.personal}
        aiWeekly={data.weekly} faces={data.faces} viewerTeamId={member ? "1" : undefined} />
    </main>
    <p className="review-receipt">Design review only. Dated Oct 8 roster identities & editorial; synthetic current scores, prices, form, news and AI picks. No live data, account actions, Power producer or unpublished recap integration.</p>
    <SiteFooter season={data.home.hub?.season ?? null} />
  </>;
}

createRoot(document.getElementById("root")!).render(<Review />);
