/** Small shared destination list supplied by the root layout, not a route registry. */
export type SiteDestination = {
  href: string;
  label: string;
  group: "primary" | "league" | "account";
  footer?: boolean;
};
export const SITE_DESTINATIONS: readonly SiteDestination[] = [
  { href: "/", label: "Home", group: "primary", footer: true },
  { href: "/news", label: "News", group: "primary" },
  { href: "/stocks", label: "Stocks", group: "primary" },
  { href: "/history", label: "History", group: "primary" },
  { href: "/arcade", label: "Arcade", group: "primary", footer: true },
  { href: "/teams", label: "Teams", group: "league", footer: true },
  { href: "/transactions", label: "Transactions", group: "league", footer: true },
  { href: "/draft", label: "Draft", group: "league" },
  { href: "/intel", label: "Intel", group: "league" },
  { href: "/ai-decides", label: "AI Decides", group: "league" },
  { href: "/trade-analyzer", label: "Trade Analyzer", group: "league" },
  { href: "/weekly", label: "Weekly archive", group: "league", footer: true },
  { href: "/team", label: "My Team", group: "account" },
];
