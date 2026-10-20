import "server-only";
import { friendsEnrollmentEnabled, readFriendsAuthConfig } from "../friends-auth/config";
import { getFriendsDb } from "../friends-auth/db";
import { readRankedConfiguration, freeThrowRulesVersion } from "./config";
import { ArcadeCompetitionStore } from "../arcade-competition/store";
import { DEFAULT_COMPETITION_POLICY, readCompetitionCalendar } from "../arcade-competition/config";

import type { RankedRuntime } from "./service";
import type { RankedAvailability } from "@/domain/arcade/ranked-free-throw";

/** Lazy composition: disabled requests never construct a DB client or verify a provider session. */
export function createRankedRuntime(): RankedRuntime {
  let configuration = readRankedConfiguration(process.env);
  if (process.env.GOAT_RANKED_FREE_THROW_ENABLED === "1" && !process.env.GOAT_RANKED_FREE_THROW_RULES) configuration = { status: "ready", policy: DEFAULT_COMPETITION_POLICY, rulesVersion: freeThrowRulesVersion(DEFAULT_COMPETITION_POLICY) };
  if (configuration.status === "ready" && !readCompetitionCalendar(process.env)) configuration = { status: "invalid" };
  if (configuration.status === "ready" && !friendsEnrollmentEnabled()) configuration = { status: "invalid" };
  let store: ArcadeCompetitionStore | undefined;
  return {
    configuration,
    origin: () => readFriendsAuthConfig().origin,
    account: async headers => {
      const { getVerifiedAccount } = await import("../friends-auth/runtime");
      const account = await getVerifiedAccount(headers);
      return account ? { subject: account.subject, sessionId: account.sessionId } : null;
    },
    admitRequest: async action => {
      const { consumeAuthAttempt } = await import("../friends-auth/runtime");
      return consumeAuthAttempt(`ranked-free-throw:${action}`, 120);
    },
    store: () => {
      if (!store) {
        const db = getFriendsDb();
        store = new ArcadeCompetitionStore({
          execute: async statement => db.execute(statement),
          // Admission's post-lock count must use a fresh snapshot, regardless
          // of the database/role's default transaction isolation setting.
          transaction: async work => db.transaction(tx => work({ execute: async statement => tx.execute(statement) }),
            { isolationLevel: "read committed" }),
        });
      }
      return store;
    },
  };
}

export async function loadRankedAvailability(requestHeaders: () => Promise<Headers>, runtime = createRankedRuntime()): Promise<RankedAvailability> {
  if (runtime.configuration.status !== "ready") return { status: "disabled" };
  try {
    const config = runtime.configuration;
    const store = runtime.store();
    if (store instanceof ArcadeCompetitionStore && (await store.board("weekly", null, config, null)).phase !== "open") return { status: "disabled" };
    return await runtime.account(await requestHeaders()) ? { status: "available", ruleSetId: runtime.configuration.policy.ruleSetId, rules: runtime.configuration.policy } : { status: "sign_in" };
  } catch { return { status: "unavailable" }; }
}
