import { THEME_BOOTSTRAP } from "./theme";

/** Root-only prepaint preference correction; html accepts this owned attribute. */
export function ThemeBootstrap() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />;
}
