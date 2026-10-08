import { useMemo, useSyncExternalStore } from 'react';
/** Fixture adapter mirrors Next's native-history subscription, without a router. */
const replace = history.replaceState.bind(history);
history.replaceState = (...args) => { replace(...args); window.dispatchEvent(new Event('fixture-location')); };
const subscribe = (notify: () => void) => {
  window.addEventListener('fixture-location', notify); window.addEventListener('popstate', notify);
  return () => { window.removeEventListener('fixture-location', notify); window.removeEventListener('popstate', notify); };
};
export const usePathname = () => window.location.pathname;
export function useSearchParams() {
  const search = useSyncExternalStore(subscribe, () => location.search, () => '');
  return useMemo(() => new URLSearchParams(search), [search]);
}
