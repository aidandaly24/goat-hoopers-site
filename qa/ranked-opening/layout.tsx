import type { ReactNode } from "react";
import "@/ui/tokens.css";
import "@/app/globals.css";
export default function FixtureLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><main id="main-content">{children}</main></body></html>;
}
