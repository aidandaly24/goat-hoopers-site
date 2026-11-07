import type { ComponentProps } from "react";

/** QA-only browser links. Home stays in this entry; production hrefs remain
 * untouched, and the preserved index.html study keeps its original root link. */
export default function Link({ prefetch, href, ...props }: ComponentProps<"a"> & { prefetch?: boolean }) {
  void prefetch;
  const home = location.pathname.endsWith("/arena.html") && href === "/";
  return <a {...props} href={home ? `/arena.html${location.search}` : href} />;
}
