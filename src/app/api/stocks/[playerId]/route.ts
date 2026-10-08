/**
 * GET /api/stocks/[playerId] — one player's deep stock data.
 *
 * Powers the expanded stock row (Rule 14: detail loads on expand, never in
 * list HTML). Returns factors, season history, and sparkline points.
 * 404 when the player has no market footprint.
 */
import { getStockDetail } from "@/data/league";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;
  if (!playerId || typeof playerId !== "string") {
    return Response.json({ error: "playerId required" }, { status: 400 });
  }
  const detail = await getStockDetail(playerId);
  if (!detail) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json(detail);
}
