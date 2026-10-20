import { handleRankedRequest } from "@/data/ranked-free-throw/http";
import { createRankedRuntime } from "@/data/ranked-free-throw/runtime";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = (request: Request) => handleRankedRequest(request, "start", createRankedRuntime());
