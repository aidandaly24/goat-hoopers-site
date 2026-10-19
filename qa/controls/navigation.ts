export { usePathname, useSearchParams } from "../paper-slate/navigation";
const router = {
  push: (path: string) => window.location.assign(path),
  replace: (path: string) => window.location.replace(path),
  refresh: () => window.location.reload(),
};
export const useRouter = () => router;
