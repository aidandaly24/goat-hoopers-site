import type { AnchorHTMLAttributes } from "react";

// Ordinary anchors exercise native activation; this does not claim Next routing QA.
export default function Link(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} />;
}
