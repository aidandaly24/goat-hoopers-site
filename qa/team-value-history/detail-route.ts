import { teamValueHistoryDetailFixture } from "@/test/team-value-history-fixture";
import { validHistoryDay } from "@/domain/team-value-history";

const attempts = new Map<string, number>();
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams, day = params.get("day") ?? "", state = params.get("state");
  if (!validHistoryDay(day)) return Response.json({}, { status: 400 });
  if (state === "changed") return Response.json({}, { status: 409 });
  if (state === "retry") {
    const key = `${state}/${day}`, count = (attempts.get(key) ?? 0) + 1; attempts.set(key, count);
    if (count === 1) return Response.json({}, { status: 503 });
  }
  if (state === "race" && day === "2026-10-18") await new Promise(resolve => setTimeout(resolve, 800));
  const value = teamValueHistoryDetailFixture(day);
  if (state === "malformed") value.generation = "wrong-synthetic-generation";
  return Response.json(value);
}
