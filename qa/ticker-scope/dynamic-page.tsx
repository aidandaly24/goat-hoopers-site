import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ playerId: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playerId } = await params;
  return { title: `Synthetic ticker player ${playerId}` };
}
export default async function Page({ params }: Props) {
  const { playerId } = await params;
  return <section data-ticker-dynamic={playerId}><h1>Synthetic ticker scope primary page</h1><p>Synthetic dynamic player route {playerId}</p></section>;
}
