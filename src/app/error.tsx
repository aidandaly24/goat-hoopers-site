/**
 * Root error boundary — the broadcast "technical difficulties" card.
 *
 * Client component (required by Next.js for error.tsx). Offers a retry
 * and a way home. Never leaks stack traces to the page.
 */
"use client";

import Link from "next/link";
import { useEffect } from "react";
import styles from "./error.module.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logged server-side in production; kept out of the rendered page.
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className={styles.surface}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Technical difficulties</p>
        <h1 className={styles.title}>The feed cut out</h1>
        <p className={styles.blurb}>
          Something broke on our end loading this page. It&apos;s not you —
          try again, or head back to the home desk.
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={reset} className={styles.retry}>
            Try again
          </button>
          <Link href="/" className={styles.home}>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
