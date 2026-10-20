import Link from 'next/link';
import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';
/** Same synthetic primary content at every path; the real ticker slot must match. */
export default async function Page({ params }: { params: Promise<{ segments?: string[] }> }) {
  const { segments } = await params;
  if (segments?.[0] === '__fixture_missing') notFound();
  const route = '/' + (segments ?? []).join('/');
  return <section data-ticker-primary={route}>
    <h1>Synthetic ticker scope primary page</h1>
    <p>Offline route fixture; no account operations or league page loaders.</p>
    <nav aria-label="Fixture destinations"><Link href="/stocks" prefetch={false}>Content route</Link><Link href="/account" prefetch={false}>Utility route</Link></nav>
  </section>;
}
