import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** A matched primary page invoking notFound is distinct from no primary match. */
export default function MatchedNotFoundPage() {
  notFound();
}
