/** Small monochrome icons for control state; never decorative navigation markers. */
export function ControlIcon({ name }: { name: "close" | "check" | "sort" | "sort-up" | "sort-down" }) {
  const path = name === "close" ? "m6 6 12 12M6 18 18 6"
    : name === "check" ? "m5 12 4 4L19 6"
      : name === "sort-up" ? "m7 14 5-5 5 5"
        : name === "sort-down" ? "m7 10 5 5 5-5" : "m8 8 4-4 4 4M8 16l4 4 4-4";
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"
    style={{ flexShrink: 0, verticalAlign: "middle" }}><path d={path} /></svg>;
}
