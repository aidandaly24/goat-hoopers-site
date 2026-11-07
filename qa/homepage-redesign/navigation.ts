export { usePathname } from "../../src/test/site-shell/navigation";
// Offline fixture only: no recorded-history API client is mounted.
export const useRouter = () => ({ refresh: () => location.reload() });
