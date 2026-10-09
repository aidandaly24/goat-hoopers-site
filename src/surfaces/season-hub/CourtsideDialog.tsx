"use client";

import { useRef, type ReactNode } from "react";
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
  return (
    <>
      <button
        className={cs("button")}
        onClick={() => dialog.current?.showModal()}
      >
        {label} <span aria-hidden="true">→</span>
      </button>
      <dialog ref={dialog} aria-label={title}>
        <button
          className={cs("dialog-close")}
          aria-label="Close matchup notes"
          onClick={() => dialog.current?.close()}
        >
          ✕
        </button>
        {children}
      </dialog>
    </>
  );
}
