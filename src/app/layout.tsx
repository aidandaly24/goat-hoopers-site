import type { Metadata } from "next";
import { Anton, Geist_Mono, Inter } from "next/font/google";
import type { PlayerStock } from "@/domain";
import "@/ui/tokens.css";
import "./globals.css";
import { getCurrentUser, logout } from "@/app/actions";
import { getSeasonMeta, getStockMarketData, getLeagueNews } from "@/data/league";
import { SiteHeader } from "@/ui/SiteHeader";
import { SiteFooter } from "@/ui/SiteFooter";
import { SITE_DESTINATIONS } from "@/ui/siteDestinations";
import {
  CombinedTicker,
  type TickerHeadline,
  type TickerStock,
} from "@/surfaces/stock-market/CombinedTicker";

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

const siteUrl = new URL("https://goathoopers.com");
const siteTitle = "GOAT Hoopers — Fantasy Basketball League";
const siteDescription =
  "Live hub for the GOAT Hoopers Sleeper dynasty league: standings, draft board, and league activity.";
// Public JPEG derived from blender/goat-hoopers-render.png for link previews.
const shareImage = {
  url: new URL("/social/goat-hoopers-blender-1200x630.jpg", siteUrl).href,
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: "Blender render of basketball players on a hardwood court beneath the gold GOAT Hoopers title.",
};

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    type: "website",
    siteName: "GOAT Hoopers",
    title: siteTitle,
    description: siteDescription,
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [{ url: shareImage.url, alt: shareImage.alt }],
  },
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
 * Site-wide ticker, ESPN style: alternates league news headlines with
 * stock quotes. Fails silent: a market/news outage renders nothing rather
 * than breaking the page.
 */
async function Ticker() {
  let stocks: TickerStock[] = [];
  let headlines: TickerHeadline[] = [];
  try {
    const [market, news] = await Promise.all([
      getStockMarketData(),
      getLeagueNews(),
    ]);
    // Slim DTO: the ticker renders 25 names/prices — never ship the full
    // 1.2 KB PlayerStock (factors/history) to every page. See issue #16.
    stocks = market.stocks.slice(0, 25).map((s) => ({
      playerId: s.playerId,
      playerName: s.playerName,
      price: s.price,
      trend: s.trend,
      changePct: s.changePct,
    }));
    headlines = news.slice(0, 12).map((a) => ({
      text: a.headline,
      publication: a.outlet.name,
    }));
  } catch {
    stocks = [];
    headlines = [];
  }
  if (stocks.length === 0 && headlines.length === 0) return null;
  return <CombinedTicker stocks={stocks} headlines={headlines} />;
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
        <SiteHeader user={headerUser} logoutAction={logout} destinations={SITE_DESTINATIONS} ticker={<Ticker />} />
        <div id="main-content" tabIndex={-1}>{children}</div>
        <SiteFooter season={season} destinations={SITE_DESTINATIONS.filter(d => d.footer)} />
      </body>
    </html>
  );
}
