'use client';
import { useEffect } from 'react';
/** Test-only readiness marker, excluded from the production app. */
export function HydrationProbe() {
  useEffect(() => { document.documentElement.dataset.reviewHydrated = 'true'; }, []);
  return null;
}
