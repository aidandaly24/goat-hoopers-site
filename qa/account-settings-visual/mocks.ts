import type { Player, Team, TeamRosterValue } from "../../src/domain";
const query = () => new URL(window.location.href).searchParams;
export const fixtureState = () => query().get("state") ?? "linked";
export const friendsEnrollmentEnabled = () => fixtureState() !== "disabled";
export const friendsAuthEnabled = () => !["disabled", "enrollment"].includes(fixtureState());
const long = () => query().get("long") === "1";
export const fixtureName = () => long() ? "SyntheticManagerWithAnExceptionallyLongUnbrokenAccountNameForReflow" : "Fixture Manager";
export async function getVerifiedAccount() {
  if (fixtureState() === "error") throw new Error("Synthetic private account failure");
  return fixtureState() === "signed-out" ? null : { subject: "fixture-account", sessionId: "fixture-session", name: fixtureName() };
}
export async function getProviderUser() {
  return ["unlinked", "enrollment", "signed-out"].includes(fixtureState()) ? null : { id: "fixture-member", teamId: "3", displayName: fixtureName(), createdAt: new Date(0) };
}
export const getCurrentUser = getProviderUser;
export async function headers() { return new Headers({ "X-Fixture": "synthetic" }); }
export function usePathname() { return window.location.pathname; }
export function useRouter() { return { replace: (path: string) => window.location.replace(path), refresh: () => window.location.reload() }; }
export function redirect(path: string): never { throw Object.assign(new Error("Fixture redirect"), { fixtureRedirect: path }); }

export const fixtureTeam = (): Team => ({ id: "3", name: long() ? "Synthetic Basketball Club With An Exceptionally Long Franchise Name" : "Fixture Hoopers", managerName: fixtureName(), avatar: null, wins: 3, losses: 2, ties: 0, pointsFor: 123456, pointsAgainst: 112233 });
export const fixturePlayers = (): Player[] => Array.from({ length: fixtureState() === "empty" ? 0 : 24 }, (_, index) => ({ id: `fixture-${index}`, fullName: `Synthetic Player ${String(index + 1).padStart(2, "0")}`, position: index % 2 ? "PG" : "C", nbaTeam: "FA", espnId: null }));
export async function getTeamDetail() { return fixtureState() === "missing-team" ? null : { team: fixtureTeam(), players: fixturePlayers() }; }
export async function getTeamRosterValue(): Promise<TeamRosterValue> {
  const players = fixturePlayers().map((player, index) => ({ playerId: player.id, price: fixtureState() === "outage" || (fixtureState() === "partial" && index > 11) ? null : 25 + index }));
  const quoted = players.filter(row => row.price !== null);
  return { players, total: quoted.length ? quoted.reduce((sum, row) => sum + (row.price ?? 0), 0) : null, quotedCount: quoted.length, playerCount: players.length, pricingBasis: fixtureState() === "outage" ? null : "preseason" };
}
export function getGameStore() { return { getRewards: async () => [] }; }
