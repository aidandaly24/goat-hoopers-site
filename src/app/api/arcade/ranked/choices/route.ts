import { choiceRequest } from "@/data/ranked-choice/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = (request: Request) => choiceRequest(request, "choose");
