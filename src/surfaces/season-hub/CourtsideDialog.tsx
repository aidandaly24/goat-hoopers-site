"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cs } from "./CourtsideStyles";

/** Native modal supplies focus containment, Escape and focus restoration. */
export function CourtsideDialog({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stopMovement = () => {
      if (preference.matches && dialog.current) dialog.current.dataset.motion = "none";
    };
    preference.addEventListener("change", stopMovement);
    return () => preference.removeEventListener("change", stopMovement);
  }, []);

  return (
    <>
      <button
        className={cs("button")}
        type="button"
        onClick={(event) => {
          const node = dialog.current;
          if (!node) return;
          // Keyboard access is immediate. Pointer motion never delays showModal or Close.
          node.dataset.motion = event.detail > 0 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "pointer" : "none";
          node.showModal();
        }}
      >
        {label} <span aria-hidden="true">→</span>
      </button>
      <dialog ref={dialog} className={cs("notes-dialog")} aria-labelledby={titleId}>
        <button
          type="button"
          className={cs("dialog-close")}
          aria-label="Close matchup notes"
          onClick={() => dialog.current?.close()}
        >
          ✕
        </button>
        <h2 id={titleId}>{title}</h2>
        {children}
      </dialog>
    </>
  );
}
