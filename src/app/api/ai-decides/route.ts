import { cookies } from "next/headers";
import { createAiRuntime, loadAiDecidesData } from "@/data/ai-decider/runtime";
import { handleAiPost } from "@/data/ai-decider/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  return Response.json(await loadAiDecidesData(), { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

export async function POST(request: Request) {
  const token = (await cookies()).get("gh_session")?.value;
  return handleAiPost(request, token, createAiRuntime());
}
