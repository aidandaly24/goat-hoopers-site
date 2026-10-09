/** Public theme contract. Only explicit light/dark choices are stored. */
export type Theme = "light" | "dark";
export const THEME_STORAGE_KEY = "goat-hoopers.theme";
export const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";
export function parseTheme(value: string | null): Theme | null {
  return value === "light" || value === "dark" ? value : null;
}
export function resolveTheme(manual: Theme | null, systemDark: boolean): Theme {
  return manual ?? (systemDark ? "dark" : "light");
}

/** Static app-authored code, run in root head before first paint. No user input. */
export const THEME_BOOTSTRAP = `(function(){var t=null;try{t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}if(t!=="light"&&t!=="dark")t=typeof matchMedia==="function"&&matchMedia(${JSON.stringify(THEME_MEDIA_QUERY)}).matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)})()`;
