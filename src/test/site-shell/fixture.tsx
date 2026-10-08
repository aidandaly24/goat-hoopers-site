import { createRoot } from "react-dom/client";
import { SiteHeader } from "@/ui/SiteHeader";
import { SiteChrome } from "@/ui/SiteChrome";
import { MobileNav } from "@/ui/MobileNav";
import { CombinedTicker } from "@/surfaces/stock-market/CombinedTicker";
import { StockMarket } from "@/surfaces/stock-market/StockMarket";
import { TrophyRoom } from "@/surfaces/history/TrophyRoom";
import { SectionNav } from "@/ui/SectionNav";
import "@/ui/tokens.css";
import "@/app/globals.css";

// Requests may never reach an application data loader, provider or database.
window.fetch = async () => { throw new Error("Shell fixture forbids application fetch"); };
const params = new URLSearchParams(window.location.search);
const user = params.has("user") ? { displayName: "Synthetic manager with a very long display name", teamId: "1" } : null;
const ticker = params.has("ticker") ? <CombinedTicker stocks={[]} headlines={[{ text: "Synthetic shell layout fixture · no live data", publication: "Fixture" }]} /> : null;
const logout = async () => { throw new Error("Synthetic logout must never be submitted"); };
const content = window.location.pathname.startsWith("/stocks") ? <>
  <SectionNav current="stocks" />
  <StockMarket market={{ stocks: [], trending: [], falling: [], panic: [], updatedAt: Date.UTC(2026, 9, 8), hasHistory: false, pricingBasis: "preseason" }} />
</> : <TrophyRoom history={{ founded: "2025", champions: [], records: [], hallOfFame: [] }} />;

// Match the root layout's direct-child stacking before and after the repair.
const style = document.createElement("style");
style.textContent = "#root { display: contents; } :where(#root) > * { position: relative; z-index: 1; }";
document.head.append(style);
createRoot(document.getElementById("root")!).render(<>
  <SiteChrome>{ticker}<SiteHeader user={user} logoutAction={logout} /></SiteChrome>
  <div id="main-content" tabIndex={-1}>{content}</div>
  <p style={{ padding: "var(--gh-s4)" }}>Synthetic shell fixture. Empty lists are deliberate; no results or honors are invented.</p>
  <MobileNav user={user} />
</>);
