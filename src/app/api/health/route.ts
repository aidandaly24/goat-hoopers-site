/**
 * GET /api/health — light liveness/readiness probe.
 *
 * Returns no secrets and no error details: just overall status, the
 * deployed commit (public on Vercel anyway), and a cheap `select 1`
 * against the database when one is configured.
 */
import { sql } from "drizzle-orm";
import { getDb } from "@/data/db";

export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 2000;

type DbStatus = "ok" | "error" | "not_configured";

async function checkDb(): Promise<DbStatus> {
  if (!process.env.DATABASE_URL) return "not_configured";
  try {
    await Promise.race([
      getDb().execute(sql`select 1`),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), DB_TIMEOUT_MS)),
    ]);
    return "ok";
  } catch {
    return "error";
  }
}

export async function GET() {
  const database = await checkDb();
  return Response.json(
    {
      status: database === "error" ? "degraded" : "ok",
      time: new Date().toISOString(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      checks: { database },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
