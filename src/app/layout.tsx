import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import "@/ui/tokens.css";
import "./globals.css";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
