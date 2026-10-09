/** Scoped native-history policy. Retains Next's private state, never owns a route. */
export const PICKER_HISTORY_KEY = "ghAiTeamPicker";
const PICKER_HASH = "#ai-team-picker";
type Marker = { version: 1; id: string; path: string; returnUrl: string };
export type PickerNavigation = {
  state: () => unknown;
  path: () => string;
  url: () => string;
  push: (state: Record<string, unknown>, url: string) => void;
  replace: (state: Record<string, unknown>, url: string) => void;
  back: () => void;
  subscribe: (sync: () => void) => () => void;
};
const record = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null ? value as Record<string, unknown> : {};

/** The listener survives closed dialogs so Forward can restore its exact entry. */
export function createPickerHistory<T>(navigation: PickerNavigation, changed: (entry: T | null) => void, nextId: () => string) {
  const path = navigation.path();
  const entries = new Map<string, T>();
  let active: string | null = null;
  let closing = false;
  const marker = () => record(navigation.state())[PICKER_HISTORY_KEY];
  const validMarker = (value: unknown): value is Marker => {
    const m = record(value);
    return m.version === 1 && typeof m.id === "string" && m.path === path && typeof m.returnUrl === "string";
  };
  function clearMarker() {
    const state = { ...record(navigation.state()) };
    const value = state[PICKER_HISTORY_KEY];
    if (value === undefined) return;
    delete state[PICKER_HISTORY_KEY];
    let url = navigation.url();
    // Never restore an old page URL over a Next route transition.
    if (navigation.path() === path && url.endsWith(PICKER_HASH)) {
      const returnUrl = validMarker(value) ? value.returnUrl : "";
      url = url.slice(0, -PICKER_HASH.length);
      try {
        const returned = new URL(returnUrl || path, "https://picker.invalid");
        if (returnUrl.startsWith("/") && returned.origin === "https://picker.invalid" && returned.pathname === path) url = returnUrl;
      } catch { /* A stale foreign/malformed URL never changes this route. */ }
    }
    navigation.replace(state, url);
  }
  function sync() {
    closing = false;
    const value = marker();
    if (navigation.path() === path && validMarker(value) && entries.has(value.id)) {
      active = value.id;
      changed(entries.get(value.id)!);
    } else {
      clearMarker(); active = null; changed(null);
    }
  }
  const unsubscribe = navigation.subscribe(sync);
  // A reloaded/stale/legacy marker cannot reopen an entry from another mount.
  sync();
  return {
    open(entry: T) {
      const value = marker();
      const id = nextId();
      entries.set(id, entry);
      const returnUrl = validMarker(value) ? value.returnUrl : navigation.url().replace(/#ai-team-picker$/, "");
      const state = { ...record(navigation.state()), [PICKER_HISTORY_KEY]: { version: 1, id, path, returnUrl } satisfies Marker };
      // Coalesce a live or stale picker entry instead of stacking another marker.
      if (value !== undefined) navigation.replace(state, `${path}${new URL(navigation.url(), "https://picker.invalid").search}${PICKER_HASH}`);
      else navigation.push(state, `${path}${new URL(navigation.url(), "https://picker.invalid").search}${PICKER_HASH}`);
      active = id; closing = false; changed(entry);
    },
    update(entry: T) { if (active) entries.set(active, entry); },
    close() {
      if (closing) return;
      const value = marker();
      if (navigation.path() === path && validMarker(value) && value.id === active) {
        closing = true; navigation.back();
      } else { clearMarker(); active = null; changed(null); }
    },
    dispose() { unsubscribe(); clearMarker(); entries.clear(); active = null; },
  };
}
