import type { ComponentProps } from "react";

// This fixture uses normal browser navigation; real Next navigation is covered
// separately by the production-mode route runner.
export default function Link({ prefetch, ...props }: ComponentProps<"a"> & { prefetch?: boolean }) {
  void prefetch;
  return <a {...props} />;
}
