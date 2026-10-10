import { cookies } from "next/headers";
import { createAiRuntime } from "@/data/ai-decider/runtime";
import { handleAiWeek1RefreshPost } from "@/data/ai-decider/week1-refresh";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Override the normal source helpers' positive revalidation only on this rerun.
export const fetchCache = "force-no-store";
export const maxDuration = 60;
export async function POST(request: Request) {
  const dependencies = createAiRuntime(request.headers);
  const token = dependencies.providerSession ? undefined : (await cookies()).get("gh_session")?.value;
  return handleAiWeek1RefreshPost(request, token, dependencies);
}
