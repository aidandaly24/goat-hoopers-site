import "server-only";
import { createHash } from "node:crypto";
import { readCompetitionCalendar } from "../arcade-competition/config";
import type { RankedConfiguration } from "./config";

const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  return JSON.stringify(value);
};

/** Credential-free identity of the database target, never of its password or role. */
export function rankedDatabaseBinding(hostname: string, database: string): string {
  return digest(canonical({ version: 1, hostname: hostname.toLowerCase().replace(/-pooler(?=\.)/, ""), database }));
}

/** Private operational receipt. No connection URL, host, credentials, calendar payload or user data leaves this function. */
export function rankedReadinessReceipt(env: Readonly<Record<string, string | undefined>>, configuration: RankedConfiguration) {
  const calendar = readCompetitionCalendar(env);
  let databaseBinding: string | null = null;
  try {
    const url = new URL(env.DATABASE_URL ?? "");
    if (["postgres:", "postgresql:"].includes(url.protocol) && url.hostname && url.pathname.length > 1) {
      databaseBinding = rankedDatabaseBinding(url.hostname, decodeURIComponent(url.pathname.slice(1)));
    }
  } catch { /* Missing or malformed targets are not a successful attestation. */ }
  return {
    event: "goat_ranked_readiness_v1" as const,
    status: configuration.status,
    gameplayEnabled: env.GOAT_RANKED_FREE_THROW_ENABLED === "1",
    personalAuthEnabled: env.FRIENDS_AUTH_ENABLED === "1" || env.FRIENDS_AUTH_ENROLLMENT === "1",
    customRulesConfigured: !!env.GOAT_RANKED_FREE_THROW_RULES,
    calendarStatus: calendar ? "valid" : env.GOAT_ARCADE_CALENDAR ? "invalid" : "missing",
    calendarBinding: calendar ? digest(canonical(calendar)) : null,
    periodCount: calendar?.length ?? 0,
    fixtureCount: calendar?.reduce((sum, period) => sum + period.fixtures.length, 0) ?? 0,
    databaseBinding,
  };
}

let lastReceipt: string | null = null;
/** At most once per distinct configuration per server process; never changes admission on logger failure. */
export function recordRankedReadiness(env: Readonly<Record<string, string | undefined>>, configuration: RankedConfiguration) {
  try {
    const receipt = JSON.stringify(rankedReadinessReceipt(env, configuration));
    if (receipt === lastReceipt) return;
    lastReceipt = receipt;
    console.info(receipt);
  } catch { /* Logging cannot open or close ranked play. */ }
}
