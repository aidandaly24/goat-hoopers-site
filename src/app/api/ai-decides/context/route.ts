import { cookies } from "next/headers";
import { createAiRuntime } from "@/data/ai-decider/runtime";
import { handleAiContextPost } from "@/data/ai-decider/context-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

export async function POST(request: Request) {
  const dependencies = createAiRuntime(request.headers);
  const token = dependencies.providerSession ? undefined : (await cookies()).get("gh_session")?.value;
  return handleAiContextPost(request, token, dependencies);
}
