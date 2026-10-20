import { handleArcadeClockRequest } from "@/data/arcade-clock";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = (request: Request) => handleArcadeClockRequest(request);
