import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import "@/ui/tokens.css";
import "./globals.css";
import { getCurrentUser, logout } from "@/app/actions";
import { SiteHeader } from "@/ui/SiteHeader";

const display = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const body = Inter({
  variable: "--font-body",
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
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <SiteHeader
          user={user ? { displayName: user.displayName } : null}
          logoutAction={logout}
        />
        {children}
      </body>
    </html>
  );
}
