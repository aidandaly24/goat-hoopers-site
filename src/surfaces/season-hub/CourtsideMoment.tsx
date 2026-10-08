"use client";

/* eslint-disable @next/next/no-img-element -- Approved, pre-sized local assets are served directly without image-optimizer quota. */

import { useEffect, useRef } from "react";
import { cs } from "./CourtsideStyles";

/** One bounded CSS settle; static in reduced motion, paused offscreen/hidden. */
export function CourtsideMoment() {
  const mark = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = mark.current;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    if (!node || preference.matches || !("IntersectionObserver" in window))
      return;
    let visible = false;
    const pause = () => {
      node.style.animationPlayState =
        visible && !document.hidden && !preference.matches
          ? "running"
          : "paused";
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) node.classList.add(cs("settle"));
        pause();
      },
      { threshold: 0.8 },
    );
    observer.observe(node);
    const finish = () => observer.disconnect();
    node.addEventListener("animationend", finish, { once: true });
    document.addEventListener("visibilitychange", pause);
    preference.addEventListener("change", pause);
    return () => {
      observer.disconnect();
      node.removeEventListener("animationend", finish);
      document.removeEventListener("visibilitychange", pause);
      preference.removeEventListener("change", pause);
    };
  }, []);
  return (
    <span ref={mark} className={cs("transition-mark")} aria-hidden="true">
      <img
        src="/courtside/GOAT-HOOPERS-emblem-clay.svg"
        alt=""
        width="640"
        height="640"
      />
    </span>
  );
}
