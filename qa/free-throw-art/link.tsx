import type { AnchorHTMLAttributes } from 'react';
/** Fixture adapter only. Preserve real destinations without a Next router. */
export default function Link({ prefetch: _prefetch, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) {
  void _prefetch;
  return <a {...props} />;
}
