import type { ReactNode } from "react";
import styles from "./Card.module.css";

/** Raised content container. The default wrapper for surface sections. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${styles.card} ${className}`}>{children}</div>;
}
