"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { parseTheme, resolveTheme, THEME_MEDIA_QUERY, THEME_STORAGE_KEY, type Theme } from "./theme";
import styles from "./ThemeToggle.module.css";

/** User question: can I change the reading theme? Action: toggle dark theme.
 * System/live preference until manual choice, persisted light/dark thereafter.
 * One 44px root-header control at every width; no dropdown/page-local provider.
 */
export function ThemeToggle() {
  // The server and first client render agree. CSS selects the prepaint icon.
  const [theme, setTheme] = useState<Theme | null>(null);
  const toggleRef = useRef<(() => void) | null>(null);
  useLayoutEffect(() => {
    let manual: Theme | null = null;
    try { manual = parseTheme(window.localStorage.getItem(THEME_STORAGE_KEY)); } catch { /* System fallback. */ }
    const media = typeof window.matchMedia === "function" ? window.matchMedia(THEME_MEDIA_QUERY) : null;
    const apply = (next: Theme) => {
      document.documentElement.setAttribute("data-theme", next);
      setTheme(next);
    };
    // Sync this one control with the browser-owned preference after hydration.
    apply(resolveTheme(manual, media?.matches ?? false));
    const changed = () => { if (manual === null) apply(resolveTheme(null, media?.matches ?? false)); };
    media?.addEventListener("change", changed);
    toggleRef.current = () => {
      const current = parseTheme(document.documentElement.getAttribute("data-theme")) ?? resolveTheme(manual, media?.matches ?? false);
      manual = current === "dark" ? "light" : "dark";
      apply(manual);
      try { window.localStorage.setItem(THEME_STORAGE_KEY, manual); } catch { /* Keep this session's manual choice. */ }
    };
    return () => { media?.removeEventListener("change", changed); toggleRef.current = null; };
  }, []);

  return <button type="button" className={styles.toggle} data-theme-toggle
    disabled={theme === null} aria-label={theme === null ? "Theme loading" : `Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    title={theme === null ? "Theme loading" : `Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    onClick={() => toggleRef.current?.()}>
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <g className={styles.sun}><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></g>
      <path className={styles.moon} d="M20.5 14A8.6 8.6 0 0 1 10 3.5 8.6 8.6 0 1 0 20.5 14Z" />
    </svg>
  </button>;
}
