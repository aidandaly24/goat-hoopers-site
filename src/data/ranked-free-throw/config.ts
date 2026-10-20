import "server-only";
import { createHash } from "node:crypto";
import { ACTIVE_FREE_THROW_ENGINE, parseFreeThrowPolicy, rankedReplayContext, type FreeThrowPolicy, type RankedReplayContext } from "@/domain/arcade/ranked-free-throw";

export type RankedConfiguration = { status: "disabled" | "invalid" } | { status: "ready"; policy: FreeThrowPolicy; rulesVersion: string };

/** Include collider changes and all admission/calendar rules; unlike user labels, this cannot be reused accidentally. */
export function freeThrowRulesVersion(policy: FreeThrowPolicy, replayContext: RankedReplayContext = rankedReplayContext(policy.engine)): string {
  return createHash("sha256").update(JSON.stringify({ policy, replayContext })).digest("hex");
}

/** No policy, numeric gameplay defaults or persistence access on the default path. */
export function readRankedConfiguration(env: Readonly<Record<string, string | undefined>>): RankedConfiguration {
  if (env.GOAT_RANKED_FREE_THROW_ENABLED !== "1") return { status: "disabled" };
  const raw = env.GOAT_RANKED_FREE_THROW_RULES;
  if (!raw || raw.length > 4096) return { status: "invalid" };
  try {
    const policy = parseFreeThrowPolicy(JSON.parse(raw));
    return policy?.engine === ACTIVE_FREE_THROW_ENGINE ? { status: "ready", policy, rulesVersion: freeThrowRulesVersion(policy) } : { status: "invalid" };
  } catch { return { status: "invalid" }; }
}
