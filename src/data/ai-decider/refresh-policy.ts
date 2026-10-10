/** One reviewed replacement attempt, not a recurring or arbitrary-week rerun. */
export const WEEK1_REFRESH_KEY = "1387473752807190528:2026:1";
export const WEEK1_ORIGINAL_HASH = "181fead854819a7554ab6e66118da7a1716b0f8b576519db0562aa136a989802";
export type AiWeek1RefreshPolicy = { originalHash: string };
export const refreshStorageKey = (key: string) => `${key}:refresh:1`;
