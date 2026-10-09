import { afterEach, describe, expect, it, vi } from "vitest";
import { restorePickerFocus } from "./pickerFocus";

afterEach(() => vi.unstubAllGlobals());

function fixture() {
  const body = {}, html = {}, document = { body, documentElement: html, activeElement: body };
  const location = { pathname: "/ai-decides" }, dialog = { open: false };
  const target = { isConnected: true, focus: vi.fn(() => { document.activeElement = target; }) };
  let id = 0;
  const frames = new Map<number, FrameRequestCallback>();
  vi.stubGlobal("document", document); vi.stubGlobal("window", { location });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.set(++id, callback); return id; });
  vi.stubGlobal("cancelAnimationFrame", (frame: number) => frames.delete(frame));
  const paint = () => { const current = [...frames]; frames.clear(); current.forEach(([, callback]) => callback(0)); };
  return { body, document, location, dialog, target, paint };
}

describe("picker dismissal focus", () => {
  it("restores the opener after Back/hash handling resets focus to BODY after cleanup", () => {
    const f = fixture(); restorePickerFocus(f.target, "/ai-decides", f.dialog);
    expect(f.document.activeElement).toBe(f.target);
    f.document.activeElement = f.body; f.paint();
    // Next/browser hash focus may settle during this paint, after React cleanup.
    f.document.activeElement = f.body; f.paint();
    expect(f.document.activeElement).toBe(f.target);
    expect(f.target.focus).toHaveBeenLastCalledWith({ preventScroll: true });
  });
  it("does not steal focus from the saved draft or another control", () => {
    const f = fixture(); restorePickerFocus(f.target, "/ai-decides", f.dialog);
    const draft = {}; f.document.activeElement = draft; f.paint(); f.paint();
    expect(f.document.activeElement).toBe(draft); expect(f.target.focus).toHaveBeenCalledTimes(1);
  });
  it("cancels a pending retry on reopen and guards route/unmount cleanup", () => {
    const f = fixture(); const cancel = restorePickerFocus(f.target, "/ai-decides", f.dialog);
    f.document.activeElement = f.body; f.paint(); cancel(); f.paint();
    expect(f.target.focus).toHaveBeenCalledTimes(1);
    restorePickerFocus(f.target, "/ai-decides", f.dialog);
    f.document.activeElement = f.body; f.dialog.open = true; f.location.pathname = "/fixture-away"; f.target.isConnected = false;
    f.paint(); f.paint(); expect(f.target.focus).toHaveBeenCalledTimes(2); expect(f.document.activeElement).toBe(f.body);
  });
});
