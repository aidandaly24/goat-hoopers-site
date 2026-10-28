import Link from "next/link";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { SiteHeader } from "@/ui/SiteHeader";
import controls from "@/ui/controls.module.css";
import type { arenaFixture } from "../fixture";
import { zones, destinationFromUrl, type Anchor, type Destination } from "./model";
import "@/ui/tokens.css";
import "@/app/globals.css";
import "./style.css";

const Content = lazy(() => import("./Content"));
type Fixture = ReturnType<typeof arenaFixture>;
type Court = Awaited<ReturnType<typeof import("./scene").mountCourt>>;
const query = new URLSearchParams(location.search);
const initialPlace = destinationFromUrl();
history.replaceState({ ...history.state, goatHub: true, depth: 0 }, "");
const initialAnchors: Anchor[] = zones.map(zone => ({ id: zone.id, x: zone.fallback[0], y: zone.fallback[1] }));

/** QA exploration: where do I go in our home court?
 * Primary action: select a physical destination and inspect real HTML content.
 * Public/member, mobile, keyboard, reduced/still/failure, direct URL and Back.
 * Never: production loaders, invented Power/history/recaps, mandatory camera play. */
function HomeCourt() {
  const [member, setMember] = useState(query.get("view") === "member");
  const [still, setStill] = useState(query.get("scene") === "still");
  const [reduced, setReduced] = useState(matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [saveData, setSaveData] = useState(Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData));
  const [mode, setMode] = useState<"loading" | "ready" | "unavailable">("loading");
  const [place, setPlace] = useState<Destination | null>(initialPlace);
  const [data, setData] = useState<Fixture | null>(null);
  const [anchors, setAnchors] = useState(initialAnchors);
  const host = useRef<HTMLDivElement>(null), court = useRef<Court | null>(null);
  const dialog = useRef<HTMLDialogElement>(null), heading = useRef<HTMLHeadingElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null), placeRef = useRef(place);
  const closingToArena = useRef(false);
  const body = useRef<HTMLDivElement>(null);
  const fallback = still || reduced || saveData || mode === "unavailable";

  const open = useCallback((next: Destination, trigger?: HTMLElement) => {
    if (closingToArena.current) return;
    if (!placeRef.current) lastTrigger.current = trigger ?? document.querySelector<HTMLElement>(`[data-destination="${next}"]`);
    if (next === placeRef.current) return;
    const depth = history.state?.goatHub ? history.state.depth + 1 : 1;
    history.pushState({ goatHub: true, depth }, "", `#place=${next}`);
    placeRef.current = next; setPlace(next);
  }, []);
  const close = useCallback(() => {
    if (closingToArena.current) return;
    const depth = history.state?.goatHub ? history.state.depth : 0;
    if (depth > 0) { closingToArena.current = true; history.go(-depth); }
    else { history.replaceState({ goatHub: true, depth: 0 }, "", location.pathname + location.search); placeRef.current = null; setPlace(null); }
  }, []);

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
    const dataChanged = () => setSaveData(Boolean(connection?.saveData));
    media.addEventListener("change", change); connection?.addEventListener("change", dataChanged);
    return () => { media.removeEventListener("change", change); connection?.removeEventListener("change", dataChanged); };
  }, []);
  useEffect(() => {
    const pop = () => {
      let next = destinationFromUrl();
      if (closingToArena.current) {
        history.replaceState({ goatHub: true, depth: 0 }, "", location.pathname + location.search);
        closingToArena.current = false; next = null;
      }
      placeRef.current = next; setPlace(next);
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    let alive = true;
    void import("../fixture").then(({ arenaFixture }) => { if (alive) setData(arenaFixture(member, query.get("edition") === "missing")); });
    return () => { alive = false; };
  }, [member]);
  useEffect(() => {
    if (still || reduced || saveData) return;
    let alive = true, mounted: Court | null = null;
    void import("./scene").then(async ({ mountCourt }) => {
      await document.fonts.ready;
      if (!alive || !host.current) return;
      mounted = await mountCourt(host.current, status => { if (alive) setMode(status); }, points => { if (alive) setAnchors(points); }, id => open(id));
      if (!alive) mounted.dispose();
      else { court.current = mounted; mounted.select(placeRef.current === "edition" ? null : placeRef.current, true); }
    }).catch(() => { if (alive) setMode("unavailable"); });
    return () => { alive = false; mounted?.dispose(); court.current = null; };
  }, [still, reduced, saveData, open]);
  useEffect(() => {
    const reader = dialog.current;
    if (!reader) return;
    court.current?.select(place === "edition" ? null : place);
    if (place) {
      if (!lastTrigger.current) lastTrigger.current = document.querySelector<HTMLElement>(`[data-directory="${place}"]`);
      if (!reader.open) reader.showModal();
      body.current?.scrollTo(0, 0);
      heading.current?.focus({ preventScroll: true });
    } else if (reader.open) {
      reader.close(); lastTrigger.current?.focus({ preventScroll: true });
    }
  }, [place]);

  const current = zones.find(zone => zone.id === place);
  const summary = data?.personal.kind === "member" ? data.personal.summary : null;
  const matchup = summary?.matchup ?? data?.home.directory[0]?.currentMatchup;
  const positions = fallback ? initialAnchors : anchors;
  return <div className="hub-shell" data-mode={fallback ? "still" : mode} data-member={member} onKeyUpCapture={event => {
    if (event.key === "Escape") requestAnimationFrame(() => {
      const focused = document.activeElement;
      if (focused instanceof HTMLElement && focused.closest(".hub-header")) focused.scrollIntoView({ block: "nearest", behavior: "instant" });
    });
  }}>
    <div className="hub-header"><SiteHeader user={member ? { displayName: "Aidan · sample", teamId: "1", avatar: null } : null} logoutAction={async () => setMember(false)} /></div>
    <Link className="hub-skip" href="#arena-directory">Skip to arena destinations</Link>
    <main className="hub-stage" id="main-content" tabIndex={-1} aria-labelledby="hub-title" data-reader-open={Boolean(place)}>
      <div ref={host} className="hub-court" aria-hidden="true" />
      <div className="hub-intro">
        <p className="hub-kicker">GOAT HOOPERS / EST. 2025</p>
        <h1 id="hub-title">{member ? "Your home court." : "Ten teams. One house."}</h1>
        <p>{summary ? `${summary.team.name} · ${summary.coverage.roster} players${summary.standing ? ` · No. ${summary.standing.rank} in the sample table` : ""}` : "The matchup. The players. The whole league. Pick your place."}</p>
        <p className="hub-compact-hint">Choose a place from the names below the court.</p>
      </div>
      <nav className="hub-pins" aria-label="Places in the arena">
        {zones.map(zone => { const point = positions.find(item => item.id === zone.id)!; return <button key={zone.id} type="button"
          className="hub-pin" style={{ left: `${Math.max(9, Math.min(91, point.x))}%`, top: `${Math.max(23, Math.min(86, point.y))}%` }}
          data-destination={zone.id} data-personal={member && zone.id === "team"} onClick={event => open(zone.id, event.currentTarget)}
          aria-label={`${zone.title} — ${zone.place}`} aria-haspopup="dialog" aria-controls="hub-reader" aria-expanded={place === zone.id}>
          <span className="hub-pin-number">{zone.number}</span><span className="hub-pin-label"><strong>{zone.title}</strong><small>{zone.place}</small></span>
        </button>; })}
      </nav>
      {matchup && <button className="hub-matchup" aria-haspopup="dialog" aria-controls="hub-reader" onClick={event => open("matchup", event.currentTarget)}>
        <small>{member ? "Your matchup" : "Featured matchup"} · Week {matchup.week} · sample</small>
        <strong>{matchup.home.name} <span>vs</span> {matchup.away.name}</strong>
      </button>}
      <div className="hub-manual" aria-label="Arena camera">
        <button className={controls.secondary} disabled={fallback} aria-label="Turn arena left" onClick={() => court.current?.turn(-1)}>↶</button>
        <button className={controls.secondary} disabled={fallback} aria-label="Turn arena right" onClick={() => court.current?.turn(1)}>↷</button>
        <span role="status">{fallback ? reduced ? "Reduced motion · still arena" : "Still arena · every place stays open" : mode === "ready" ? "Select a place in the arena" : "Opening the court…"}</span>
      </div>
    </main>
    <nav className="hub-directory" id="arena-directory" tabIndex={-1} aria-label="Arena destination directory">
      {zones.map(zone => <button key={zone.id} data-directory={zone.id} aria-haspopup="dialog" aria-controls="hub-reader" aria-expanded={place === zone.id} onClick={event => open(zone.id, event.currentTarget)}>
        <span>{zone.number}</span><strong>{zone.title}</strong><small>{zone.detail}</small>
      </button>)}
    </nav>
    <footer className="hub-note"><span>Isolated design exploration · dated identities/editorial · synthetic current data</span><div className="hub-review" aria-label="Prototype view controls">
      <button className={controls.secondary} aria-pressed={member} onClick={() => setMember(!member)}>{member ? "Your view" : "League view"} ↔</button>
      <button className={controls.secondary} aria-pressed={fallback} disabled={reduced || saveData} onClick={() => setStill(!still)}>{fallback ? "Still arena" : "3D arena"}</button>
    </div><button onClick={event => open("edition", event.currentTarget)}>Complete league edition</button><Link href="./index.html">Previous study</Link></footer>
    <dialog ref={dialog} id="hub-reader" className="hub-reader" aria-labelledby="reader-title" onCancel={event => { event.preventDefault(); close(); }}>
      <header className="hub-reader-head"><div><p>{current?.place ?? "The complete league edition"}</p><h2 ref={heading} id="reader-title" tabIndex={-1}>{current?.title ?? "Everything in our house."}</h2></div><button className={controls.secondary} onClick={close} aria-label="Close reader and return to arena">Arena ×</button></header>
      <div className="hub-reader-tools"><label>Go to <select aria-label="Choose arena destination" value={place ?? "edition"} onChange={event => open(event.target.value as Destination)}>{zones.map(zone => <option key={zone.id} value={zone.id}>{zone.title}</option>)}<option value="edition">Complete edition</option></select></label><span>Sample edition · current values are synthetic</span></div>
      <div ref={body} className="hub-reader-body" onClick={event => {
        const link = (event.target as Element).closest<HTMLAnchorElement>('a[href="#ai-decides"]');
        if (link) { event.preventDefault(); document.querySelector("#ai-decides")?.scrollIntoView({ behavior: "instant", block: "start" }); }
      }}>
        <Suspense fallback={<p role="status">Opening the league edition…</p>}>{data && place && <Content data={data} place={place} member={member} />}</Suspense>
        <nav className="hub-related" aria-label="More league destinations"><Link href="/stocks">Stocks</Link><Link href="/trade-analyzer">Trade Analyzer</Link><Link href="/intel">Power & league intel</Link><Link href="/history">History</Link><Link href="/transactions">Transactions</Link><Link href="/weekly">Weekly archive</Link></nav>
      </div>
    </dialog>
  </div>;
}
createRoot(document.getElementById("root")!).render(<HomeCourt />);
