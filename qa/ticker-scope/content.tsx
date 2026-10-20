import Link from 'next/link';
import HydrationProbe from './hydration-probe';
/** Shared content for explicit synthetic pages; this component does not match routes. */
export default function FixtureContent({ route }: { route: string }) {
  return <section data-ticker-primary={route}>
    <HydrationProbe />
    <h1>Synthetic ticker scope primary page</h1>
    <p>Offline route fixture; no account operations or league page loaders.</p>
    <nav aria-label="Fixture destinations"><Link href="/stocks" prefetch={false}>Content route</Link><Link href="/account" prefetch={false}>Utility route</Link><Link href="/fixture-unmatched-missing/nested" prefetch={false}>Unmatched route regression</Link></nav>
  </section>;
}
