import { createRoot } from "react-dom/client";
import { SiteHeader } from "@/ui/SiteHeader";
import { SiteChrome } from "@/ui/SiteChrome";
import { MobileNav } from "@/ui/MobileNav";
import { CombinedTicker } from "@/surfaces/stock-market/CombinedTicker";
import { StockMarket } from "@/surfaces/stock-market/StockMarket";
import { TrophyRoom } from "@/surfaces/history/TrophyRoom";
import { SectionNav } from "@/ui/SectionNav";
import { CourtsideHome } from "@/surfaces/season-hub/CourtsideHome";
import { syntheticStocks } from "./stocks";
import { syntheticHome } from "./home";
import { FreeThrowPractice } from "@/surfaces/arcade/free-throw/FreeThrowPractice";
import { PRACTICE_ASSETS, PRACTICE_COURT } from "@/domain/arcade/free-throw";
import { SEASON_2025_CHAMPION, LEAGUE_RECORDS_2025, HALL_OF_FAME } from "@/data/history-2025";
import { SiteFooter } from "@/ui/SiteFooter";
import "@/ui/tokens.css";
import "@/app/globals.css";

// Only approved, same-origin game assets may be fetched. Data/providers stay blocked.
const assetFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input), location.origin);
  const method = init?.method ?? (input instanceof Request ? input.method : "GET");
  if (location.pathname === "/arcade/free-throw" && url.origin === location.origin &&
      url.pathname.startsWith("/3d/free-throw/") && url.pathname.endsWith(".glb") && method === "GET") return assetFetch(input, init);
  throw new Error("Shell fixture forbids application fetch");
};
const params = new URLSearchParams(window.location.search);
const user = params.has("user") ? { displayName: "Synthetic manager with a very long display name", teamId: "1" } : null;
const ticker = params.has("ticker") ? <CombinedTicker stocks={[]} headlines={[{ text: "Synthetic shell layout fixture · no live data", publication: "Fixture" }]} /> : null;
const logout = async () => { throw new Error("Synthetic logout must never be submitted"); };
const content = window.location.pathname.startsWith("/stocks") ? <>
  <SectionNav current="stocks" />
  <StockMarket market={{ stocks: params.has("populated") ? syntheticStocks : [], trending: [], falling: [], panic: [], updatedAt: Date.UTC(2026, 9, 8), hasHistory: false, pricingBasis: "preseason" }} />
</> : window.location.pathname === "/arcade/free-throw" ? <FreeThrowPractice court={PRACTICE_COURT} assets={PRACTICE_ASSETS} />
  : window.location.pathname === "/" ? <CourtsideHome data={syntheticHome} archive={[]} portraits={{}} />
  : <TrophyRoom history={{ founded: "2025", champions: params.has("history") ? [SEASON_2025_CHAMPION] : [], records: params.has("history") ? LEAGUE_RECORDS_2025 : [], hallOfFame: params.has("history") ? HALL_OF_FAME : [] }} />;

// Match the root layout's direct-child stacking before and after the repair.
const style = document.createElement("style");
style.textContent = "#root { display: contents; } :where(#root) > * { position: relative; z-index: 1; }";
document.head.append(style);
createRoot(document.getElementById("root")!).render(<>
  <SiteChrome>{ticker}<SiteHeader user={user} logoutAction={logout} /></SiteChrome>
  <div id="main-content" tabIndex={-1}>{content}</div>
  <p style={{ padding: "var(--gh-s4)" }}>Local shell fixture. Static 2025 history matches the repository. Named synthetic quote/home examples are layout-only. No live requests.</p>
  <SiteFooter season={null} />
  <MobileNav user={user} />
</>);
