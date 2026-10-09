import { handleAccountAction } from "@/data/friends-auth/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = (request: Request) => handleAccountAction(request, "link-existing");
