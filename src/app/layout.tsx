import type { Metadata } from "next";
import { Anton, Geist_Mono, Inter } from "next/font/google";
import type { PlayerStock } from "@/domain";
import "@/ui/tokens.css";
import "./globals.css";
import { getCurrentUser, logout } from "@/app/actions";
import { getSeasonMeta, getStockMarketData } from "@/data/league";
import { SiteHeader } from "@/ui/SiteHeader";
import { SiteFooter } from "@/ui/SiteFooter";
import { MobileNav } from "@/ui/MobileNav";
import { StockTicker } from "@/surfaces/stock-market/StockTicker";

/* Display: condensed arena-signage energy for headlines and scores. */
const display = Anton({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

/* Body/UI: neutral, excellent at small sizes. */
const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

/* Data: every stat, score, record, timestamp, and FAAB amount. */
const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GOAT Hoopers — Fantasy Basketball League",
  description:
    "Live hub for the GOAT Hoopers Sleeper dynasty league: standings, draft board, and league activity.",
};

/**
 * The header reads the session cookie, so every route must render
 * per-request: a statically prerendered (or ISR-revalidated) page would
 * bake in one visitor's account state and serve it to everyone else.
 * Deliberate tradeoff for a ten-manager league site — correctness of
 * the account state beats static caching.
 */
export const dynamic = "force-dynamic";

/**
 * Site-wide player stock ticker. Sits above the header (both stick —
 * the ticker at top:0, the header just below it). Fails silent: a
 * market outage renders nothing rather than breaking the page.
 */
async function Ticker() {
  let stocks: PlayerStock[] = [];
  try {
    const market = await getStockMarketData();
    stocks = market.stocks;
  } catch {
    stocks = [];
  }
  return <StockTicker stocks={stocks} />;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Session lookup for the site-wide header. Null when logged out or when
  // the database isn't provisioned yet — the header renders the
  // logged-out state either way instead of crashing the page.
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  // Season metadata for the footer. Best-effort: a failed fetch renders
  // the footer without the season line rather than failing the page.
  const season = await getSeasonMeta();
  const headerUser = user
    ? { displayName: user.displayName, teamId: user.teamId }
    : null;
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body>
        <Ticker />
        <SiteHeader user={headerUser} logoutAction={logout} />
        {children}
        <SiteFooter season={season} />
        <MobileNav user={headerUser} />
      </body>
    </html>
  );
}
