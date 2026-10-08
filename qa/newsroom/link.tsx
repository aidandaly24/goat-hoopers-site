import type { AnchorHTMLAttributes } from "react";
export default function Link({ prefetch: _prefetch, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) {
  void _prefetch;
  return <a {...props} />;
}
