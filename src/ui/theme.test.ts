import { describe, expect, it } from "vitest";
import { runInNewContext } from "node:vm";
import { parseTheme, resolveTheme, THEME_BOOTSTRAP, THEME_STORAGE_KEY } from "./theme";

const cases = [
  [null, false, "light"], [null, true, "dark"],
  ["light", true, "light"], ["dark", false, "dark"],
  ["system", true, "dark"], ["", false, "light"],
  ["DARK", false, "light"], ["invalid", true, "dark"],
] as const;
describe("theme preference before paint", () => {
  it.each(cases)("saved %s / system dark=%s resolves %s", (saved, systemDark, expected) => {
    const attributes: Record<string, string> = {};
    runInNewContext(THEME_BOOTSTRAP, {
      localStorage: { getItem(key: string) { expect(key).toBe(THEME_STORAGE_KEY); return saved; } },
      matchMedia: () => ({ matches: systemDark }),
      document: { documentElement: { setAttribute(name: string, value: string) { attributes[name] = value; } } },
    });
    expect(attributes["data-theme"]).toBe(expected);
    expect(resolveTheme(parseTheme(saved), systemDark)).toBe(expected);
  });
  it.each([false, true])("denied storage follows system dark=%s", systemDark => {
    let theme = "";
    runInNewContext(THEME_BOOTSTRAP, {
      get localStorage() { throw new Error("Denied"); }, matchMedia: () => ({ matches: systemDark }),
      document: { documentElement: { setAttribute(_name: string, value: string) { theme = value; } } },
    });
    expect(theme).toBe(systemDark ? "dark" : "light");
  });
  it("missing system API and storage falls back to readable light", () => {
    let theme = "";
    runInNewContext(THEME_BOOTSTRAP, {
      document: { documentElement: { setAttribute(_name: string, value: string) { theme = value; } } },
    });
    expect(theme).toBe("light");
  });
});
