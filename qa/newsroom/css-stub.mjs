// Node module customization hooks: stub every `*.css` import with a
// class-name passthrough Proxy so production components can be server-rendered
// by tsx without a CSS-modules transform.
export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith(".css")) {
    return { url: "stub:newsroom-css", shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url === "stub:newsroom-css") {
    return {
      format: "module",
      source:
        "export default new Proxy({}, { get: (_t, p) => (p === '__esModule' ? true : String(p)) });",
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
