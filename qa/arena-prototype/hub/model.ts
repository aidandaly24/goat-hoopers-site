export const zones = [
  { id: "matchup", number: "01", title: "This week", place: "The jumbotron", detail: "Matchup · saved picks", anchor: [0, 9, -1], fallback: [50, 28] },
  { id: "team", number: "02", title: "Your team", place: "The bench", detail: "Roster · form · team wire", anchor: [-7, 2, 11], fallback: [23, 66] },
  { id: "players", number: "03", title: "The players", place: "The billboards", detail: "Watchlist · Stud & Chud", anchor: [-17, 5, -9], fallback: [20, 38] },
  { id: "standings", number: "04", title: "The table", place: "The scorer’s table", detail: "Standings · leaders · moves", anchor: [6, 2, 11], fallback: [56, 73] },
  { id: "league", number: "05", title: "Our league", place: "The concourse", detail: "Teams · news · archive", anchor: [18, 4, -6], fallback: [82, 37] },
  { id: "arcade", number: "06", title: "Shoot around", place: "The hoop", detail: "Free throw · Arcade", anchor: [13, 4, 0], fallback: [80, 62] },
] as const;
export type ZoneId = typeof zones[number]["id"];
export type Destination = ZoneId | "edition";
export type Anchor = { id: ZoneId; x: number; y: number };
export const isDestination = (value: string | null): value is Destination => value === "edition" || zones.some(zone => zone.id === value);
export const destinationFromUrl = (): Destination | null => {
  const value = new URLSearchParams(location.hash.slice(1)).get("place");
  return isDestination(value) ? value : null;
};
