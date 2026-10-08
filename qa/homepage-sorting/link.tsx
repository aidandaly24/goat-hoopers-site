import type { AnchorHTMLAttributes } from "react";

/** Fixture only: preserve destinations without requiring a Next router/server. */
export default function Link(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} />;
}
