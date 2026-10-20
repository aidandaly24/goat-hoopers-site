"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Reveal.module.css";

/**
 * Scroll-reveal for below-the-fold homepage modules: content fades/rises
 * once when it first enters the viewport (IntersectionObserver, once).
 * Content stays visible in server markup, during hydration and while
 * waiting. A short entrance begins at any intersection, including tall
 * modules at enlarged text sizes. Reduced motion or a hidden document
 * cancels observation/animation for this mount.
 */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches || document.hidden) return;
    if (!("IntersectionObserver" in window)) return;
    let active = true;
    const stop = () => {
      active = false;
      observer.disconnect();
      node.classList.remove(styles.in);
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
      node.removeEventListener("animationend", onEnd);
    };
    const onMotion = () => { if (motion.matches) stop(); };
    const onVisibility = () => { if (document.hidden) stop(); };
    const onEnd = (event: AnimationEvent) => { if (event.target === node) stop(); };
    const observer = new IntersectionObserver(
      (entries) => {
        if (active && entries.some((entry) => entry.isIntersecting)) {
          node.classList.add(styles.in);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -6% 0px" },
    );
    motion.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    node.addEventListener("animationend", onEnd);
    observer.observe(node);
    return stop;
  }, []);
  return (
    <div ref={ref} className={`${styles.reveal} ${className ?? ""}`}>
      {children}
    </div>
  );
}
