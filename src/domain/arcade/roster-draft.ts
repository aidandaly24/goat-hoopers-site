/** A browser-local concept, deliberately separate from competition rules/scores. */
export type DraftPlayer = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  portrait: string;
};

export type DraftTeam = {
  id: string;
  city: string;
  name: string;
  abbreviation: string;
  players: readonly DraftPlayer[];
};

export type DraftPick = { teamId: string; playerId: string };
export type DraftDemo = { teams: readonly DraftTeam[]; pickCount: number };
export type DraftState = {
  phase: "teaser" | "sealed" | "drawing" | "revealed" | "locked" | "complete";
  order: readonly string[];
  picks: readonly DraftPick[];
  selectedId: string | null;
};
export type DraftAction =
  | { type: "start"; order: readonly string[] }
  | { type: "reveal" }
  | { type: "finish-reveal" }
  | { type: "select"; playerId: string }
  | { type: "lock" }
  | { type: "next" }
  | { type: "teaser" };

export const EMPTY_DRAFT: DraftState = { phase: "teaser", order: [], picks: [], selectedId: null };

/** Fisher–Yates with an injectable source. This demo's draw is not ranked/fair-play proof. */
export function shuffleDemoTeams(teams: readonly DraftTeam[], random: () => number): string[] {
  const order = teams.map(team => team.id);
  for (let i = order.length - 1; i > 0; i--) {
    const sample = random();
    const j = Math.floor((Number.isFinite(sample) ? Math.min(Math.max(sample, 0), 1 - Number.EPSILON) : 0) * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** Reject stale/double actions and picks outside the team currently on the clock. */
export function transitionDraft(state: DraftState, action: DraftAction, demo: DraftDemo): DraftState {
  if (action.type === "teaser") return EMPTY_DRAFT;
  if (action.type === "start") {
    const order = action.order.slice(0, demo.pickCount);
    if (order.length !== demo.pickCount || new Set(order).size !== order.length ||
      order.some(id => !demo.teams.some(team => team.id === id))) return state;
    return { phase: "sealed", order, picks: [], selectedId: null };
  }
  if (action.type === "next") return state.phase === "locked"
    ? { ...state, phase: "sealed", selectedId: null } : state;
  if (action.type === "reveal") return state.phase === "sealed" ? { ...state, phase: "drawing" } : state;
  if (action.type === "finish-reveal") return state.phase === "drawing" ? { ...state, phase: "revealed" } : state;
  const team = demo.teams.find(team => team.id === state.order[state.picks.length]);
  if (!team || state.phase !== "revealed") return state;
  if (action.type === "select") return !state.picks.some(pick => pick.playerId === action.playerId) && team.players.some(player => player.id === action.playerId)
    ? { ...state, selectedId: action.playerId } : state;
  if (action.type === "lock" && state.selectedId && !state.picks.some(pick => pick.playerId === state.selectedId) && team.players.some(player => player.id === state.selectedId)) {
    const picks = [...state.picks, { teamId: team.id, playerId: state.selectedId }];
    return { ...state, picks, phase: picks.length === demo.pickCount ? "complete" : "locked" };
  }
  return state;
}
