export function useRouter() { return { replace: (path: string) => window.location.replace(path), refresh: () => window.location.reload() }; }
