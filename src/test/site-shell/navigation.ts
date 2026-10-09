import { useSyncExternalStore } from "react";

const subscribe = (notify: () => void) => {
  window.addEventListener("popstate", notify);
  return () => window.removeEventListener("popstate", notify);
};
export const usePathname = () => useSyncExternalStore(subscribe, () => window.location.pathname);
