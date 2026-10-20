import { handleRankedRequest } from "@/data/ranked-free-throw/http";
import { createRankedRuntime } from "@/data/ranked-free-throw/runtime";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = (request: Request) => handleRankedRequest(request, "result", createRankedRuntime());
