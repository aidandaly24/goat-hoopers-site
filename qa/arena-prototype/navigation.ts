export { usePathname } from "../../src/test/site-shell/navigation";

// This read-only fixture never mounts the optional recorded-history API client.
// If future props mount it, refresh is explicit and remains local/offline.
const router = { refresh: () => window.location.reload() };
export const useRouter = () => router;
