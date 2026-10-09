import type { TransactionType } from "@/domain";

export type TransactionFilterState = {
  type: TransactionType | "all";
  team: string;
};

export function readTransactionFilters(
  query: Pick<URLSearchParams, "get">,
  teamIds: readonly string[]
): TransactionFilterState {
  const type = query.get("type");
  const team = query.get("team");
  return {
    type: type === "trade" || type === "waiver" || type === "free_agent" ? type : "all",
    team: team !== null && teamIds.includes(team) ? team : "all",
  };
}

/** Change only this surface's two owned keys, retaining other queries/hash. */
export function transactionFilterHref(href: string, state: TransactionFilterState): string {
  const url = new URL(href, "https://fixture.invalid");
  for (const key of ["team", "type"] as const) {
    if (state[key] === "all") url.searchParams.delete(key);
    else url.searchParams.set(key, state[key]);
  }
  return url.pathname + url.search + url.hash;
}
