"use client";

import { useEffect, useState } from "react";

/** Fixture-only marker: the navigation regression must start after hydration. */
export default function HydrationProbe() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  return <span hidden data-ticker-fixture-hydrated={hydrated ? "true" : "false"} />;
}
