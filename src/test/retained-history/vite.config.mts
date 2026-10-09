import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: [
    { find: "next/link", replacement: fileURLToPath(new URL("../site-shell/link.tsx", import.meta.url)) },
    { find: "@", replacement: fileURLToPath(new URL("../../", import.meta.url)) },
  ] },
  define: { "process.env": JSON.stringify({ NODE_ENV: "development" }) },
  server: { host: "127.0.0.1", port: 0 },
});
