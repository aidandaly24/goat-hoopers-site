"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Reveal.module.css";

/**
 * Scroll-reveal for below-the-fold homepage modules: content fades/rises
 * once when it first enters the viewport (IntersectionObserver, once).
 * Content is fully visible by default — the hidden state is applied
 * imperatively from an effect, never in server markup or state, so if JS,
 * IO or motion permission is unavailable nothing ever hides.
 * Transform/opacity only; prefers-reduced-motion skips the effect entirely
 * (CSS also neutralizes the states as a belt-and-braces guard).
 */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;
    node.classList.add(styles.pending);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          node.classList.remove(styles.pending);
          node.classList.add(styles.in);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`${styles.reveal} ${className ?? ""}`}>
      {children}
    </div>
  );
}
