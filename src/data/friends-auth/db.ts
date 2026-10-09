import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { siteUsers, inviteCodes, sessions } from "@/data/db";
import { accountIdentities, authAttemptWindows, providerSchema } from "./schema";

export const friendsSchema = { ...providerSchema, accountIdentities, authAttemptWindows, siteUsers, inviteCodes, sessions };
export type FriendsDb = NodePgDatabase<typeof friendsSchema>;
export type FriendsTransaction = Parameters<Parameters<FriendsDb["transaction"]>[0]>[0];
let cached: FriendsDb | undefined;

/** Separate transactional adapter; legacy Neon HTTP data access is unchanged. */
export function getFriendsDb(): FriendsDb {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Friends auth database is not configured");
    const pool = new Pool({ connectionString: url, max: 2, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000,
      statement_timeout: 10000, allowExitOnIdle: true });
    cached = drizzle(pool, { schema: friendsSchema });
  }
  return cached;
}
