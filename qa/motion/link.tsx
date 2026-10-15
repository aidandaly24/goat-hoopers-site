import type { AnchorHTMLAttributes } from "react";

/** Fixture-only router adapter. Preserve destinations; do not leak Next-only props to HTML. */
export default function Link(props: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) {
  const attributes = { ...props };
  delete attributes.prefetch;
  return <a {...attributes} />;
}
