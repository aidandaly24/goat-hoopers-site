import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import "@/ui/tokens.css";
import "./globals.css";
import { getCurrentUser, logout } from "@/app/actions";
import { getSeasonMeta } from "@/data/league";
import { SiteHeader } from "@/ui/SiteHeader";
import { SiteFooter } from "@/ui/SiteFooter";
import { MobileNav } from "@/ui/MobileNav";

/* Display: Barlow Condensed 800 — the sports-desk headline voice.
 * Set huge, sentence case. Never all-caps-everything. */
const display = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
});

/* Serif accent: Instrument Serif italic — pull quotes, editorial
 * asides, power-ranking titles. The human voice. */
const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

/* Body/UI: Barlow — clean, readable, with a little character. */
const body = Barlow({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/* Data: IBM Plex Mono — every stat, score, record, timestamp, FAAB.
 * Tabular numerals, instrument-like. */
const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
      className={`${display.variable} ${serif.variable} ${body.variable} ${mono.variable}`}
    >
      <body>
        <SiteHeader user={headerUser} logoutAction={logout} />
        {children}
        <SiteFooter season={season} />
        <MobileNav user={headerUser} />
      </body>
    </html>
  );
}
