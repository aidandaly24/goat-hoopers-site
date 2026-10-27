import { cookies } from "next/headers";
import { createAiRuntime } from "@/data/ai-decider/runtime";
import { handleAiForecastCron, handleAiForecastPost } from "@/data/ai-decider/forecast-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Daily server-side scheduler entry (vercel.json cron). Same secret + operator identity as the weekly publication cron. */
export async function GET(request: Request) {
  const dependencies = createAiRuntime();
  return handleAiForecastCron(request, process.env.CRON_SECRET, dependencies);
}

/** Explicit manager refresh; the server supplies all evidence. */
export async function POST(request: Request) {
  const dependencies = createAiRuntime(request.headers);
  const token = dependencies.providerSession ? undefined : (await cookies()).get("gh_session")?.value;
  return handleAiForecastPost(request, token, dependencies);
}
