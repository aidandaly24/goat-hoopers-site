import type { ComponentProps } from "react";

/** Native anchors for a component fixture; preserves source hrefs. These do
 * not establish Next App Router or production destination behavior. */
export default function Link({ prefetch, ...props }: ComponentProps<"a"> & { prefetch?: boolean }) {
  void prefetch;
  return <a {...props} />;
}
