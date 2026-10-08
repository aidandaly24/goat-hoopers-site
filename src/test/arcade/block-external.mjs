// Loopback browser fixture only. Loaded into its private Next.js process;
// public league fetches fail closed instead of contacting external services.
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, options) => {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  if (url.hostname !== "127.0.0.1") return Promise.reject(new Error("Arcade browser fixture blocks external fetches"));
  return originalFetch(input, options);
};
