import { stockHistoryRangeResponse } from "@/data/stock-history-range";

/** Selected-player only; range paging never calculates or writes a price. */
export async function GET(request: Request,
  { params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params;
  return stockHistoryRangeResponse(playerId, new URL(request.url));
}
