"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./SiteChrome.module.css";

/** One sticky stack: an absent ticker leaves no gap, and wrapping/zoom sets
 * the actual anchor and keyboard scroll clearance rather than a guessed sum. */
export function SiteChrome({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const chrome = ref.current;
    if (!chrome) return;
    const measure = () => document.documentElement.style.setProperty("--gh-chrome-h", `${chrome.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(measure);
    observer.observe(chrome);
    measure();
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--gh-chrome-h");
    };
  }, []);
  return <div ref={ref} className={styles.chrome} data-site-chrome>
    <a className={styles.skip} href="#main-content">Skip to content</a>
    {children}
  </div>;
}
