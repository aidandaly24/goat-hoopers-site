import "server-only";
import { friendsEnrollmentEnabled, readFriendsAuthConfig } from "../friends-auth/config";
import { getFriendsDb } from "../friends-auth/db";
import type { RankedAccount } from "@/domain/arcade/ranked-free-throw";
import { PostgresChoiceStore } from "./store";
import { registeredChoiceAdapters, type ChoiceAdapter } from "./adapter";
import { readCompetitionCalendar } from "../arcade-competition/config";
export type ChoiceRuntime = {
  enabled: boolean; adapters: readonly ChoiceAdapter[]; origin(): string;
  account(headers: Headers): Promise<RankedAccount | null>;
  admitRequest(action: string): Promise<boolean>; store(): PostgresChoiceStore;
};
export function createChoiceRuntime(adapters = registeredChoiceAdapters()): ChoiceRuntime {
  let store: PostgresChoiceStore | undefined;
  return { enabled: process.env.GOAT_RANKED_CHOICE_GAMES_ENABLED === "1" && friendsEnrollmentEnabled(),
    // Bad/missing calendar holds new commands while owner recovery remains separate.
    adapters: readCompetitionCalendar(process.env) ? adapters : [],
    origin: () => readFriendsAuthConfig().origin,
    account: async headers => { const { getVerifiedAccount } = await import("../friends-auth/runtime"); const a = await getVerifiedAccount(headers);
      return a ? { subject: a.subject, sessionId: a.sessionId } : null; },
    admitRequest: async action => { const { consumeAuthAttempt } = await import("../friends-auth/runtime"); return consumeAuthAttempt(`ranked-choice:${action}`, 120); },
    store: () => {
      if (!store) { const db = getFriendsDb(); store = new PostgresChoiceStore({ execute: async q => db.execute(q),
        transaction: work => db.transaction(tx => work({ execute: async q => tx.execute(q) }), { isolationLevel: "read committed" }) }); }
      return store;
    } };
}
