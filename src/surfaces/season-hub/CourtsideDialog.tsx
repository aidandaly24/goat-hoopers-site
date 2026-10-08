"use client";

import { useRef, useState, type ReactNode } from "react";
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

/** Both the module and the existing GLB are requested only after inspection. */
export function FigurineDialog({
  teamId,
  name,
}: {
  teamId: string;
  name: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [Viewer, setViewer] = useState<React.ComponentType<{
    teamId: string;
    name: string;
  }> | null>(null);
  const [failed, setFailed] = useState(false);
  async function inspect() {
    setOpen(true);
    dialog.current?.showModal();
    try {
      const loaded = await import("@/three/CourtsideFigurine");
      setViewer(() => loaded.CourtsideFigurine);
    } catch {
      setFailed(true);
    }
  }
  return (
    <>
      <button
        className={cs("button", "secondary", "figurine-link")}
        onClick={inspect}
      >
        Inspect existing league figurine
      </button>
      <dialog
        ref={dialog}
        aria-label={`${name} league figurine`}
        onClose={() => setOpen(false)}
      >
        <button
          className={cs("dialog-close")}
          aria-label="Close figurine viewer"
          onClick={() => dialog.current?.close()}
        >
          ✕
        </button>
        <h2>{name}</h2>
        {open &&
          (Viewer ? (
            <Viewer teamId={teamId} name={name} />
          ) : (
            <p role="status">
              {failed
                ? "The optional viewer is unavailable. The team profile is still available."
                : "Loading the existing league figurine…"}
            </p>
          ))}
        <a className={cs("text-link")} href={`/teams/${teamId}`}>
          Full team profile <span aria-hidden="true">↗</span>
        </a>
      </dialog>
    </>
  );
}
