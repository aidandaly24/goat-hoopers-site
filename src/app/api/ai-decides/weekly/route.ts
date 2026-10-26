import { cookies } from "next/headers";
import { createAiRuntime } from "@/data/ai-decider/runtime";
import { handleAiWeeklyCron, handleAiWeeklyPost, publicationSourcesFor } from "@/data/ai-decider/publication";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const dependencies = createAiRuntime();
  return handleAiWeeklyCron(request, process.env.CRON_SECRET, dependencies, dependencies.publicationTarget ? publicationSourcesFor(dependencies.publicationTarget) : undefined);
}

export async function POST(request: Request) {
  const dependencies = createAiRuntime(request.headers);
  const token = dependencies.providerSession ? undefined : (await cookies()).get("gh_session")?.value;
  return handleAiWeeklyPost(request, token, dependencies, dependencies.publicationTarget ? publicationSourcesFor(dependencies.publicationTarget) : undefined);
}
