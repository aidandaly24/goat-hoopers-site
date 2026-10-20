import Ticker from "../Ticker";

export default async function TickerSlot({
  params,
}: {
  params: Promise<{ segments: string[] }>;
}) {
  const { segments } = await params;
  return <Ticker segments={segments} />;
}
