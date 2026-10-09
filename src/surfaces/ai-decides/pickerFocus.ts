/** Next's Back/hash focus can run after dialog cleanup. Repair only lost body focus. */
export function restorePickerFocus(target: Pick<HTMLElement, "isConnected" | "focus">, path: string, dialog: Pick<HTMLDialogElement, "open">) {
  const valid = () => target.isConnected && window.location.pathname === path && !dialog.open;
  if (valid()) target.focus({ preventScroll: true });
  let frame = requestAnimationFrame(() => {
    frame = requestAnimationFrame(() => {
      if (valid() && (document.activeElement === document.body || document.activeElement === document.documentElement)) target.focus({ preventScroll: true });
    });
  });
  return () => cancelAnimationFrame(frame);
}
