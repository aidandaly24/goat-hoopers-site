import { teamValueHistoryFixture } from "@/test/team-value-history-fixture";
import { validHistoryRange } from "@/domain/team-value-history";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const range = { from: params.get("from") ?? "", toExclusive: params.get("toExclusive") ?? "" };
  if (!validHistoryRange(range)) return Response.json({}, { status: 400 });
  const envelope = teamValueHistoryFixture();
  envelope.requestedRange = range;
  envelope.loadedRange = params.get("cursor") === "synthetic-page-2" ? { from: "2026-10-19", toExclusive: range.toExclusive } : range;
  envelope.points = envelope.points.filter(point => point.day >= envelope.loadedRange.from && point.day < envelope.loadedRange.toExclusive);
  return Response.json(envelope);
}
