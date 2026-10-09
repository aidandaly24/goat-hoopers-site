export type LeagueSection = "transactions" | "teams" | "intel" | "stocks" | "trade-analyzer";

/** Compatibility seam for unchanged league-page owners. All these destinations
 * now live in root-owned navigation; no second global bar is injected here. */
export function SectionNav(props: { current: LeagueSection }) {
  void props;
  return null;
}
