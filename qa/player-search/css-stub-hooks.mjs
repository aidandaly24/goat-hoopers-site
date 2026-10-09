// Node module customization hooks: stub every `*.css` import with a
// class-name passthrough Proxy so production components can be server-rendered
// by tsx without a CSS-modules transform. Registered via `--import` before the
// entry point loads, so the hooks are in place before any CSS resolves.

export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith(".css")) {
    return { url: "stub:player-search-css", shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url === "stub:player-search-css") {
    return {
      format: "module",
      source:
        "export default new Proxy({}, { get: (_t, p) => (p === '__esModule' ? true : String(p)) });",
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
