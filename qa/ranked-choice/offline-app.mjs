// Renderer-only fixture: refuse all upstream HTTP. No production DB credentials.
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  return ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
    ? originalFetch(input, init) : Promise.resolve(Response.json({ status: "unavailable" }, { status: 503 }));
};
