/** Login destinations stay on this site and cannot point back into login
 * or an API. The same validation runs at the client and server boundary. */
export function safeLoginDestination(value: unknown): string {
  if (typeof value !== "string" || value.length > 2048 ||
      !value.startsWith("/") || value.startsWith("//") ||
      /[\\\s\u0000-\u001f\u007f]/.test(value)) return "/";
  try {
    const url = new URL(value, "https://login.invalid");
    if (url.origin !== "https://login.invalid") return "/";
    let pathname = url.pathname;
    for (let i = 0; i < 4; i++) {
      const decoded = decodeURIComponent(pathname);
      if (/[\\\u0000-\u001f\u007f]/.test(decoded) || decoded.startsWith("//")) return "/";
      if (decoded === pathname) break;
      pathname = decoded;
      if (i === 3) return "/";
    }
    // Canonicalize dot segments again after decoding before checking loops.
    pathname = new URL(pathname, "https://login.invalid").pathname;
    if (/^\/(?:api|_next|login|signup|claim|forgot-password|reset-password)(?:\/|$)/i.test(pathname) ||
        /^\/account\/(?:login|continue|setup)(?:\/|$)/i.test(pathname)) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export function loginContinuationHref(destination: unknown): string {
  const next = safeLoginDestination(destination);
  return `/account/continue${next === "/" ? "" : `?next=${encodeURIComponent(next)}`}`;
}
