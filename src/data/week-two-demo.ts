import type { DraftDemo, DraftPlayer } from "@/domain/arcade/roster-draft";

const player = (id: string, firstName: string, lastName: string, position: string): DraftPlayer =>
  ({ id, firstName, lastName, position, portrait: `/courtside/portraits/player-${id}.png` });

/** Illustrative franchise pairings, not a verified current NBA roster or scoring feed. */
export function getWeekTwoDemo(): DraftDemo {
  return {
    pickCount: 5, // Five picks is a preview format, not an adopted competition rule.
    teams: [
      { id: "lakers", city: "Los Angeles", name: "Lakers", abbreviation: "LAL",
        players: [player("1362", "LeBron", "James", "Forward"), player("1970", "Luka", "Dončić", "Guard")] },
      { id: "thunder", city: "Oklahoma City", name: "Thunder", abbreviation: "OKC",
        players: [player("1957", "Shai", "Gilgeous-Alexander", "Guard"), player("2455", "Chet", "Holmgren", "Center")] },
      { id: "magic", city: "Orlando", name: "Magic", abbreviation: "ORL",
        players: [player("2458", "Paolo", "Banchero", "Forward"), player("2304", "Franz", "Wagner", "Forward")] },
      { id: "rockets", city: "Houston", name: "Rockets", abbreviation: "HOU",
        players: [player("2308", "Alperen", "Şengün", "Center"), player("2574", "Amen", "Thompson", "Guard")] },
      { id: "cavaliers", city: "Cleveland", name: "Cavaliers", abbreviation: "CLE",
        players: [player("1845", "Donovan", "Mitchell", "Guard"), player("2259", "Evan", "Mobley", "Center")] },
    ],
  };
}
